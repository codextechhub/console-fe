import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Search, ShieldCheck, UserRound } from "lucide-react";
import { useDebounce } from "react-haiku";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  setAuthContext,
  setImpersonation,
} from "@/redux/features/auth/auth-slice";
import type { AuthContextSnapshot } from "@/redux/features/auth/auth-types";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { authApi } from "@/redux/services/auth/auth-api";
import { baseApi, runWithIdentitySwap } from "@/redux/services/base-api";
import {
  useGetProxyTargetsQuery,
  useEndImpersonationMutation,
  useStartImpersonationMutation,
} from "@/redux/services/dashboard/security-api";
import type { ProxyTarget } from "@/redux/services/dashboard/security-types";
import { routesPath } from "@/routes/routes-path";
import { returnInitial } from "@/utils/helpers";
import { clearSelectedEntity } from "@/redux/features/finance/entity-slice";

export function ProxyUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const auth = useAppSelector((state) => state.auth);
  const [search, setSearch] = useState("");
  const [selectedTarget, setSelectedTarget] = useState<ProxyTarget | null>(null);
  const [startingId, setStartingId] = useState<number | null>(null);
  const debouncedSearch = useDebounce(search.trim(), 350);
  const actorTenantSlug = auth.impersonation?.actor.tenant?.slug ?? auth.tenant?.slug ?? "";
  const canSearch = open && actorTenantSlug.length > 0 && debouncedSearch.length >= 2;

  const { data, isFetching, isError } = useGetProxyTargetsQuery(
    {
      tenant_slug: actorTenantSlug,
      search: debouncedSearch,
      page_size: 20,
    },
    { skip: !canSearch },
  );
  const [startImpersonation] = useStartImpersonationMutation();
  const [endImpersonation] = useEndImpersonationMutation();

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedTarget(null);
      setStartingId(null);
    }
  }, [open]);

  const proxyUser = async (target: ProxyTarget) => {
    if (startingId !== null || target.id === auth.impersonation?.target.id) return;
    setStartingId(target.id);
    const actor: AuthContextSnapshot = auth.impersonation?.actor ?? {
      user: auth.user ?? null,
      school: auth.school ?? null,
      tenant: auth.tenant ?? null,
      permissions: auth.permissions ?? [],
    };
    let startedSessionId: number | null = null;
    try {
      const result = await startImpersonation({
        tenant_slug: target.tenant_slug,
        target_user: target.id,
      }).unwrap();
      startedSessionId = result.data.id;

      // The gate drops every non-exempt request fired while screens mounted
      // for the OLD identity are still tearing down - they would otherwise
      // reach the backend under the target's proxy header and 403 (misleading
      // toast + false PROXY_ACTION_FAILED audit rows).
      await runWithIdentitySwap(async () => {
        dispatch(setImpersonation({
          id: result.data.id,
          tenantSlug: target.tenant_slug,
          target,
          actor,
        }));
        dispatch(setAuthContext({
          user: null,
          school: null,
          tenant: { slug: target.tenant_slug, name: target.tenant_name },
          permissions: [],
        }));
        dispatch(clearSelectedEntity());
        onOpenChange(false);
        await navigate(routesPath.PROTECTED.OVERVIEW.INDEX, { replace: true });

        const me = await dispatch(
          authApi.endpoints.getMe.initiate(undefined, {
            forceRefetch: true,
            subscribe: false,
          }),
        ).unwrap();
        // Apply the effective identity explicitly. The query's lifecycle
        // handler also syncs this context, but awaiting that side effect is
        // racy relative to unwrap().
        dispatch(setAuthContext({
          user: me.data.user,
          permissions: me.data.permissions,
          school: me.data.school ?? null,
          tenant: me.data.tenant ?? null,
        }));
      });
      // Reset AFTER the gate lifts: every mounted screen refetches once,
      // cleanly, under the settled target identity.
      dispatch(baseApi.util.resetApiState());
      toast.success(`You are now using ${target.full_name}'s account.`);
    } catch {
      if (startedSessionId !== null) {
        // Never leave a half-switched client. If target identity hydration
        // fails after the server started the proxy, end it and restore the
        // original actor snapshot immediately.
        try {
          await endImpersonation({ session_id: startedSessionId }).unwrap();
        } catch {
          // Local restoration is still safer; logout/switch closes stale rows.
        }
        await runWithIdentitySwap(async () => {
          dispatch(setImpersonation(null));
          dispatch(setAuthContext(actor));
          dispatch(clearSelectedEntity());
          onOpenChange(false);
          await navigate(routesPath.PROTECTED.OVERVIEW.INDEX, { replace: true });
        });
        dispatch(baseApi.util.resetApiState());
        toast.error("The proxy account could not be loaded. You are back in your own account.");
      }
    } finally {
      setStartingId(null);
    }
  };

  const results = Array.isArray(data?.data) ? data.data : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid-rows-[auto_auto_auto] gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-slate-100 px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-5 text-primary" /> Proxy user
          </DialogTitle>
          <DialogDescription>
            Search for an active user by name or email.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSelectedTarget(null);
              }}
              placeholder="Search name or email"
              aria-label="Search users to proxy"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-10 text-sm outline-none transition focus:border-primary/40 focus:bg-white focus:ring-3 focus:ring-primary/10"
            />
            {isFetching && (
              <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-primary" />
            )}
          </div>

          <div className="mt-4 h-[276px] flex-none overflow-y-auto rounded-xl border border-slate-100">
            {search.trim().length < 2 ? (
              <Empty icon={<Search className="size-5" />} text="Enter at least two characters to search." />
            ) : isFetching && !data ? (
              <Empty icon={<Loader2 className="size-5 animate-spin" />} text="Finding users…" />
            ) : isError ? (
              <Empty icon={<UserRound className="size-5" />} text="Users could not be loaded. Try again." />
            ) : results.length === 0 ? (
              <Empty icon={<UserRound className="size-5" />} text="No eligible users match your search." />
            ) : (
              <div className="divide-y divide-slate-100 p-1.5">
                {results.map((target) => {
                  const isCurrent = target.id === auth.impersonation?.target.id;
                  const isSelected = selectedTarget?.id === target.id;
                  return (
                    <button
                      key={target.id}
                      type="button"
                      disabled={startingId !== null || isCurrent}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedTarget(target)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition disabled:cursor-default disabled:opacity-60 ${
                        isSelected
                          ? "bg-primary/5 ring-1 ring-inset ring-primary/25"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <span className="grid size-9 shrink-0 place-content-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/15">
                        {returnInitial(target.full_name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-black-01">{target.full_name}</span>
                        <span className="block truncate text-xs text-slate-500">{target.email}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                          {target.school_name || target.tenant_name}
                          {target.role ? ` · ${target.role}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-primary">
                        {isCurrent ? "Current" : isSelected ? <CheckCircle2 className="size-5" /> : "Select"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:items-center sm:justify-between">
          <p className="min-w-0 truncate text-xs text-slate-500">
            {selectedTarget ? (
              <>Selected: <span className="font-semibold text-black-01">{selectedTarget.full_name}</span></>
            ) : (
              "Select a user to continue."
            )}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              disabled={!selectedTarget || startingId !== null}
              onClick={() => selectedTarget && proxyUser(selectedTarget)}
            >
              {startingId !== null && <Loader2 className="size-4 animate-spin" />}
              Proxy
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="grid h-full min-h-56 place-content-center gap-2 px-6 text-center text-sm text-slate-400">
      <span className="mx-auto">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
