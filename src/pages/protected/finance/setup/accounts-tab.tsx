// Setup → Chart of Accounts. The design's tree-table ported to the house theme:
// an expandable account tree (or flat view) with type pills, normal balance,
// currency, rolled-up GL balance and sub-ledger tags. Read-only viewer.
import { useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Check, Info, Plus, Printer } from "lucide-react";
import { Money, FormModal, FormField, DetailDrawer, StatusPill, toArray, useActiveEntity } from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { EmptyState, ErrorState, LoadingState } from "@/components/finance-ui/states";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { P } from "@/permissions";
import {
  useGetChartOfAccountsQuery, useCreateAccountMutation, useGetAccountDetailQuery, useUpdateAccountMutation,
} from "@/redux/services/finance/setup-api";
import type { Account } from "@/redux/services/finance/setup-types";

type Node = Account & { children: Node[]; rolled: number };

const TYPE_PILL: Record<string, string> = {
  ASSET: "bg-blue-50 text-blue-700",
  LIABILITY: "bg-amber-50 text-amber-700",
  EQUITY: "bg-violet-50 text-violet-700",
  INCOME: "bg-green-01/10 text-green-01",
  EXPENSE: "bg-destructive/10 text-destructive",
};
const headCls = "text-gray-01 bg-[#F1F1F1] font-semibold font-mont text-xs whitespace-nowrap px-3 py-2.5 text-left";
const selectCls = "h-9 rounded-md border border-gray-03 bg-white px-2 font-mont text-sm focus:border-primary focus:outline-none";

function buildTree(accounts: Account[]): Node[] {
  const byParent = new Map<number | null, Account[]>();
  for (const a of accounts) {
    const k = a.parent_id ?? null;
    if (!byParent.has(k)) byParent.set(k, []);
    byParent.get(k)!.push(a);
  }
  const build = (parentId: number | null): Node[] =>
    (byParent.get(parentId) ?? [])
      .slice()
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((a) => {
        const children = build(a.id);
        const own = a.balance?.kobo ?? 0;
        return { ...a, children, rolled: own + children.reduce((s, c) => s + c.rolled, 0) };
      });
  return build(null);
}

function Tag({ label }: { label: string }) {
  return <span className="ml-1.5 rounded bg-gray-03/60 px-1.5 py-0.5 font-mont text-[10px] font-semibold uppercase tracking-wide text-gray-05">{label}</span>;
}

