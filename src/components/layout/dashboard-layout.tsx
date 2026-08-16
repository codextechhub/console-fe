import { useEffect, useMemo, useRef, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { UserAvatar } from "@/components/custom/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppSidebar } from "../app-sidebar";
import { BookOpenText, ChevronLeft, ChevronRight, Loader2, LogOut, Search, ShieldCheck, Undo2, UserRound, UsersRound } from "lucide-react";
import { Outlet, useLocation, useMatches, useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { useTokenRefresh } from "@/hooks/use-token-refresh";
import { useSessionTimeout } from "@/hooks/use-session-timeout";
import { SessionTimeoutModal } from "@/components/session-timeout-modal";
import { startNavigationProgress, TopProgressBar } from "@/components/custom/top-progress-bar";
import { NotificationsBell } from "@/components/custom/notifications-bell";
import { useLogout } from "@/hooks/use-logout";
import useToggleModal from "@/hooks/use-toggle";
import PromptModal from "@/components/modal/prompt-modal";
import { routesPath } from "@/routes/routes-path";
import { useWorkspaceSearch } from "@/hooks/use-workspace-search";
import { groupByConsole } from "@/lib/action-palette";
import type { ActionDef } from "@/lib/action-palette";
import { SupportTicketComposer } from "@/components/support-ticket-composer";
import { ProxyUserDialog } from "@/components/proxy-user-dialog";
import { setAuthContext, setImpersonation } from "@/redux/features/auth/auth-slice";
import { useEndImpersonationMutation } from "@/redux/services/dashboard/security-api";
import { baseApi, runWithIdentitySwap } from "@/redux/services/base-api";
import { authApi } from "@/redux/services/auth/auth-api";
import { toast, useSonner } from "sonner";
import { clearSelectedEntity } from "@/redux/features/finance/entity-slice";
import { useAcknowledgeNotificationRouteMutation } from "@/redux/services/notifications-api";
import { isPrimaryShortcut, isPrimaryShiftShortcut } from "@/utils/keyboard-shortcuts";
import {
  DashboardHeaderContext,
  mergeHandles,
  resolveHeader,
  type DashboardHeaderApi,
  type HeaderOverride,
  type ResolvedHeader,
  type SidebarKind,
} from "./dashboard-header";
import { ConsoleSidebar } from "@/components/finance-ui/console-sidebar";
import { financeNav } from "@/pages/protected/finance/finance-nav";
import { procurementNav } from "@/pages/protected/procurement/procurement-nav";
import { getWorkspaceToastCenter, WorkspaceToaster } from "@/components/ui/sonner";
import type { StaffProfileListItem } from "@/redux/services/dashboard/organogram-types";
import type { GuideRecord } from "@/features/guides";
import { buildSafeTicketContext, contextualGuideContext, GUIDE_REGISTRY, WalkthroughProvider } from "@/features/guides";
import { buildWorkspaceSearchRows, getWorkspaceSearchIdentityKey, isWorkspaceSearchSelf, WORKSPACE_SEARCH_OPEN_EVENT } from "./workspace-search-model";
import {
  EntitySelect,
  shouldSuspendEntitySwitcher,
} from "@/components/finance-ui/entity-select";

function DashboardHeader({
  back,
  title,
  showEntitySwitcher = false,
  pathname,
}: ResolvedHeader & { showEntitySwitcher?: boolean; pathname: string }) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const user = auth.user;
  const impersonation = auth.impersonation ?? null;
  const pageGuideContext = useMemo(
    () => contextualGuideContext(GUIDE_REGISTRY, pathname, auth.permissions ?? []),
    [auth.permissions, pathname],
  );
  const ticketContext = useMemo(() => buildSafeTicketContext(pageGuideContext), [pageGuideContext]);
  const { state, toggleSidebar } = useSidebar();
  // The protected layout stays mounted across ordinary route changes, so local
  // state naturally preserves an unfinished query. Identity changes are a
  // harder boundary: a direct session and each proxy session start clean.
  const [search, setSearch] = useState("");
  const searchIdentityKey = getWorkspaceSearchIdentityKey(user?.id, impersonation?.id);
  const previousSearchIdentityRef = useRef(searchIdentityKey);
  const [activeResult, setActiveResult] = useState(0);
  // Whether the results dropdown is showing - follows focus, independent of the
  // (persisted) text: click-away closes it, refocusing reopens it.
  const [resultsOpen, setResultsOpen] = useState(false);
  // Collapsed shows the top few matches + a "show all" row; expanded shows every
  // match, grouped by console, in a scrollable box. Resets on each query change.
  const [resultsExpanded, setResultsExpanded] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { toasts: activeToasts } = useSonner();
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const searchShortcutLabel = useMemo(
    () => (/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "⌘ E" : "Ctrl E"),
    [],
  );
  const logoutShortcutLabel = useMemo(
    () => (/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "⌘ ⇧ L" : "Ctrl Shift L"),
    [],
  );
  const [proxyOpen, setProxyOpen] = useState(false);
  const [endImpersonation, { isLoading: isEndingProxy }] = useEndImpersonationMutation();
  const { handleLogout, isLoggingOut } = useLogout();
  const {
    isOpen: openLogout,
    toggleClose: closeLogout,
    toggleOpen: showLogout,
  } = useToggleModal(false);
  const actorPermissions = impersonation?.actor.permissions ?? auth.permissions ?? [];
  const canProxy = actorPermissions.some((permission) =>
    [
      "platform.impersonation.start_all",
      "platform.impersonation.start_cx",
      "platform.impersonation.start_school",
    ].includes(permission),
  );

  useEffect(() => {
    if (previousSearchIdentityRef.current === searchIdentityKey) return;
    previousSearchIdentityRef.current = searchIdentityKey;
    setSearch("");
    setActiveResult(0);
    setResultsOpen(false);
    setResultsExpanded(false);
    setMobileSearchOpen(false);
  }, [searchIdentityKey]);

  useEffect(() => {
    // Shared by the keyboard shortcut and the WORKSPACE_SEARCH_OPEN_EVENT that
    // in-page affordances (the overview's "More actions" chip) dispatch.
    const focusSearchInput = () => {
      // Select any persisted text so the user can either continue (arrows /
      // Enter reuse it) or just type to start a fresh query.
      if (window.matchMedia("(min-width: 1024px)").matches) {
        desktopSearchRef.current?.focus();
        desktopSearchRef.current?.select();
        return;
      }

      setMobileSearchOpen(true);
      requestAnimationFrame(() => {
        mobileSearchRef.current?.focus();
        mobileSearchRef.current?.select();
      });
    };

    const focusWorkspaceSearch = (event: KeyboardEvent) => {
      if (!isPrimaryShortcut(event, "KeyE")) return;
      event.preventDefault();
      focusSearchInput();
    };

    window.addEventListener("keydown", focusWorkspaceSearch);
    window.addEventListener(WORKSPACE_SEARCH_OPEN_EVENT, focusSearchInput);
    return () => {
      window.removeEventListener("keydown", focusWorkspaceSearch);
      window.removeEventListener(WORKSPACE_SEARCH_OPEN_EVENT, focusSearchInput);
    };
  }, []);

  useEffect(() => {
    const openLogoutConfirmation = (event: KeyboardEvent) => {
      if (!isPrimaryShiftShortcut(event, "KeyL")) return;
      event.preventDefault();
      showLogout();
    };

    window.addEventListener("keydown", openLogoutConfirmation);
    return () => window.removeEventListener("keydown", openLogoutConfirmation);
  }, [showLogout]);

  const exitProxy = async () => {
    if (!impersonation || isEndingProxy) return;
    let endedOnServer = false;
    try {
      await endImpersonation({ session_id: impersonation.id }).unwrap();
      endedOnServer = true;
    } catch {
      // Restore the actor locally even when the already-ended session returns
      // an error; a future proxy start atomically closes any stale server row.
    } finally {
      // Gate the swap so the target's still-mounted screens cannot refire
      // their queries under the restored actor identity (misleading 403s,
      // e.g. a school screen the platform actor cannot read).
      await runWithIdentitySwap(async () => {
        dispatch(setImpersonation(null));
        dispatch(setAuthContext(impersonation.actor));
        dispatch(clearSelectedEntity());
        await navigate(routesPath.PROTECTED.OVERVIEW.INDEX, { replace: true });
        try {
          await dispatch(
            authApi.endpoints.getMe.initiate(undefined, {
              forceRefetch: true,
              subscribe: false,
            }),
          ).unwrap();
        } catch {
          // The retained actor snapshot keeps the account usable until refetch.
        }
      });
      // Reset AFTER the gate lifts so everything refetches under the actor.
      dispatch(baseApi.util.resetApiState());
      if (endedOnServer) toast.success("Proxy session ended");
    }
  };
  // Workspace search keeps action ranking local and adds a small, debounced,
  // permission-scoped people lookup from the chart-safe staff list endpoint.
  const {
    results,
    total,
    onLaunch,
    guides,
    people,
    peopleTotal,
    peopleLoading,
    peopleError,
    canSearchPeople,
    peopleQueryTooShort,
    peopleQueryTooLong,
  } = useWorkspaceSearch(search);

  // Collapsed shows the top few; a broad query ("v") can match dozens, so the
  // rest hide behind a keyboard-reachable "show all" row.
  const COLLAPSED_COUNT = 4;
  const hasMore = !resultsExpanded && total > COLLAPSED_COUNT;

  // Actions in the order they visually appear (== the order arrows traverse):
  // collapsed = ranked top-N; expanded = grouped by console (fixed order),
  // preserving relevance within each group.
  const visualActions = useMemo(
    () => (resultsExpanded ? groupByConsole(results).flatMap((g) => g.items) : results.slice(0, COLLAPSED_COUNT)),
    [resultsExpanded, results],
  );
  // Actions, then the optional expansion row, Guides, then People: this is both the
  // visual order and the order traversed by ArrowUp/ArrowDown.
  const searchRows = useMemo(
    () => buildWorkspaceSearchRows(visualActions, hasMore, guides, people),
    [guides, hasMore, people, visualActions],
  );
  const indexByActionId = useMemo(() => {
    const m = new Map<string, number>();
    searchRows.forEach((row, index) => {
      if (row.kind === "action") m.set(row.action.action.id, index);
    });
    return m;
  }, [searchRows]);
  const indexByPersonId = useMemo(() => {
    const m = new Map<number, number>();
    searchRows.forEach((row, index) => {
      if (row.kind === "person") m.set(row.person.id, index);
    });
    return m;
  }, [searchRows]);
  const indexByGuideId = useMemo(() => {
    const m = new Map<string, number>();
    searchRows.forEach((row, index) => {
      if (row.kind === "guide") m.set(row.guide.guide.id, index);
    });
    return m;
  }, [searchRows]);
  const showAllIndex = searchRows.findIndex((row) => row.kind === "show-all-actions");
  const navCount = searchRows.length;

  // Run an action: remember the pick (adaptive + frecency) FIRST - while `search`
  // still holds the query - then clear the bar (acting on a result finishes the
  // search; click-away, which keeps the text, is the "resume later" path) and
  // navigate or fire the header command (proxy/logout).
  const launchAction = (action: ActionDef) => {
    onLaunch(action, search);
    setSearch("");
    setActiveResult(0);
    setResultsOpen(false);
    setResultsExpanded(false);
    setMobileSearchOpen(false);
    if ("command" in action.run) {
      if (action.run.command === "proxy") setProxyOpen(true);
      else showLogout();
      return;
    }
    startNavigationProgress();
    navigate(action.run.to);
  };

  const launchPerson = (person: StaffProfileListItem) => {
    setSearch("");
    setActiveResult(0);
    setResultsOpen(false);
    setResultsExpanded(false);
    setMobileSearchOpen(false);
    startNavigationProgress();
    navigate(
      isWorkspaceSearchSelf(person.user.id, user?.id)
        ? routesPath.PROTECTED.ME_PROFILE.INDEX
        : routesPath.PROTECTED.ORGANOGRAM.STAFF_BY_USER(person.user.id),
    );
  };

  const launchGuide = (guide: GuideRecord) => {
    setSearch("");
    setActiveResult(0);
    setResultsOpen(false);
    setResultsExpanded(false);
    setMobileSearchOpen(false);
    startNavigationProgress();
    navigate(routesPath.PROTECTED.SUPPORT.GUIDE_DETAIL(guide.slug));
  };

  const updateSearch = (value: string) => {
    setSearch(value);
    setActiveResult(0);
    setResultsExpanded(false); // a new query collapses back to the top matches
    setResultsOpen(true);
  };

  // Arrow keys move the highlight (wrapping over the "show all" row too), Enter
  // activates it. preventDefault stops the browser scrolling the page instead.
  // With the dropdown closed (after Escape), arrows reopen it and Enter is inert.
  const handleResultNavigation = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!resultsOpen) {
        setResultsOpen(true);
        return;
      }
      if (!navCount) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveResult((index) => (index + step + navCount) % navCount);
      return;
    }
    if (event.key === "Enter" && resultsOpen) {
      // Acting on a result is the whole point of this Enter, so cancel the key's
      // default action. Without this, launching anything that mounts a focusable
      // control in the same keystroke (the logout confirm, the proxy dialog)
      // hands the browser a new focus target before it runs Enter's default,
      // which then arrives as a click on whatever Radix just focused: the
      // confirm dialog opened and its Cancel button was pressed by the same
      // keypress, so it appeared to flash and vanish.
      event.preventDefault();
      const target = searchRows[activeResult] ?? searchRows[0];
      if (target?.kind === "show-all-actions") expandResults();
      else if (target?.kind === "action") launchAction(target.action.action);
      else if (target?.kind === "guide") launchGuide(target.guide.guide);
      else if (target?.kind === "person") launchPerson(target.person);
    }
  };

  const expandResults = () => {
    setResultsExpanded(true);
    setActiveResult(0);
  };

  // One result row. `scrollActive` keeps the highlighted row in view inside the
  // scrollable expanded box as arrows move through it.
  const renderOption = (action: ActionDef, index: number, variant: "desktop" | "mobile") => (
    <button
      key={action.id}
      id={`workspace-search-option-${variant}-${index}`}
      ref={index === activeResult ? (el) => el?.scrollIntoView({ block: "nearest" }) : undefined}
      type="button"
      role="option"
      aria-selected={index === activeResult}
      onMouseDown={(event) => event.preventDefault()}
      onMouseEnter={() => setActiveResult(index)}
      onClick={() => launchAction(action)}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left ${index === activeResult ? "bg-gray-50" : ""}`}
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-black-01">{action.label}</span>
        <span className="block truncate text-[11px] text-gray-400">
          {action.console === "Main" ? action.group : `${action.console} · ${action.group}`}
        </span>
      </span>
      {action.kind === "do"
        ? <span className="ml-2 shrink-0 rounded-md bg-primary/8 px-1.5 py-0.5 text-[10px] font-medium text-primary">Action</span>
        : <ChevronRight className="ml-2 size-4 shrink-0 text-gray-300" />}
    </button>
  );

  const renderPersonOption = (person: StaffProfileListItem, index: number, variant: "desktop" | "mobile") => {
    const role = person.job_title || person.position?.title || "Staff member";
    const context = [role, person.department?.name].filter(Boolean).join(" · ");
    return (
      <button
        key={person.id}
        id={`workspace-search-option-${variant}-${index}`}
        ref={index === activeResult ? (el) => el?.scrollIntoView({ block: "nearest" }) : undefined}
        type="button"
        role="option"
        aria-selected={index === activeResult}
        onMouseDown={(event) => event.preventDefault()}
        onMouseEnter={() => setActiveResult(index)}
        onClick={() => launchPerson(person)}
        className={`flex w-full min-w-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left ${index === activeResult ? "bg-gray-50" : ""}`}
      >
        <UserAvatar
          userId={person.user.id}
          name={person.user.full_name}
          className="size-8 shrink-0"
          fallbackClassName="text-[10px]"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-black-01">{person.user.full_name}</span>
          <span className="block truncate text-[11px] text-gray-400">{context}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-gray-300" />
      </button>
    );
  };

  const renderGuideOption = (guide: GuideRecord, index: number, variant: "desktop" | "mobile") => (
    <button
      key={guide.id}
      id={`workspace-search-option-${variant}-${index}`}
      ref={index === activeResult ? (el) => el?.scrollIntoView({ block: "nearest" }) : undefined}
      type="button"
      role="option"
      aria-selected={index === activeResult}
      onMouseDown={(event) => event.preventDefault()}
      onMouseEnter={() => setActiveResult(index)}
      onClick={() => launchGuide(guide)}
      className={`flex w-full min-w-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left ${index === activeResult ? "bg-gray-50" : ""}`}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary">
        <BookOpenText className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-black-01">{guide.title}</span>
        <span className="block truncate text-[11px] text-gray-400">How-to guide</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-gray-300" />
    </button>
  );

  const renderSearchResults = (variant: "desktop" | "mobile") => (
    <div
      id={`workspace-search-listbox-${variant}`}
      role="listbox"
      aria-label="Workspace search results"
      className={`absolute left-0 z-50 w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl ${variant === "desktop" ? "top-11" : "top-12"}`}
    >
      <div className="max-h-[min(60vh,30rem)] overflow-y-auto">
        {visualActions.length > 0 && (
          <section aria-labelledby={`workspace-search-actions-${variant}`}>
            <p
              id={`workspace-search-actions-${variant}`}
              className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400"
            >
              Actions
            </p>
            {resultsExpanded ? groupByConsole(results).map((group) => (
              <div key={group.console}>
                <p className="px-3 pb-0.5 pt-1.5 text-[10px] font-medium text-gray-300">
                  {group.console === "Main" ? "Main console" : group.console}
                </p>
                {group.items.map((r) => renderOption(r.action, indexByActionId.get(r.action.id) ?? -1, variant))}
              </div>
            )) : visualActions.map((r) => renderOption(r.action, indexByActionId.get(r.action.id) ?? -1, variant))}
            {hasMore && (
              <button
                id={`workspace-search-option-${variant}-${showAllIndex}`}
                type="button"
                role="option"
                aria-selected={activeResult === showAllIndex}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveResult(showAllIndex)}
                onClick={expandResults}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium text-primary ${activeResult === showAllIndex ? "bg-gray-50" : ""}`}
              >
                <span>Showing top {COLLAPSED_COUNT} of {total}</span>
                <span className="inline-flex items-center gap-0.5">Show all <ChevronRight className="size-3.5" /></span>
              </button>
            )}
          </section>
        )}

        {guides.length > 0 && (
          <section aria-labelledby={`workspace-search-guides-${variant}`}>
            <p
              id={`workspace-search-guides-${variant}`}
              className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400"
            >
              Guides
            </p>
            {guides.map(({ guide }) => renderGuideOption(guide, indexByGuideId.get(guide.id) ?? -1, variant))}
          </section>
        )}

        {people.length > 0 && (
          <section aria-labelledby={`workspace-search-people-${variant}`}>
            <p
              id={`workspace-search-people-${variant}`}
              className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400"
            >
              People
            </p>
            {people.map((person) => renderPersonOption(person, indexByPersonId.get(person.id) ?? -1, variant))}
            {peopleTotal > people.length && (
              <p className="px-3 py-1.5 text-[10px] text-gray-400">
                Showing {people.length} of {peopleTotal} people. Type more to narrow the results.
              </p>
            )}
          </section>
        )}

        {peopleLoading && (
          <p className="flex items-center justify-center gap-1.5 px-3 py-3 text-xs text-gray-400">
            <Loader2 className="size-3.5 animate-spin" /> Searching people…
          </p>
        )}
        {searchRows.length === 0 && !peopleLoading && (
          <p className="px-3 py-4 text-center text-xs text-gray-400">
            {peopleError
              ? "People search is temporarily unavailable."
              : peopleQueryTooLong
                ? "Use 64 characters or fewer to search people."
                : peopleQueryTooShort
                  ? "Keep typing to search people."
                  : canSearchPeople
                    ? "No accessible actions, guides, or people found."
                    : "No accessible actions or guides found."}
          </p>
        )}
      </div>
    </div>
  );

  const showResults = resultsOpen && Boolean(search.trim());
  const entitySwitcherSuspended = shouldSuspendEntitySwitcher({
    searchResultsOpen: showResults,
    mobileSearchOpen,
    activeToastCount: activeToasts.length,
  });

  const searchComboboxProps = (variant: "desktop" | "mobile") => ({
    role: "combobox" as const,
    "aria-expanded": showResults,
    "aria-controls": `workspace-search-listbox-${variant}`,
    "aria-activedescendant": showResults && activeResult < searchRows.length
      ? `workspace-search-option-${variant}-${activeResult}`
      : undefined,
    onFocus: () => setResultsOpen(true),
    onBlur: () => setResultsOpen(false),
  });

  // `sticky` is itself a positioned context for the absolute children
  // (collapse toggle, progress bar, entity switcher) - adding `relative` would
  // conflict. The entity switcher must remain a true overlay: reserving margin
  // here would move every Finance and Procurement screen when it appears.
  return (
    <header className="grid min-h-15 shrink-0 sticky top-0 z-50 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 border border-l-0 border-white-02 bg-white px-3 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:min-h-12 lg:px-10">
      {/* Sidebar collapse toggle - on the left border, vertically centered in the header */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 size-6 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-01 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
      >
        {state === "collapsed" ? (
          <ChevronRight className="size-3" />
        ) : (
          <ChevronLeft className="size-3" />
        )}
      </button>

      <div className="inline-flex min-w-0 items-center gap-2">
        <SidebarTrigger className="md:hidden size-8" />

        {back !== undefined && (
          <>
            <figure
              onClick={() => {
                // A closure destination (useDashboardBack) runs as-is; a route
                // string navigates there; `true` is plain history-back.
                if (typeof back === "function") {
                  back();
                  return;
                }
                startNavigationProgress();
                if (typeof back === "string") navigate(back);
                else navigate(-1);
              }}
              className="uppercase font-light text-gray-01 text-sm inline-flex items-center cursor-pointer"
            >
              <ChevronLeft className="text-inherit size-5 mr-1" />
              Back
            </figure>
            <Separator
              orientation="vertical"
              className="rotate-10 w-[1.2px] bg-black-01 data-[orientation=vertical]:h-7"
            />
          </>
        )}

        <h6 className="truncate text-sm font-semibold uppercase tracking-wide text-black-01 sm:text-base">
          {title || "Home"}
        </h6>
      </div>
      <div className="absolute left-1/2 top-1/2 hidden w-[min(38vw,430px)] -translate-x-1/2 -translate-y-1/2 lg:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <input
          data-guide="header.workspace-search"
          ref={desktopSearchRef}
          value={search}
          onChange={(event) => updateSearch(event.target.value)}
          onKeyDown={(event) => {
            handleResultNavigation(event);
            if (event.key === "Escape") setResultsOpen(false);
          }}
          aria-label="Search the workspace"
          aria-keyshortcuts="Control+E Meta+E"
          placeholder="Search the workspace"
          {...searchComboboxProps("desktop")}
          className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50/70 pl-9 pr-17 text-sm outline-none transition placeholder:text-gray-400 focus:border-primary/35 focus:bg-white focus:ring-3 focus:ring-primary/8"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold tracking-wide text-gray-400 shadow-sm">
          {searchShortcutLabel}
        </kbd>
        {showResults && renderSearchResults("desktop")}
      </div>
      <TopProgressBar />
      {showEntitySwitcher && (
        <div className="pointer-events-none absolute left-1/2 top-full z-40 mt-2 -translate-x-1/2">
          <EntitySelect suspended={entitySwitcherSuspended} />
        </div>
      )}
      <div className="inline-flex items-center gap-x-1 sm:gap-x-3">
        <button
          type="button"
          data-guide="header.workspace-search"
          aria-label={mobileSearchOpen ? "Close workspace search" : "Search the workspace"}
          aria-expanded={mobileSearchOpen}
          onClick={() => setMobileSearchOpen((open) => !open)}
          className="grid size-8.5 place-content-center rounded-full bg-gray-04 text-gray-700 lg:hidden"
        >
          <Search className="size-4.5" />
        </button>
        <NotificationsBell />
        <SupportTicketComposer pageContext={pageGuideContext} ticketContext={ticketContext} />

        <Separator
          orientation="vertical"
          className="hidden sm:block data-[orientation=vertical]:h-7"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Open account menu"
              className="inline-flex rounded-full p-1 hover:bg-white-02/60 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <UserAvatar userId={user?.id} name={user?.full_name ?? "O"} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span className="truncate font-medium text-black-01">{user?.full_name || ""}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">{user?.email || ""}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(routesPath.PROTECTED.ME_PROFILE.INDEX)}>
              <UserRound className="size-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(routesPath.PROTECTED.ME_SECURITY.OVERVIEW)}>
              <ShieldCheck className="size-4" />
              My Security
            </DropdownMenuItem>
            {canProxy && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setProxyOpen(true)}>
                  <UsersRound className="size-4" />
                  Proxy user
                </DropdownMenuItem>
                {impersonation && (
                  <DropdownMenuItem disabled={isEndingProxy} onClick={exitProxy}>
                    {isEndingProxy ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
                    Exit proxy
                  </DropdownMenuItem>
                )}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              aria-keyshortcuts="Control+Shift+L Meta+Shift+L"
              onClick={showLogout}
            >
              <LogOut className="size-4" />
              Logout
              <kbd className="ml-auto rounded border border-error-01/15 bg-error-01/5 px-1.5 py-0.5 font-sans text-[9px] font-semibold tracking-wide text-error-01/70">
                {logoutShortcutLabel}
              </kbd>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProxyUserDialog open={proxyOpen} onOpenChange={setProxyOpen} />

      {mobileSearchOpen && (
        <div className="relative col-span-2 mb-3 mt-1 lg:hidden">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={mobileSearchRef}
            autoFocus
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            onKeyDown={(event) => {
              handleResultNavigation(event);
              if (event.key === "Escape") {
                setResultsOpen(false);
                setMobileSearchOpen(false);
              }
            }}
            aria-label="Search the workspace"
            aria-keyshortcuts="Control+E Meta+E"
            placeholder="Search the workspace"
            {...searchComboboxProps("mobile")}
            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-17 text-sm outline-none focus:border-primary/35 focus:bg-white focus:ring-3 focus:ring-primary/8"
          />
          <kbd className="pointer-events-none absolute right-2 top-5 -translate-y-1/2 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold tracking-wide text-gray-400 shadow-sm">
            {searchShortcutLabel}
          </kbd>
          {showResults && renderSearchResults("mobile")}
        </div>
      )}

      <PromptModal
        isOpen={openLogout}
        onClose={closeLogout}
        onConfirm={handleLogout}
        title="Log Out?"
        description="Are you sure you want to log out of your account?"
        containerClass="min-h-[320px] lg:w-[390px]"
        srcClass="size-25"
        src="/image/caution.png"
        onConfirmText="Log Out"
        canCancel
        loading={isLoggingOut}
        onConfirmClass="bg-error-01 text-white shadow-xs hover:bg-error-01/90 focus-visible:ring-error-01/20"
      />
    </header>
  );
}

