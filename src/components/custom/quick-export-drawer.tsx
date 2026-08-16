// "Export what this table is showing" - the quick export drawer, shared by every
// list screen that has a backend ScreenBinding.
//
// The whole design turns on one problem. A quick export is only trustworthy if
// the file matches the table the user was looking at, and the dangerous failure
// is SILENCE: a screen filter that cannot be expressed as an export filter, and
// is dropped without saying so, produces a file WIDER than the screen. The user
// asked for overdue invoices and got every invoice, with nothing to tell them.
//
// So the FE deliberately translates nothing. It forwards the screen's own query
// params to `from-screen`; the module that owns the screen does the translation
// (only Finance knows what `?bucket=overdue` means) and reports back three lists:
//
//   carried  - filters that made it across, so the file matches the table
//   added    - filters the export needed that the screen never had, in practice
//              a required date window. The file is NARROWER than the screen.
//   unmapped - filters that could NOT be carried. The file is WIDER. This is the
//              one the drawer refuses to bury: it goes above the estimate, in a
//              warning panel, and the run button reads "Run anyway".
//
// Columns ARE editable here, seeded from the dataset's defaults so the common
// case is still one click. Changing them re-prices through the same preview
// endpoint the builder's summary rail uses, so the estimate - and with it the
// download-now vs queue decision - stays honest. Sorting and scheduling remain
// the builder's job, and the drawer links to it rather than growing into it.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomInput } from "@/components/custom/custom-input";
import { DetailDrawer } from "@/components/finance-ui/detail-drawer";
import { Segmented } from "@/components/finance-ui/segmented";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/finance-ui/states";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";
import { P } from "@/permissions";
import {
  useGetScreenExportPlanQuery,
  usePreviewExportMutation,
  useRunQuickExportMutation,
} from "@/redux/services/dashboard/exports-api";
import type { DatasetField, ExportFormat } from "@/redux/services/dashboard/exports-types";
import { routesPath } from "@/routes/routes-path";
import { useFileDownload } from "@/pages/protected/export/use-file-download";
import { apiErrorMessage, errorStatus } from "@/utils/api-errors";
import { formatBytes } from "@/utils/format-bytes";

/** The params a screen forwards. Values are its own filter state, not export
 *  filter ids - the backend does that mapping. */
export type ScreenParams = Record<string, string | number | boolean | undefined>;

const FORMAT_LABEL: Record<ExportFormat, string> = { xlsx: "Excel (.xlsx)", csv: "CSV (.csv)" };

/** Mirrors vs_exports.constants.SYNC_EXPORT_MAX_BYTES. Used only to phrase the
 *  button honestly before submitting - the server owns the actual decision, so a
 *  drift between the two costs a slightly wrong label, never a wrong outcome. */
const SYNC_MAX_BYTES = 4 * 1024 * 1024;

/** Stable 32-bit hash (FNV-1a), hex. Used for the idempotency key.
 *
 *  The key is capped at 64 characters server-side. Truncating the configuration
 *  to fit would be actively dangerous: "quick-finance.gl_postings-xlsx-" already
 *  spends half the budget, so two different date ranges could truncate to the
 *  same key and - inside the backend's 60s idempotency window - the second
 *  export would hand back the FIRST one's run, giving the user a file for
 *  filters they did not ask for. Hashing keeps the whole configuration
 *  significant at a fixed width. */
function configHash(value: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** The format the export will actually use: the user's pick for as long as the
 *  dataset still supports it, otherwise the dataset's own first choice.
 *
 *  Worked out here rather than corrected into state, because correcting state
 *  would also destroy the pick - a dataset that stops offering CSV would lose
 *  "CSV" permanently instead of merely overriding it while it cannot be had. */
function effectiveFormat(
  picked: ExportFormat | null,
  supported: ExportFormat[] | undefined,
): ExportFormat {
  if (!supported?.length) return picked ?? "xlsx";
  if (picked !== null && supported.includes(picked)) return picked;
  return supported[0];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-gray-03 pt-3.5 first:border-t-0 first:pt-0">
      <h3 className="mb-2 font-mont text-[11px] uppercase tracking-widest text-gray-05">{title}</h3>
      {children}
    </section>
  );
}

