import { useMemo, type ElementType, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  CircleDotDashed,
  Link2Off,
  MapPinOff,
  MousePointerClick,
  RouteOff,
  SearchX,
} from "lucide-react";
import { Link } from "react-router";

import PageAccessDenied from "@/components/custom/page-access-denied";
import { Button } from "@/components/ui/button";
import {
  buildGuideOperationsReport,
  buildGuideEditorialQueue,
  GUIDE_COVERAGE_ROUTE_PATTERNS,
  GUIDE_REGISTRY,
  WALKTHROUGH_REGISTRY,
  WALKTHROUGH_VERIFICATION_RECORDS,
  type GuideFreshnessStatus,
  type GuideRecord,
} from "@/features/guides";
import { usePermissions } from "@/hooks/use-permissions";
import { ACTIONS } from "@/lib/action-palette/registry";
import { P } from "@/permissions";
import { routesPath } from "@/routes/routes-path";
import { useGetGuideAnalyticsSummaryQuery } from "@/redux/services/guide-analytics-api";
import { PageShell } from "@/components/layout/page-shell";

const R = routesPath.PROTECTED;

const FRESHNESS_STYLE: Record<GuideFreshnessStatus, string> = {
  current: "bg-emerald-50 text-emerald-700",
  "due-soon": "bg-amber-50 text-amber-700",
  stale: "bg-red-50 text-red-700",
};