function getSidebarDefaultOpen(): boolean {
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("sidebar_state="));
  if (!cookie) return true;
  return cookie.split("=")[1] !== "false";
}

// Left navigation for the current route. The Finance/Procurement consoles swap
// the global menu for their own; the *choice* is route-owned (handle.sidebar)
// while each console still builds its own nav config.
function SidebarFor({ kind }: { kind: SidebarKind | undefined }) {
  if (kind === "finance") return <ConsoleSidebar title="Finance" nav={financeNav} />;
  if (kind === "procurement") return <ConsoleSidebar title="Procurement" nav={procurementNav} />;
  return <AppSidebar />;
}

function DashboardToaster() {
  const { state } = useSidebar();

  // The connectivity banner is mounted at the app root (it also covers the auth
  // and public screens), so it cannot read the sidebar state itself. Publish the
  // same centre the toasts use, and it lines up with them and with the content
  // instead of drifting under the sidebar. Absent on auth/public pages, where
  // the banner's own `50%` fallback is already correct.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--workspace-center", getWorkspaceToastCenter(state));
    return () => {
      root.style.removeProperty("--workspace-center");
    };
  }, [state]);

  return <WorkspaceToaster sidebarState={state} />;
}

/**
 * The protected shell, mounted as a LAYOUT ROUTE above every protected page
 * (routes/protected/index.tsx) rather than imported by each page. It ships in
 * the entry bundle and paints as soon as the app boots, instead of sitting in a
 * shared chunk that every lazy page had to wait on.
 *
 * Per-screen header config arrives via route `handle` metadata, with
 * `useDashboardTitle`/`useDashboardBack` as the runtime escape hatch - see
 * dashboard-header.ts.
 */
