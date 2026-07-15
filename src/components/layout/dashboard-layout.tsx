import { useMemo, useState } from "react";
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
import { ChevronLeft, ChevronRight, LogOut, Search, ShieldCheck, UserRound } from "lucide-react";
import { useNavigate } from "react-router";
import { useAppSelector } from "@/redux/store";
import { useTokenRefresh } from "@/hooks/use-token-refresh";
import { useSessionTimeout } from "@/hooks/use-session-timeout";
import { SessionTimeoutModal } from "@/components/session-timeout-modal";
import { TopProgressBar } from "@/components/custom/top-progress-bar";
import { NotificationsBell } from "@/components/custom/notifications-bell";
import { useLogout } from "@/hooks/use-logout";
import useToggleModal from "@/hooks/use-toggle";
import PromptModal from "@/components/modal/prompt-modal";
import { routesPath } from "@/routes/routes-path";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { SupportTicketComposer } from "@/components/support-ticket-composer";

function DashboardHeader({
  hasBack,
  onBack,
  title,
}: {
  hasBack: boolean;
  onBack?: () => void;
  title?: string;
}) {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const { state, toggleSidebar } = useSidebar();
  const { hasPermission, hasModuleAccess } = usePermissions();
  const [search, setSearch] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { handleLogout, isLoggingOut } = useLogout();
  const { isOpen: openLogout, toggleClick: toggleLogout } = useToggleModal(false);
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return [
      { label: "Home", detail: "Admin overview", to: routesPath.PROTECTED.OVERVIEW.INDEX, show: true },
      { label: "School Management", detail: "Schools and branches", to: routesPath.PROTECTED.SCHOOL_MGT.INDEX, show: hasPermission(P.BROWSE_SCHOOLS) },
      { label: "CX Users", detail: "Platform people and invitations", to: routesPath.PROTECTED.TEAM_MGT.CX, show: hasPermission(P.ACCESS_TEAM_PANEL) },
      { label: "School Users", detail: "School accounts and invitations", to: routesPath.PROTECTED.TEAM_MGT.SCHOOL, show: hasPermission(P.ACCESS_TEAM_PANEL) },
      { label: "Organogram", detail: "Structure and reporting", to: routesPath.PROTECTED.ORGANOGRAM.INDEX, show: hasPermission(P.VIEW_ORGANOGRAM) },
      { label: "Tasks", detail: "Goals and accountability", to: routesPath.PROTECTED.TODO.INDEX, show: true },
      { label: "Roles", detail: "Roles and assignments", to: routesPath.PROTECTED.ROLES.INDEX, show: hasPermission(P.VIEW_ROLES) },
      { label: "Permissions", detail: "Permission registry", to: routesPath.PROTECTED.PERMISSIONS.INDEX, show: hasPermission(P.VIEW_PERMISSIONS) },
      { label: "Data Imports", detail: "Batches and templates", to: routesPath.PROTECTED.DATA_IMPORTS.BATCHES.INDEX, show: hasPermission(P.VIEW_IMPORT_BATCHES) || hasPermission(P.VIEW_IMPORT_TEMPLATES) },
      { label: "Export", detail: "Export queues", to: routesPath.PROTECTED.EXPORT.QUEUES, show: true },
      { label: "Workflow", detail: "Approvals and submissions", to: routesPath.PROTECTED.WORKFLOW.APPROVALS, show: true },
      { label: "Audit & Security", detail: "Events and safeguards", to: routesPath.PROTECTED.AUDIT.DASHBOARD, show: hasPermission(P.VIEW_AUDIT) },
      { label: "System Health", detail: "Services and incidents", to: routesPath.PROTECTED.HEALTH.INDEX, show: hasPermission(P.VIEW_HEALTH) },
      { label: "Notifications", detail: "Your updates", to: routesPath.PROTECTED.NOTIFICATIONS, show: true },
      { label: "Settings", detail: "Platform configuration", to: routesPath.PROTECTED.SETTINGS.INDEX, show: true },
      { label: "Support", detail: "Tickets and assistance", to: routesPath.PROTECTED.SUPPORT.INDEX, show: true },
      { label: "My Profile", detail: "Personal details", to: routesPath.PROTECTED.ME_PROFILE.INDEX, show: true },
      { label: "My Security", detail: "Password and sessions", to: routesPath.PROTECTED.ME_SECURITY.OVERVIEW, show: true },
      { label: "Finance", detail: "Finance console", to: routesPath.PROTECTED.FINANCE.INDEX, show: hasModuleAccess("finance.", "payments.") },
      { label: "Procurement", detail: "Procurement console", to: routesPath.PROTECTED.PROCUREMENT.INDEX, show: hasModuleAccess("procurement.") },
    ].filter((item) => item.show && `${item.label} ${item.detail}`.toLowerCase().includes(q)).slice(0, 6);
  }, [hasModuleAccess, hasPermission, search]);

  const openSearchResult = (to: string) => {
    setSearch("");
    setMobileSearchOpen(false);
    navigate(to);
  };

  // `sticky` is itself a positioned context for the absolute children
  // (collapse toggle, progress bar) — adding `relative` would conflict.
  return (
    <header className="grid min-h-15 shrink-0 sticky top-0 z-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 border border-l-0 border-white-02 bg-white px-3 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:min-h-12 lg:px-10">
      {/* Sidebar collapse toggle — on the left border, vertically centered in the header */}
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

        {hasBack && (
          <>
            <figure
              onClick={() => {
                if (onBack) onBack();
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
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && searchResults[0]) openSearchResult(searchResults[0].to);
            if (event.key === "Escape") setSearch("");
          }}
          aria-label="Search the workspace"
          placeholder="Search the workspace"
          className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50/70 pl-9 pr-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-primary/35 focus:bg-white focus:ring-3 focus:ring-primary/8"
        />
        {search.trim() && (
          <div className="absolute left-0 top-11 z-50 w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
            {searchResults.length ? searchResults.map((result) => (
              <button
                key={result.to}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => openSearchResult(result.to)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-gray-50"
              >
                <span><span className="block text-sm font-medium text-black-01">{result.label}</span><span className="block text-[11px] text-gray-400">{result.detail}</span></span>
                <ChevronRight className="size-4 text-gray-300" />
              </button>
            )) : <p className="px-3 py-4 text-center text-xs text-gray-400">No accessible pages found.</p>}
          </div>
        )}
      </div>
      <TopProgressBar />
      <div className="inline-flex items-center gap-x-1 sm:gap-x-3">
        <button
          type="button"
          aria-label={mobileSearchOpen ? "Close workspace search" : "Search the workspace"}
          aria-expanded={mobileSearchOpen}
          onClick={() => {
            setMobileSearchOpen((open) => !open);
            if (mobileSearchOpen) setSearch("");
          }}
          className="grid size-8.5 place-content-center rounded-full bg-gray-04 text-gray-700 lg:hidden"
        >
          <Search className="size-4.5" />
        </button>
        <NotificationsBell />
        <SupportTicketComposer />

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
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={toggleLogout}
            >
              <LogOut className="size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {mobileSearchOpen && (
        <div className="relative col-span-2 mb-3 mt-1 lg:hidden">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && searchResults[0]) openSearchResult(searchResults[0].to);
              if (event.key === "Escape") {
                setSearch("");
                setMobileSearchOpen(false);
              }
            }}
            aria-label="Search the workspace"
            placeholder="Search the workspace"
            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none focus:border-primary/35 focus:bg-white focus:ring-3 focus:ring-primary/8"
          />
          {search.trim() && (
            <div className="absolute left-0 top-12 z-50 w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
              {searchResults.length ? searchResults.map((result) => (
                <button
                  key={result.to}
                  type="button"
                  onClick={() => openSearchResult(result.to)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-gray-50"
                >
                  <span><span className="block text-sm font-medium text-black-01">{result.label}</span><span className="block text-[11px] text-gray-400">{result.detail}</span></span>
                  <ChevronRight className="size-4 text-gray-300" />
                </button>
              )) : <p className="px-3 py-4 text-center text-xs text-gray-400">No accessible pages found.</p>}
            </div>
          )}
        </div>
      )}

      <PromptModal
        isOpen={openLogout}
        onClose={toggleLogout}
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