export default function GuideCoveragePage() {
  const { hasPermission } = usePermissions();
  const canViewOperations = hasPermission(P.VIEW_HEALTH);
  const { data: analyticsResponse, isLoading: analyticsLoading, isError: analyticsError } = useGetGuideAnalyticsSummaryQuery(30, {
    skip: !canViewOperations,
  });
  const report = useMemo(() => buildGuideOperationsReport({
    guides: GUIDE_REGISTRY,
    shippedRoutes: GUIDE_COVERAGE_ROUTE_PATTERNS,
    actions: ACTIONS,
    walkthroughs: WALKTHROUGH_REGISTRY,
    verificationRecords: WALKTHROUGH_VERIFICATION_RECORDS,
  }), []);
  const analytics = analyticsResponse?.data;
  const editorialQueue = useMemo(() => buildGuideEditorialQueue({
    guides: GUIDE_REGISTRY,
    analytics: analytics?.guides ?? [],
  }), [analytics?.guides]);

  if (!canViewOperations) return <PageAccessDenied />;

  const activeGuideCount = report.publishedGuideCount + report.draftGuideCount;
  const integrityGapCount = report.integrityIssues.length + report.walkthroughTargetGaps.length;
  const guideById = new Map<string, GuideRecord>(
    GUIDE_REGISTRY.map((guide) => [guide.id, guide] as const),
  );

  return (
    <PageShell className="gap-6 text-black-01 sm:px-6 lg:px-8" grid>
      <header className="rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.08] via-white to-emerald-50/60 p-5 shadow-[0_20px_60px_rgba(15,23,42,.05)] sm:p-8">
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-3">
          <Link to={R.SUPPORT.GUIDES}><ArrowLeft className="size-4" /> How-to Guides</Link>
        </Button>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">Guide operations</p>
            <h1 className="mt-2 font-mont text-2xl font-semibold tracking-tight sm:text-3xl">Coverage and freshness</h1>
            <p className="mt-2 text-sm leading-6 text-gray-01">
              See where shipped routes and high-value actions need guidance, which articles need review, and whether guide relationships and walkthrough targets remain valid.
            </p>
          </div>
          <div className="shrink-0 rounded-xl border border-white bg-white/80 px-4 py-3 text-xs text-gray-01 shadow-sm">
            Generated from the current registry on <span className="font-semibold text-black-01">{report.generatedAt}</span>
          </div>
        </div>
      </header>

      <section aria-label="Coverage summary" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricCard icon={BookOpenCheck} label="Active guides" value={activeGuideCount} detail={`${report.publishedGuideCount} published, ${report.draftGuideCount} draft`} />
        <MetricCard icon={RouteOff} label="Routes covered" value={`${report.coveredRouteCount}/${report.routeCount}`} detail={`${report.routeGaps.length} gap${report.routeGaps.length === 1 ? "" : "s"}`} alert={report.routeGaps.length > 0} />
        <MetricCard icon={MousePointerClick} label="Actions covered" value={`${report.coveredActionCount}/${report.actionCount}`} detail={`${report.actionGaps.length} gap${report.actionGaps.length === 1 ? "" : "s"}`} alert={report.actionGaps.length > 0} />
        <MetricCard icon={CalendarClock} label="Reviews current" value={`${report.currentReviewCount}/${activeGuideCount}`} detail={`${report.freshnessQueue.length} due or stale`} alert={report.freshnessQueue.length > 0} />
        <MetricCard icon={Link2Off} label="Integrity gaps" value={integrityGapCount} detail="Relations and verified targets" alert={integrityGapCount > 0} className="col-span-2 lg:col-span-1" />
      </section>

      <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <ReportPanel
          icon={RouteOff}
          title="Routes without a guide"
          description="Shipped product route patterns that no active guide maps."
          count={report.routeGaps.length}
        >
          {report.routeGaps.length ? (
            <ul className="divide-y divide-gray-100">
              {report.routeGaps.map(({ route }) => (
                <li key={route} className="break-all px-4 py-3 font-mono text-xs text-gray-700 sm:px-5">{route}</li>
              ))}
            </ul>
          ) : <HealthyState text="Every shipped product route has an active guide mapping." />}
        </ReportPanel>

        <ReportPanel
          icon={MousePointerClick}
          title="High-value actions without a guide"
          description="Registered task actions that no active guide references."
          count={report.actionGaps.length}
        >
          {report.actionGaps.length ? (
            <ul className="divide-y divide-gray-100">
              {report.actionGaps.map((gap) => (
                <li key={gap.actionId} className="min-w-0 px-4 py-3 sm:px-5">
                  <p className="text-sm font-semibold">{gap.label}</p>
                  <div className="mt-1 flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-xs text-gray-01">
                    <code className="break-all">{gap.actionId}</code>
                    {gap.destination && <code className="break-all">{gap.destination}</code>}
                  </div>
                </li>
              ))}
            </ul>
          ) : <HealthyState text="Every registered high-value action is referenced by an active guide." />}
        </ReportPanel>
      </section>

      <ReportPanel
        icon={CalendarClock}
        title="Review queue"
        description="High-risk guides are due every 90 days, medium every 180 days, and low every 365 days."
        count={report.freshnessQueue.length}
      >
        {report.freshnessQueue.length ? (
          <ul className="divide-y divide-gray-100">
            {report.freshnessQueue.map((item) => {
              const guide = guideById.get(item.guideId);
              return (
                <li key={item.guideId} className="flex min-w-0 flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="min-w-0">
                    {guide?.status === "published" ? (
                      <Link className="text-sm font-semibold hover:text-primary" to={R.SUPPORT.GUIDE_DETAIL(guide.slug)}>{item.title}</Link>
                    ) : <p className="text-sm font-semibold">{item.title}</p>}
                    <p className="mt-1 text-xs text-gray-01">{item.owner} · {item.risk} risk · reviewed {item.reviewedAt} · due {item.dueAt}</p>
                  </div>
                  <span className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${FRESHNESS_STYLE[item.status]}`}>
                    {item.status === "stale" ? `${Math.abs(item.daysUntilDue)} days overdue` : `Due in ${item.daysUntilDue} days`}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : <HealthyState text="All active guides are inside their risk-based review window." />}
      </ReportPanel>

      <section aria-labelledby="reader-signals-heading" className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">Editorial loop</p>
            <h2 id="reader-signals-heading" className="mt-1 font-mont text-xl font-semibold">Reader signals from the last 30 days</h2>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-gray-01">
              Counts contain guide keys and coarse outcomes only. Search phrases keep approved task words and replace other words with [redacted]. No actor, record id, form value, amount, or free-text report is stored.
            </p>
          </div>
          {analytics && <p className="text-xs text-gray-01">Window starts <span className="font-semibold text-black-01">{analytics.since}</span></p>}
        </div>

        {analyticsLoading ? (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-5 py-8 text-center text-sm text-gray-01">Loading reader signals...</div>
        ) : analyticsError || !analytics ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            Reader signals are unavailable. Static route, action, freshness, and walkthrough checks above are still current.
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
              <MetricCard icon={BookOpenCheck} label="Guide views" value={analytics.totals["guide.viewed"] ?? 0} detail="Article opens" />
              <MetricCard icon={CheckCircle2} label="Completions" value={analytics.totals["guide.completed"] ?? 0} detail="Reader-marked finishes" />
              <MetricCard icon={BarChart3} label="Helpful votes" value={analytics.totals["guide.helpful_voted"] ?? 0} detail="Helpful and not helpful" />
              <MetricCard icon={AlertTriangle} label="Outdated reports" value={analytics.totals["guide.outdated_reported"] ?? 0} detail="Ticket handoffs started" alert={(analytics.totals["guide.outdated_reported"] ?? 0) > 0} />
              <MetricCard icon={SearchX} label="No-result searches" value={analytics.totals["search.no_results"] ?? 0} detail="Debounced guide searches" alert={(analytics.totals["search.no_results"] ?? 0) > 0} />
              <MetricCard icon={MousePointerClick} label="Walkthrough exits" value={analytics.totals["walkthrough.exited"] ?? 0} detail="Finished, paused, or unavailable" />
            </div>

            <section className="mt-4 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
              <ReportPanel
                icon={CalendarClock}
                title="Editorial review queue"
                description="Due reviews and reader signals, ordered by product risk and urgency."
                count={editorialQueue.length}
              >
                {editorialQueue.length ? (
                  <ul className="divide-y divide-gray-100">
                    {editorialQueue.slice(0, 20).map((item) => {
                      const guide = guideById.get(item.guideId);
                      return (
                        <li key={item.guideId} className="min-w-0 px-4 py-4 sm:px-5">
                          <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                            {guide?.status === "published" ? (
                              <Link className="text-sm font-semibold hover:text-primary" to={R.SUPPORT.GUIDE_DETAIL(guide.slug)}>{item.title}</Link>
                            ) : <p className="text-sm font-semibold">{item.title}</p>}
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600">{item.risk} risk</span>
                          </div>
                          <p className="mt-1 text-xs text-gray-01">{item.owner} · due {item.dueAt}</p>
                          <p className="mt-2 text-xs leading-5 text-amber-700">{item.reasons.join(" · ")}</p>
                        </li>
                      );
                    })}
                  </ul>
                ) : <HealthyState text="No scheduled review or reader signal needs editorial attention." />}
              </ReportPanel>

              <ReportPanel
                icon={SearchX}
                title="No-result guide searches"
                description="Sanitised task phrases editors can turn into aliases or new guidance."
                count={analytics.no_result_searches.length}
              >
                {analytics.no_result_searches.length ? (
                  <ul className="divide-y divide-gray-100">
                    {analytics.no_result_searches.map((item) => (
                      <li key={`${item.search_query}-${item.route_pattern}`} className="min-w-0 px-4 py-3 sm:px-5">
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <code className="break-words text-xs text-black-01">{item.search_query}</code>
                          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold">{item.count}</span>
                        </div>
                        {item.route_pattern && <code className="mt-1 block break-all text-[11px] text-gray-01">{item.route_pattern}</code>}
                      </li>
                    ))}
                  </ul>
                ) : <HealthyState text="Every recorded guide search returned a result." />}
              </ReportPanel>
            </section>
          </>
        )}
      </section>

      <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <ReportPanel
          icon={Link2Off}
          title="Registry integrity"
          description="Invalid routes, actions, relations, sections, articles, and walkthrough links."
          count={report.integrityIssues.length}
        >
          {report.integrityIssues.length ? (
            <ul className="divide-y divide-gray-100">
              {report.integrityIssues.map((issue, index) => (
                <li key={`${issue.guideId}-${issue.code}-${index}`} className="px-4 py-3 sm:px-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700">{issue.code}</p>
                  <p className="mt-1 text-sm">{issue.message}</p>
                  <code className="mt-1 block break-all text-xs text-gray-01">{issue.guideId}</code>
                </li>
              ))}
            </ul>
          ) : <HealthyState text="Guide records and relationships pass the registry contract." />}
        </ReportPanel>

        <ReportPanel
          icon={MapPinOff}
          title="Walkthrough target verification"
          description="Missing records, changed walkthrough versions, or targets absent in the latest drive."
          count={report.walkthroughTargetGaps.length}
        >
          {report.walkthroughTargetGaps.length ? (
            <ul className="divide-y divide-gray-100">
              {report.walkthroughTargetGaps.map((gap, index) => (
                <li key={`${gap.walkthroughId}-${gap.targetId}-${index}`} className="px-4 py-3 sm:px-5">
                  <p className="text-sm font-semibold">{gap.targetId}</p>
                  <p className="mt-1 break-all text-xs text-gray-01">{gap.walkthroughId} · {gap.reason}</p>
                </li>
              ))}
            </ul>
          ) : <HealthyState text="Every walkthrough version has a verification record with no missing targets." />}
        </ReportPanel>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <div className="flex items-start gap-3">
          <CircleDotDashed className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <h2 className="text-sm font-semibold">What feeds this dashboard</h2>
            <p className="mt-1 text-xs leading-5 text-gray-01">
              Route patterns come from the shipped guide route catalogue, actions come from the action palette, freshness comes from each guide's risk and review date, and walkthrough results come from versioned verification records. Reader signals come from the closed analytics contract and feed the owner-and-risk editorial queue. Fix the source registry or content instead of editing a total here.
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  alert = false,
  className = "",
}: {
  icon: ElementType;
  label: string;
  value: string | number;
  detail: string;
  alert?: boolean;
  className?: string;
}) {
  return (
    <article className={`min-w-0 rounded-2xl border border-gray-200 bg-white p-4 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <Icon className={`size-4 ${alert ? "text-amber-600" : "text-emerald-600"}`} />
        {alert ? <AlertTriangle className="size-4 text-amber-500" /> : <CheckCircle2 className="size-4 text-emerald-500" />}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs font-semibold">{label}</p>
      <p className="mt-1 text-[11px] leading-4 text-gray-01">{detail}</p>
    </article>
  );
}

function ReportPanel({
  icon: Icon,
  title,
  description,
  count,
  children,
}: {
  icon: ElementType;
  title: string;
  description: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex min-w-0 items-start justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gray-100 text-gray-700"><Icon className="size-4" /></span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="mt-1 text-xs leading-5 text-gray-01">{description}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${count ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{count}</span>
      </div>
      {children}
    </section>
  );
}

function HealthyState({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-5 text-sm text-gray-01 sm:px-5">
      <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
      <p>{text}</p>
    </div>
  );
}