export default function DashboardLayout() {
  useTokenRefresh();
  const location = useLocation();
  const pathname = location.pathname;
  const [acknowledgeNotificationRoute] = useAcknowledgeNotificationRouteMutation();
  const { open, secondsLeft, isExpired, onContinue, onLogout, goToLogin } = useSessionTimeout();

  useEffect(() => {
    void acknowledgeNotificationRoute({ path: pathname });
  }, [acknowledgeNotificationRoute, pathname]);

  const matches = useMatches();
  const handle = useMemo(() => mergeHandles(matches), [matches]);

  // Runtime header overrides, stamped with the location that set them. Stamping
  // (rather than clearing on navigation) is what makes the reset race-free: a
  // child's effect runs before the parent's, so a parent-side "clear on nav"
  // would wipe the incoming screen's freshly-set title.
  const [override, setOverride] = useState<HeaderOverride | null>(null);
  const locationKey = location.key;
  const headerApi = useMemo<DashboardHeaderApi>(
    () => ({
      setTitle: (title) =>
        setOverride((prev) =>
          prev?.key === locationKey && prev.title === title
            ? prev
            : { ...(prev?.key === locationKey ? prev : {}), key: locationKey, title },
        ),
      setBack: (back) =>
        setOverride((prev) =>
          prev?.key === locationKey && prev.back === back
            ? prev
            : { ...(prev?.key === locationKey ? prev : {}), key: locationKey, back },
        ),
    }),
    [locationKey],
  );

  const header = resolveHeader(handle, override, locationKey);

  return (
    <WalkthroughProvider>
    <DashboardHeaderContext value={headerApi}>
      <SessionTimeoutModal
        open={open}
        secondsLeft={secondsLeft}
        isExpired={isExpired}
        onContinue={onContinue}
        onLogout={onLogout}
        goToLogin={goToLogin}
      />
      <SidebarProvider defaultOpen={getSidebarDefaultOpen()}>
        <SidebarFor kind={handle.sidebar} />
        <SidebarInset className="bg-white-05 min-w-0 w-auto">
          <DashboardHeader
            back={header.back}
            title={header.title}
            showEntitySwitcher={handle.sidebar === "finance" || handle.sidebar === "procurement"}
            pathname={pathname}
          />
          <DashboardToaster />
          {/* grid-cols-1 (minmax(0,1fr)) zeroes the track's min-content floor so a
              page's <main> can never be stretched past the viewport by wide
              nowrap content (tables) - each page's own overflow-x-auto then
              clips it. Without this every page needed its own min-w-0. */}
          <div className="grid grid-cols-1 min-w-0 pt-0">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </DashboardHeaderContext>
    </WalkthroughProvider>
  );
}