function AccountRow({ node, depth, expanded, toggle, currency, onSelect }: {
  node: Node; depth: number; expanded: Set<number>; toggle: (id: number) => void; currency?: string | null; onSelect: (id: number) => void;
}) {
  const hasChildren = node.children.length > 0;
  const open = expanded.has(node.id);
  const cell = "border-t border-gray-03 px-3 py-2 font-mont text-sm text-black-01";
  return (
    <>
      <tr className="cursor-pointer hover:bg-primary/5" onClick={() => onSelect(node.id)}>
        <td className={cell}>
          <div className="flex items-center" style={{ paddingLeft: depth * 18 }}>
            {hasChildren ? (
              <button onClick={(e) => { e.stopPropagation(); toggle(node.id); }} className="mr-1 text-gray-05 hover:text-gray-01" aria-label={open ? "Collapse" : "Expand"}>
                {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>
            ) : <span className="mr-1 inline-block w-4" />}
            <span className="font-semibold tabular-nums text-gray-01">{node.code}</span>
            <span className="ml-2 text-black-01">{node.name}</span>
            {node.tag && <Tag label={node.tag === "CONTROL" ? "CTRL" : node.tag} />}
            {node.is_contra && <Tag label="Contra" />}
          </div>
        </td>
        <td className={cell}>
          <span className={cn("rounded px-2 py-0.5 font-mont text-[11px] font-medium capitalize", TYPE_PILL[node.account_type] ?? "bg-gray-03/60 text-gray-05")}>
            {node.account_type.toLowerCase()}
          </span>
        </td>
        <td className={cn(cell, "text-gray-05")}>{node.subtype || "—"}</td>
        <td className={cn(cell, "text-gray-05")}>{node.normal_balance === "DEBIT" ? "Dr" : "Cr"}</td>
        <td className={cn(cell, "text-gray-05")}>{currency ?? "NGN"}</td>
        <td className={cn(cell, "text-right")}><Money kobo={node.rolled} currency={currency} align="right" /></td>
        <td className={cn(cell, "text-center")}>
          {node.is_active ? <Check className="mx-auto size-4 text-green-01" /> : <span className="text-gray-05">—</span>}
        </td>
      </tr>
      {hasChildren && open && node.children.map((c) => (
        <AccountRow key={c.id} node={c} depth={depth + 1} expanded={expanded} toggle={toggle} currency={currency} onSelect={onSelect} />
      ))}
    </>
  );
}

export function AccountsTab({ entity }: { entity: string }) {
  const { currency } = useActiveEntity();
  const { data, isLoading, isFetching, isError, refetch } = useGetChartOfAccountsQuery({ entity });
  const accounts = toArray<Account>(data?.data);

  const [view, setView] = useState<"tree" | "flat">("tree");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [touched, setTouched] = useState(false);
  const [creating, setCreating] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  // Default: expand every parent until the user starts toggling.
  const allParentIds = useMemo(() => new Set(accounts.filter((a) => !a.is_postable).map((a) => a.id)), [accounts]);
  const effectiveExpanded = touched ? expanded : allParentIds;
  const toggle = (id: number) => {
    const next = new Set(effectiveExpanded);
    if (next.has(id)) next.delete(id); else next.add(id);
    setTouched(true);
    setExpanded(next);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts.filter((a) =>
      (!type || a.account_type === type) &&
      (!q || a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)),
    );
  }, [accounts, type, search]);

  const tree = useMemo(() => buildTree(filtered), [filtered]);
  const flat = useMemo(
    () => filtered.slice().sort((a, b) => a.code.localeCompare(b.code))
      .map<Node>((a) => ({ ...a, children: [], rolled: a.balance?.kobo ?? 0 })),
    [filtered],
  );
  // Tree view only makes sense unfiltered; an active search/type filter falls back to flat.
  const rows = view === "tree" && !search && !type ? tree : flat;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code or name" className="h-9 max-w-xs font-mont text-sm" />
        <div className="flex rounded-md border border-gray-03 p-0.5 font-mont text-xs">
          {(["tree", "flat"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={cn("rounded px-2.5 py-1 capitalize", view === v ? "bg-primary text-white" : "text-gray-05 hover:text-gray-01")}>
              {v}
            </button>
          ))}
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className={selectCls} aria-label="Account type">
          <option value="">All types</option>
          {["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"].map((t) => <option key={t} value={t}>{t[0] + t.slice(1).toLowerCase()}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <Can permission={P.FIN_CREATE_ACCOUNT}>
            <Button onClick={() => setCreating(true)} className="h-9 gap-1.5 font-mont text-xs font-semibold">
              <Plus className="size-3.5" /> New account
            </Button>
          </Can>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="About the chart of accounts" className="flex size-5 items-center justify-center text-gray-05 hover:text-gray-01">
                  <Info className="size-4" />
                </button>
              </TooltipTrigger>
            <TooltipContent className="max-w-xs font-mont text-xs leading-relaxed">
              The spine of the GL: every journal line maps to one account here. Five top-level types govern the equation Assets = Liabilities + Equity, and Net income = Income − Expense. CTRL marks control accounts that reconcile back to sub-ledgers (AR/AP).
            </TooltipContent>
          </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {isLoading || isFetching ? (
        <LoadingState rows={8} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : rows.length === 0 ? (
        <EmptyState title="No accounts" message="The chart of accounts will appear here." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-gray-03 bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={headCls}>Account</th>
                <th className={headCls}>Type</th>
                <th className={headCls}>Subtype</th>
                <th className={headCls}>Normal</th>
                <th className={headCls}>Currency</th>
                <th className={cn(headCls, "text-right")}>Balance</th>
                <th className={cn(headCls, "text-center")}>Active</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((n) => (
                <AccountRow key={n.id} node={n} depth={0} expanded={effectiveExpanded} toggle={toggle} currency={currency} onSelect={setDetailId} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateAccountModal open={creating} onClose={() => setCreating(false)} entity={entity} parents={accounts} />
      <AccountDetailDrawer id={detailId} entity={entity} accounts={accounts} currency={currency} onClose={() => setDetailId(null)} />
    </div>
  );
}

function CreateAccountModal({ open, onClose, entity, parents }: {
  open: boolean; onClose: () => void; entity: string; parents: Account[];
}) {
  const [create, { isLoading }] = useCreateAccountMutation();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("ASSET");
  const [subtype, setSubtype] = useState("");
  const [parent, setParent] = useState("");
  const [postable, setPostable] = useState(true);
  const [contra, setContra] = useState(false);
  const canSubmit = code.trim() !== "" && name.trim() !== "" && !!type;

  const submit = async () => {
    try {
      const r = await create({
        entity, code: code.trim(), name: name.trim(), account_type: type,
        subtype: subtype.trim() || undefined, parent: parent ? Number(parent) : undefined,
        is_postable: postable, is_contra: contra,
      }).unwrap();
      toast.success(r.message || "Account created.");
      setCode(""); setName(""); setType("ASSET"); setSubtype(""); setParent(""); setPostable(true); setContra(false);
      onClose();
    } catch { /* central toast */ }
  };

  return (
    <FormModal open={open} onOpenChange={(o) => !o && onClose()} title="New account"
      description="Add a node to the chart of accounts." onSubmit={submit} loading={isLoading}
      canSubmit={canSubmit} widthClass="sm:max-w-lg">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Code" required><Input value={code} onChange={(e) => setCode(e.target.value)} className="bg-white font-mont" /></FormField>
        <FormField label="Account type" required>
          <select value={type} onChange={(e) => setType(e.target.value)} className={cn(selectCls, "w-full")}>
            {["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"].map((t) => <option key={t} value={t}>{t[0] + t.slice(1).toLowerCase()}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white" /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Subtype"><Input value={subtype} onChange={(e) => setSubtype(e.target.value)} placeholder="e.g. Current asset" className="bg-white" /></FormField>
        <FormField label="Parent account">
          <select value={parent} onChange={(e) => setParent(e.target.value)} className={cn(selectCls, "w-full")}>
            <option value="">None (top level)</option>
            {parents.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
          </select>
        </FormField>
      </div>
      <div className="flex flex-wrap gap-5 font-mont text-sm text-gray-01">
        <label className="flex items-center gap-2"><input type="checkbox" checked={postable} onChange={(e) => setPostable(e.target.checked)} /> Postable (accepts entries)</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={contra} onChange={(e) => setContra(e.target.checked)} /> Contra account</label>
      </div>
    </FormModal>
  );
}

const DRAWER_TABS = [
  { key: "activity", label: "Activity" },
  { key: "taccount", label: "T-account" },
  { key: "subs", label: "Sub-accounts" },
  { key: "settings", label: "Settings" },
] as const;

function AccountDetailDrawer({ id, entity, accounts, currency, onClose }: {
  id: number | null; entity: string; accounts: Account[]; currency?: string | null; onClose: () => void;
}) {
  const { data, isLoading, isError, refetch } = useGetAccountDetailQuery(id ? { entity, id } : skipToken);
  const [tab, setTab] = useState<(typeof DRAWER_TABS)[number]["key"]>("activity");
  const d = data?.data;
  const acc = d?.account;
  const kids = id ? accounts.filter((a) => a.parent_id === id) : [];

  const cell = "border-t border-gray-03 px-3 py-2 font-mont text-xs text-black-01";
  const th = "bg-[#F1F1F1] px-3 py-2 text-left font-mont text-[11px] font-semibold text-gray-01";

  return (
    <DetailDrawer
      open={id != null}
      onOpenChange={(o) => !o && onClose()}
      title={acc ? `${acc.code} · ${acc.name}` : "Account"}
      description={acc ? `${acc.subtype || d?.type_label || acc.account_type} · Normal: ${acc.normal_balance === "DEBIT" ? "Debit" : "Credit"}` : undefined}
      widthClass="sm:max-w-3xl"
      footer={<Button variant="outline" onClick={() => window.print()} className="gap-1.5"><Printer className="size-4" /> Print</Button>}
    >
      {isLoading ? <LoadingState rows={6} /> : isError || !d || !acc ? <ErrorState onRetry={refetch} /> : (
        <div className="space-y-4">
          {/* KPI cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md bg-white p-3 ring-1 ring-gray-03">
              <p className="font-mont text-[11px] text-gray-05">Current balance</p>
              <p className="mt-1 font-mont text-base font-semibold tabular-nums"><Money kobo={d.summary.current_balance.kobo} currency={currency} /></p>
            </div>
            <div className="rounded-md bg-white p-3 ring-1 ring-gray-03">
              <p className="font-mont text-[11px] text-gray-05">Opening (FY carry-in)</p>
              <p className="mt-1 font-mont text-base font-semibold tabular-nums"><Money kobo={d.summary.opening_balance.kobo} currency={currency} /></p>
            </div>
            <div className="rounded-md bg-white p-3 ring-1 ring-gray-03">
              <p className="font-mont text-[11px] text-gray-05">Posted YTD</p>
              <p className="mt-1 font-mont text-base font-semibold tabular-nums">{d.summary.line_count} lines</p>
              <p className="font-mont text-[11px] text-gray-05">across {d.summary.journal_count} journals</p>
            </div>
          </div>

          {/* tabs */}
          <div className="flex gap-1 border-b border-gray-03">
            {DRAWER_TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn("-mb-px border-b-2 px-3 py-2 font-mont text-xs font-semibold",
                  tab === t.key ? "border-primary text-primary" : "border-transparent text-gray-05 hover:text-gray-01")}>
                {t.label}{t.key === "subs" && kids.length ? ` (${kids.length})` : ""}
              </button>
            ))}
          </div>

          {tab === "activity" && (
            d.activity.length === 0 ? <EmptyState title="No postings" message="Posted journal lines hitting this account will appear here." /> : (
              <div className="overflow-x-auto rounded-md border border-gray-03">
                <table className="w-full border-collapse">
                  <thead><tr>
                    <th className={th}>Date</th><th className={th}>Journal</th><th className={th}>Description</th>
                    <th className={th}>Cost centre</th><th className={cn(th, "text-right")}>Debit</th>
                    <th className={cn(th, "text-right")}>Credit</th><th className={cn(th, "text-right")}>Balance</th>
                  </tr></thead>
                  <tbody>
                    {d.activity.map((a, i) => (
                      <tr key={`${a.journal_no}-${i}`}>
                        <td className={cn(cell, "text-gray-05")}>{a.date}</td>
                        <td className={cn(cell, "font-semibold")}>{a.journal_no}</td>
                        <td className={cn(cell, "max-w-xs truncate")}>{a.description || "—"}</td>
                        <td className={cn(cell, "text-gray-05")}>{a.cost_center || "—"}</td>
                        <td className={cn(cell, "text-right tabular-nums")}>{a.debit.kobo ? <Money kobo={a.debit.kobo} currency={currency} align="right" /> : "—"}</td>
                        <td className={cn(cell, "text-right tabular-nums")}>{a.credit.kobo ? <Money kobo={a.credit.kobo} currency={currency} align="right" /> : "—"}</td>
                        <td className={cn(cell, "text-right font-medium tabular-nums")}><Money kobo={a.running_balance.kobo} currency={currency} align="right" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {tab === "taccount" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-gray-03">
                <p className="border-b border-gray-03 bg-[#F1F1F1] px-3 py-2 font-mont text-xs font-semibold">Debits</p>
                {d.activity.filter((a) => a.debit.kobo).map((a, i) => (
                  <div key={i} className="flex justify-between px-3 py-1.5 font-mont text-xs"><span className="truncate text-gray-05">{a.journal_no}</span><Money kobo={a.debit.kobo} currency={currency} /></div>
                ))}
              </div>
              <div className="rounded-md border border-gray-03">
                <p className="border-b border-gray-03 bg-[#F1F1F1] px-3 py-2 font-mont text-xs font-semibold">Credits</p>
                {d.activity.filter((a) => a.credit.kobo).map((a, i) => (
                  <div key={i} className="flex justify-between px-3 py-1.5 font-mont text-xs"><span className="truncate text-gray-05">{a.journal_no}</span><Money kobo={a.credit.kobo} currency={currency} /></div>
                ))}
              </div>
            </div>
          )}

          {tab === "subs" && (
            kids.length === 0 ? <EmptyState title="No sub-accounts" message="This is a leaf account." /> : (
              <div className="rounded-md border border-gray-03">
                {kids.map((k) => (
                  <div key={k.id} className="flex items-center justify-between border-t border-gray-03 px-3 py-2 font-mont text-sm first:border-t-0">
                    <span><span className="font-semibold tabular-nums">{k.code}</span><span className="ml-2">{k.name}</span></span>
                    <StatusPill status={k.is_active ? "ACTIVE" : "INACTIVE"} />
                  </div>
                ))}
              </div>
            )
          )}

          {tab === "settings" && <AccountSettings key={acc.id} entity={entity} account={acc} onSaved={onClose} />}
        </div>
      )}
    </DetailDrawer>
  );
}

function AccountSettings({ entity, account, onSaved }: { entity: string; account: Account; onSaved: () => void }) {
  const [update, { isLoading }] = useUpdateAccountMutation();
  const [name, setName] = useState(account.name);
  const [subtype, setSubtype] = useState(account.subtype ?? "");
  const [active, setActive] = useState(account.is_active);
  const dirty = name !== account.name || subtype !== (account.subtype ?? "") || active !== account.is_active;

  const save = async () => {
    try {
      const r = await update({ entity, id: account.id, name: name.trim(), subtype: subtype.trim(), is_active: active }).unwrap();
      toast.success(r.message || "Account updated.");
      onSaved();
    } catch { /* central */ }
  };

  return (
    <Can permission={P.FIN_UPDATE_ACCOUNT} fallback={<EmptyState title="Read-only" message="You don’t have permission to edit accounts." />}>
      <div className="space-y-3">
        <FormField label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white" /></FormField>
        <FormField label="Subtype"><Input value={subtype} onChange={(e) => setSubtype(e.target.value)} placeholder="e.g. Current asset" className="bg-white" /></FormField>
        <label className="flex items-center gap-2 font-mont text-sm text-gray-01"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active</label>
        <Button onClick={save} disabled={!dirty || isLoading} className="font-mont text-xs font-semibold">{isLoading ? "Saving…" : "Save changes"}</Button>
      </div>
    </Can>
  );
}