function Line({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="shrink-0 font-mont text-[11px] text-gray-05">{label}</span>
      <span className="min-w-0 truncate text-right font-geist-mono text-sm font-semibold tabular-nums text-black-01">
        {value}
      </span>
    </div>
  );
}

export function QuickExportDrawer({
  open,
  onOpenChange,
  screen,
  params,
  entity,
  /** Defaults to the backend's own label for the screen. */
  defaultName,
  typeface = "app",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screen: string;
  params?: ScreenParams;
  entity?: string;
  defaultName?: string;
  typeface?: "geist" | "app";
}) {
  const navigate = useNavigate();

  // Only the user's OVERRIDES are held in state. The values the drawer actually
  // exports with - columns, name, format - are worked out from the plan further
  // down, at render. Nothing mirrors the plan into state, which is what makes a
  // late-arriving or re-fetched plan harmless: it cannot land on top of a choice
  // the user has already made.
  //
  // `null` means "the user has not chosen", and that is deliberately not the
  // same as empty. A name cleared to "" is still a name they chose, so it stays
  // cleared instead of springing back to the default.
  const [columnsOverride, setColumnsOverride] = useState<string[] | null>(null);
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const [formatOverride, setFormatOverride] = useState<ExportFormat | null>(null);
  // The day the drawer was opened, read once. The default name carries a date
  // stamp, and reading the clock on every render would make rendering impure for
  // no gain - an open drawer does not outlive the day.
  const [today] = useState(() => new Date().toISOString().slice(0, 10));

  // Only asked for while the drawer is open: the estimate runs real aggregate
  // queries, and a closed drawer must not cost the list screen anything.
  // `entity` has to go to BOTH calls. from-screen resolves the dataset's scope
  // before it can estimate anything, so an entity-scoped dataset (all of Finance
  // and Procurement) rejects the request without it - the plan 400s with
  // "An 'entity' query parameter (id or code) is required" and the drawer never
  // gets as far as the run.
  const { data, isFetching, isError, error, refetch } = useGetScreenExportPlanQuery(
    { screen, params, entity },
    { skip: !open, refetchOnMountOrArgChange: true },
  );
  const [runQuick, { isLoading: running }] = useRunQuickExportMutation();
  // Re-estimating after a column change uses the SAME endpoint the builder's
  // summary rail uses, so the number in the drawer is produced the same way as
  // everywhere else rather than guessed from a per-column byte count.
  const [reprice, { data: repriced, isLoading: repricing }] = usePreviewExportMutation();
  // The same audited download the Files screen uses. Downloading through it (not
  // by returning bytes from /quick/) is what keeps "who took this file" complete:
  // the endpoint re-authorises the downloader and logs the attempt either way.
  const { save, busyId } = useFileDownload();
  const saving = busyId != null;

  const plan = data?.data;
  const status = errorStatus(error);

  // What the file will be called: the user's text from the moment they type any,
  // and until then the screen's own label stamped with the date. The old rule -
  // follow the screen until the user types their own, then stop - has nothing
  // left to enforce, because their text simply IS the value here. A re-estimate
  // has no way to overwrite it.
  const name = nameOverride ?? (plan ? `${defaultName || plan.screen.label} - ${today}` : "");
  const format = effectiveFormat(formatOverride, plan?.supported_formats);

  const lockedIds = useMemo(
    () => (plan?.fields ?? []).filter((f) => f.locked).map((f) => f.id),
    [plan?.fields],
  );
  // The columns the export will carry. Until the user ticks anything this is the
  // dataset's own defaults, which is exactly what the estimate on the plan
  // describes - read straight off the plan rather than copied into state, so the
  // two can never disagree.
  //
  // Locked columns are the row's identity and are always present, whatever the
  // checkboxes say - the backend enforces this too, so leaving them out here
  // would only produce a file that disagrees with the picker.
  const chosen = useMemo(() => {
    const picked = columnsOverride ?? plan?.config.columns ?? [];
    const ordered = (plan?.fields ?? [])
      .map((f) => f.id)
      .filter((id) => picked.includes(id) || lockedIds.includes(id));
    return ordered.length ? ordered : picked;
  }, [columnsOverride, plan?.config.columns, plan?.fields, lockedIds]);

  // Grouped for the picker, preserving the dataset's own field order within each
  // group - that order is deliberate (identity first, then detail).
  const groupedFields = useMemo(() => {
    const groups = new Map<string, DatasetField[]>();
    for (const f of plan?.fields ?? []) {
      const list = groups.get(f.group);
      if (list) list.push(f);
      else groups.set(f.group, [f]);
    }
    return [...groups.entries()];
  }, [plan?.fields]);

  const columnsChanged = useMemo(() => {
    if (!plan || columnsOverride === null) return false;
    const a = [...chosen].sort().join("|");
    const b = [...plan.config.columns].sort().join("|");
    return a !== b;
  }, [plan, columnsOverride, chosen]);

  // Only re-price when the choice actually differs from what the plan measured.
  // Debounced, because ticking five boxes should cost one estimate, not five.
  useEffect(() => {
    if (!plan || !columnsChanged || !chosen.length) return;
    const t = window.setTimeout(() => {
      reprice({
        dataset_key: plan.config.dataset_key,
        columns: chosen,
        filters: plan.config.filters,
        format,
        values_mode: plan.config.values_mode,
        ...(entity ? { entity } : {}),
      });
    }, 400);
    return () => window.clearTimeout(t);
  }, [plan, chosen, columnsChanged, format, entity, reprice]);

  // The figures on screen: the re-priced ones once columns diverge, else the
  // plan's own. Never a blend of the two.
  const figures = columnsChanged && repriced?.data ? repriced.data : plan ?? null;

  // What the user ticked and typed belongs to ONE opening of the drawer: reopen
  // it and you get the plan's defaults back. Closing is an event, so the
  // forgetting happens on the close itself and every close goes through here -
  // the buttons, Escape, the overlay, and the two success paths in `submit`.
  // (The format is deliberately not forgotten. It is a preference about the file
  // rather than about this table, and it has always outlived a close.)
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setColumnsOverride(null);
      setNameOverride(null);
    }
    onOpenChange(next);
  };

  const formatOptions = useMemo(
    () =>
      (plan?.supported_formats ?? (["xlsx", "csv"] as ExportFormat[])).map(
        (f) => [f, FORMAT_LABEL[f] ?? f.toUpperCase()] as const,
      ),
    [plan?.supported_formats],
  );

  const rows = plan
    ? plan.matching_rows != null
      ? plan.matching_rows.toLocaleString("en-GB")
      : plan.rows_bucket ?? "-"
    : "-";

  const capExceeded = plan?.warnings.some((w) => w.code === "ROW_CAP_EXCEEDED") ?? false;

  // A small file is produced inline and downloaded here and then, so the button
  // promises a download rather than a queue. This is a PREDICTION from the
  // estimate: the server re-checks the real size and quietly queues instead if
  // it turns out bigger, which is why the submit handler reads what actually
  // came back rather than assuming a file did.
  const expectSync = !!plan && plan.estimated_bytes <= SYNC_MAX_BYTES;

  const submit = async () => {
    if (!plan) return;
    try {
      const res = await runQuick({
        ...plan.config,
        columns: chosen,
        format,
        name: name.trim() || plan.screen.label,
        // Idempotency: the same drawer submitted twice inside the backend's 60s
        // window returns the run already going instead of a duplicate file.
        // Every field that changes the OUTPUT goes into the hash, so a changed
        // filter or format is a different key and gets its own run.
        client_key: `quick-${configHash(
          JSON.stringify([screen, format, plan.config.dataset_key, chosen, plan.config.filters]),
        )}`,
        ...(entity ? { entity } : {}),
        // Only ever a request. The server re-estimates and decides.
        sync: expectSync,
      }).unwrap();
      const run = res.data;

      // Did a file actually come back? Never inferred from what we asked for -
      // the server may have queued it anyway (too big), or the run may have
      // failed, in which case it is terminal with no file.
      if (run?.file?.id && run.file.is_downloadable) {
        await save({ id: run.file.id, name: run.file.name }, run.id);
        toast.success(
          run.status === "COMPLETED_WITH_OMISSIONS"
            ? "Downloaded. Some data was left out - open the run to see what."
            : "Export downloaded.",
          run.status === "COMPLETED_WITH_OMISSIONS" && run.id
            ? { action: { label: "View", onClick: () => navigate(routesPath.PROTECTED.EXPORT.RUN(run.id)) } }
            : undefined,
        );
        handleOpenChange(false);
        return;
      }

      // An inline run that failed reports itself on the run, not as an HTTP
      // error, so say so here rather than claiming it was queued.
      if (run?.status === "FAILED") {
        toast.error(run.failure?.message || "That export could not be produced.", {
          action: run.id
            ? { label: "View", onClick: () => navigate(routesPath.PROTECTED.EXPORT.RUN(run.id)) }
            : undefined,
        });
        return;
      }

      // 200 means an identical run was already in flight and this IS that run -
      // the concurrency notice, not an error. The server's own sentence says
      // which happened, so it is shown rather than replaced.
      toast.success(res.message || "Export queued.", {
        action: run?.id
          ? { label: "View", onClick: () => navigate(routesPath.PROTECTED.EXPORT.RUN(run.id)) }
          : undefined,
      });
      handleOpenChange(false);
    } catch (err) {
      toast.error(apiErrorMessage(err, "That export could not be started."));
    }
  };

  return (
    <DetailDrawer
      open={open}
      onOpenChange={handleOpenChange}
      typeface={typeface}
      widthClass="sm:max-w-3xl"
      title="Export this table"
      description={
        // Deliberately not "Preparing…": that is what the submit button says while
        // the server is producing the file, and one word for two different waits
        // (reading the screen vs building the file) is how a stall becomes
        // unreadable - you cannot tell which of the two you are stuck in.
        plan ? `${plan.screen.label} · ${plan.reads_as}` : "Reading this screen's filters…"
      }
      footer={
        <>
          <Button variant="white" onClick={() => handleOpenChange(false)} disabled={running}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            // Fixed width because the label changes underneath the pointer:
            // "Download export" becomes "Preparing…" the moment it is pressed, and
            // the footer is right-aligned, so a narrower word dragged Cancel 43px
            // sideways and back again. Cancel is the button you reach for when a
            // run is taking too long - it must not move while you reach for it.
            className="min-w-40"
            disabled={!plan || running || saving || isFetching || capExceeded || !chosen.length}
          >
            {running || saving
              ? (expectSync ? "Preparing…" : "Queueing…")
              : plan && !plan.exact
                ? "Run anyway"
                : expectSync
                  ? "Download export"
                  : "Run export"}
          </Button>
        </>
      }
    >
      {isFetching && !plan ? (
        <LoadingState rows={5} label="Working out what this export would contain…" />
      ) : status === 403 ? (
        <ForbiddenState message={apiErrorMessage(error, "You cannot export this dataset.")} />
      ) : isError ? (
        <ErrorState message={apiErrorMessage(error, "This table could not be exported.")} onRetry={refetch} />
      ) : plan ? (
        <div className="space-y-4">
          {/* The widening warning goes FIRST, above the numbers. A user who reads
              nothing else must still see that the file is bigger than the table. */}
          {!plan.exact && (
            <div className="rounded border-l-[3px] border-yellow-01 bg-yellow-01/10 px-3 py-2.5">
              <p className="font-mont text-xs font-semibold text-yellow-01-text">
                This file will contain more than the table shows
              </p>
              <p className="mt-1 font-mont text-[11px] leading-relaxed text-yellow-01-text">
                {plan.warning}
              </p>
              <ul className="mt-2 space-y-1.5">
                {plan.unmapped.map((u) => (
                  <li key={u.param} className="font-mont text-[11px] leading-relaxed text-gray-05">
                    <span className="font-geist-mono font-semibold text-black-01">
                      {u.param}={u.value}
                    </span>{" "}
                    - {u.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Section title="Estimate">
            <div className={cn("divide-y divide-gray-03 transition-opacity", repricing && "opacity-60")}>
              <Line label="Matching rows" value={rows} />
              <Line label="Columns" value={chosen.length || plan.columns} />
              <Line
                label="Estimated size"
                value={figures ? formatBytes(figures.estimated_bytes) : "-"}
              />
            </div>
            {repricing && (
              <p className="mt-2 font-mont text-[11px] text-gray-05">Recalculating…</p>
            )}
            {plan.estimate_confidence === "bucketed" && (
              <p className="mt-2 font-mont text-[11px] leading-relaxed text-gray-05">
                Too many rows to count exactly. The precise figure is recorded on the run.
              </p>
            )}
            {plan.warnings.map((w) => (
              <p
                key={w.code}
                className={cn(
                  "mt-2 rounded border-l-[3px] px-2.5 py-2 font-mont text-[11px] leading-relaxed",
                  w.code === "ROW_CAP_EXCEEDED"
                    ? "border-destructive bg-destructive/10 text-error-text"
                    : "border-yellow-01 bg-yellow-01/10 text-yellow-01-text",
                )}
              >
                {w.message}
              </p>
            ))}
          </Section>

          <Section title={`Columns · ${chosen.length} of ${plan.fields.length}`}>
            <div className="mb-2.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setColumnsOverride(plan.fields.map((f) => f.id))}
                className="rounded border border-gray-03 px-2 py-1 font-mont text-[11px] text-gray-01 hover:bg-gray-50"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => setColumnsOverride(plan.config.columns)}
                disabled={!columnsChanged}
                className="rounded border border-gray-03 px-2 py-1 font-mont text-[11px] text-gray-01 hover:bg-gray-50 disabled:opacity-40"
              >
                Reset to default
              </button>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {groupedFields.map(([group, groupFields]) => (
                <div key={group} className="min-w-0">
                  <p className="mb-1.5 font-mont text-[11px] font-semibold text-gray-01">{group}</p>
                  <ul className="space-y-1">
                    {groupFields.map((f) => {
                      const isLocked = f.locked;
                      const isOn = chosen.includes(f.id);
                      return (
                        <li key={f.id}>
                          <label
                            className={cn(
                              "flex items-start gap-2 font-mont text-xs leading-5",
                              isLocked ? "cursor-not-allowed text-gray-05" : "cursor-pointer text-black-01",
                            )}
                            title={isLocked ? "Always included - this is the row's identity." : f.description}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 size-3.5 shrink-0 accent-primary"
                              checked={isOn}
                              disabled={isLocked}
                              onChange={(e) =>
                                setColumnsOverride((current) => {
                                  const base = current ?? plan.config.columns;
                                  return e.target.checked
                                    ? [...base, f.id]
                                    : base.filter((id) => id !== f.id);
                                })
                              }
                            />
                            <span className="min-w-0">
                              {f.label}
                              {f.sensitive && (
                                <span className="ml-1.5 rounded bg-yellow-01/15 px-1 py-0.5 text-[10px] font-medium text-yellow-01-text">
                                  restricted
                                </span>
                              )}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            {chosen.length === 0 && (
              <p className="mt-2 font-mont text-[11px] text-error-text">
                Choose at least one column.
              </p>
            )}
          </Section>

          <Section title="Filters">
            {plan.carried.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {plan.carried.map((param) => (
                  <span
                    key={param}
                    className="rounded bg-green-01/10 px-2 py-0.5 font-geist-mono text-[11px] font-medium text-green-01"
                  >
                    {param}
                  </span>
                ))}
              </div>
            ) : (
              <p className="font-mont text-[11px] leading-relaxed text-gray-05">
                No filters are set on this screen, so the export covers everything the
                date window below allows.
              </p>
            )}

            {plan.added.map((a) => (
              <p
                key={a.id}
                className="mt-2 font-mont text-[11px] leading-relaxed text-gray-05"
              >
                <span className="font-semibold text-black-01">{a.label}</span> - {a.reason}
              </p>
            ))}
          </Section>

          <Section title="Preview">
            {plan.sample.rows.length > 0 ? (
              // Its own scroller: a wide sample must never widen the drawer, and
              // the page behind it must never scroll sideways.
              <div className="overflow-x-auto rounded border border-gray-03">
                <table className="w-full min-w-max border-collapse text-left">
                  <thead>
                    <tr className="border-b border-gray-03 bg-gray-50">
                      {plan.sample.headers.map((h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap px-2.5 py-1.5 font-mont text-[11px] font-medium text-gray-05"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {plan.sample.rows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-03 last:border-0">
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            className="whitespace-nowrap px-2.5 py-1.5 font-geist-mono text-[11px] tabular-nums text-gray-01"
                          >
                            {cell || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="font-mont text-[11px] leading-relaxed text-gray-05">
                Nothing matches these filters, so the export would be empty.
              </p>
            )}
          </Section>

          <Section title="File">
            <div className="space-y-3">
              <CustomInput
                id="quick-export-name"
                label="Name"
                value={name}
                onChange={(e) => setNameOverride(e.target.value)}
                placeholder={plan.screen.label}
              />
              <Segmented
                label="Format"
                value={format}
                onChange={(next) => setFormatOverride(next)}
                options={formatOptions}
              />
            </div>
            <p className="mt-3 font-mont text-[11px] leading-relaxed text-gray-05">
              This runs in the background and is not saved as a reusable export.
              You will find the file under Export · Files, and it is available for
              30 days.{" "}
              <button
                type="button"
                className="font-medium text-primary underline underline-offset-2"
                onClick={() => navigate(routesPath.PROTECTED.EXPORT.NEW)}
              >
                Build a saved export instead
              </button>
              {" "}to choose columns, sorting and a schedule.
            </p>
          </Section>
        </div>
      ) : null}
    </DetailDrawer>
  );
}

/** The button a list screen actually places in its toolbar.
 *
 *  Gated on BOTH keys the flow needs: `from-screen` is authorised against
 *  catalogue.view and `quick` against run.create, so holding only one produces a
 *  button that opens a drawer it cannot submit. Showing that is the same defect
 *  as a button with no handler. */
export function QuickExportButton({
  screen,
  params,
  entity,
  label = "Export",
  defaultName,
  typeface = "app",
  className,
  // `outline` by default, matching the Customers screen: it draws a border and
  // keeps the label in the normal text colour. The `white` variant is
  // `text-gray-06` on no border, which reads as a disabled control rather than
  // an action. One default here keeps every Export button in the app identical.
  variant = "outline",
  disabledReason,
}: {
  screen: string;
  params?: ScreenParams;
  entity?: string;
  label?: string;
  defaultName?: string;
  typeface?: "geist" | "app";
  className?: string;
  variant?: "white" | "outline" | "default";
  /** When set, the button is disabled and this is its tooltip. For a screen
   *  that cannot be exported *yet* for a reason the user can act on - the
   *  Transactions Log needs a direction first, because money-in and money-out
   *  are different datasets. Disabled-with-reason, never a silent no-op. */
  disabledReason?: string;
}) {
  const [open, setOpen] = useState(false);
  const { hasAllPermissions } = usePermissions();

  if (!hasAllPermissions(P.VIEW_EXPORT_CATALOGUE, P.RUN_EXPORT)) return null;

  return (
    <>
      <Button
        variant={variant}
        className={cn("font-mont font-medium", className)}
        onClick={() => setOpen(true)}
        disabled={!!disabledReason}
        title={disabledReason}
      >
        {label}
      </Button>
      {/* Mounted only once opened: the drawer's query is what triggers the
          estimate, and a list screen should not pay for an export it never ran. */}
      {open && (
        <QuickExportDrawer
          open={open}
          onOpenChange={setOpen}
          screen={screen}
          params={params}
          entity={entity}
          defaultName={defaultName}
          typeface={typeface}
        />
      )}
    </>
  );
}
