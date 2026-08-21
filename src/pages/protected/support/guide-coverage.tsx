import { useMemo, type ElementType, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  CircleDotDashed,
  Link2Off,
  MapPinOff,
  MousePointerClick,
  RouteOff,
} from "lucide-react";
import { Link } from "react-router";

import PageAccessDenied from "@/components/custom/page-access-denied";
import { Button } from "@/components/ui/button";
import {
  buildGuideOperationsReport,
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

const R = routesPath.PROTECTED;

const FRESHNESS_STYLE: Record<GuideFreshnessStatus, string> = {
  current: "bg-emerald-50 text-emerald-700",
  "due-soon": "bg-amber-50 text-amber-700",
  stale: "bg-red-50 text-red-700",
};

export default function GuideCoveragePage() {
  const { hasPermission } = usePermissions();
  const report = useMemo(() => buildGuideOperationsReport({
    guides: GUIDE_REGISTRY,
    shippedRoutes: GUIDE_COVERAGE_ROUTE_PATTERNS,
    actions: ACTIONS,
    walkthroughs: WALKTHROUGH_REGISTRY,
    verificationRecords: WALKTHROUGH_VERIFICATION_RECORDS,
  }), []);

  if (!hasPermission(P.VIEW_HEALTH)) return <PageAccessDenied />;

  const activeGuideCount = report.publishedGuideCount + report.draftGuideCount;
  const integrityGapCount = report.integrityIssues.length + report.walkthroughTargetGaps.length;
  const guideById = new Map<string, GuideRecord>(
    GUIDE_REGISTRY.map((guide) => [guide.id, guide] as const),
  );

  return (
    <main className="grid min-w-0 grid-cols-1 gap-6 px-4.5 py-6 text-black-01 sm:px-6 lg:px-8">
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
              Route patterns come from the shipped guide route catalogue, actions come from the action palette, freshness comes from each guide's risk and review date, and walkthrough results come from versioned verification records. Fix the source registry instead of editing a total here.
            </p>
          </div>
        </div>
      </section>
    </main>
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