export default function DashboardLayout({
  children,
  hasBack = false,
  onBack,
  title,
  sidebar,
}: {
  children: React.ReactNode;
  hasBack?: boolean;
  title?: string;
  onBack?: () => void;
  // Left navigation. Defaults to the global AppSidebar; the Finance/Procurement
  // consoles pass their own ConsoleSidebar to replace the global menu.
  sidebar?: React.ReactNode;
}) {
  useTokenRefresh();
  const { open, secondsLeft, isExpired, onContinue, onLogout, goToLogin } = useSessionTimeout();

  return (
    <>
      <SessionTimeoutModal
        open={open}
        secondsLeft={secondsLeft}
        isExpired={isExpired}
        onContinue={onContinue}
        onLogout={onLogout}
        goToLogin={goToLogin}
      />
      <SidebarProvider defaultOpen={getSidebarDefaultOpen()}>
        {sidebar ?? <AppSidebar />}
        <SidebarInset className="bg-white-05 min-w-0 w-auto">
          <DashboardHeader hasBack={hasBack} onBack={onBack} title={title} />
          {/* grid-cols-1 (minmax(0,1fr)) zeroes the track's min-content floor so a
              page's <main> can never be stretched past the viewport by wide
              nowrap content (tables) — each page's own overflow-x-auto then
              clips it. Without this every page needed its own min-w-0. */}
          <div className="grid grid-cols-1 min-w-0 pt-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
