import { createElement, lazy, Suspense, useEffect, useLayoutEffect, useState, type MouseEvent } from "react";
import { ArrowLeft, ArrowRight, BookOpenText, Check, CheckCircle2, Clock3, ExternalLink, Flag, Loader2, PlayCircle, ThumbsDown, ThumbsUp } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router";

import PageAccessDenied from "@/components/custom/page-access-denied";
import { Button } from "@/components/ui/button";
import { GUIDE_CATEGORIES, GUIDE_REGISTRY, canDiscoverGuide, findWalkthrough, useWalkthrough, type GuideRecord } from "@/features/guides";
import { resetGuideArticleScroll, scrollToGuideSection } from "@/features/guides/article-navigation";
import { selectPermissions } from "@/redux/features/auth/auth-slice";
import { useAppSelector } from "@/redux/store";
import { useRecordGuideAnalyticsMutation } from "@/redux/services/guide-analytics-api";
import { routesPath } from "@/routes/routes-path";
import { PageShell } from "@/components/layout/page-shell";

const GUIDE_RECORDS: readonly GuideRecord[] = GUIDE_REGISTRY;
const GUIDE_ARTICLES = new Map(
  GUIDE_RECORDS
    .filter((guide) => guide.status === "published")
    .map((guide) => [guide.slug, lazy(guide.article)] as const),
);

export default function GuideArticlePage() {
  const { slug = "" } = useParams();
  const [searchParams] = useSearchParams();
  const permissions = useAppSelector(selectPermissions);
  const guide = GUIDE_RECORDS.find((candidate) => candidate.slug === slug);
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);
  const [completed, setCompleted] = useState(false);
  const Article = GUIDE_ARTICLES.get(slug);
  const { start: startWalkthrough } = useWalkthrough();
  const [recordAnalytics] = useRecordGuideAnalyticsMutation();

  useLayoutEffect(() => {
    resetGuideArticleScroll();
  }, [slug]);

  useEffect(() => {
    if (!guide?.walkthroughId || !findWalkthrough(guide.walkthroughId) || searchParams.get("walkthrough") !== "start") return;
    const timeout = window.setTimeout(() => {
      startWalkthrough(guide.walkthroughId!);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [guide?.walkthroughId, searchParams, startWalkthrough]);

  useEffect(() => {
    if (!guide || guide.status !== "published" || !canDiscoverGuide(guide, permissions)) return;
    void recordAnalytics({ name: "guide.viewed", guide_id: guide.id });
  }, [guide, permissions, recordAnalytics]);

  if (!guide || guide.status === "retired") return <GuideUnavailable title="Guide not found" message="This guide does not exist or has been retired." />;
  if (!canDiscoverGuide(guide, permissions)) return <PageAccessDenied />;
  if (guide.status !== "published" || !Article) return <GuideUnavailable title="Guide is being prepared" message="This guide has a planned record but its reviewed article is not published yet." />;

  const category = GUIDE_CATEGORIES.find((candidate) => candidate.id === guide.category);
  const related = GUIDE_RECORDS.filter((candidate) => guide.relatedGuideIds?.includes(candidate.id) && canDiscoverGuide(candidate, permissions));

  return (
    <PageShell className="gap-6 text-black-01 sm:px-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:px-8 xl:grid-cols-[minmax(0,1fr)_17rem]" grid>
      <article className="min-w-0">
        <Link to={routesPath.PROTECTED.SUPPORT.GUIDES} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-01 hover:text-primary"><ArrowLeft className="size-3.5" /> All guides</Link>
        <header className="mt-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.09em] text-gray-01"><span>{category?.title}</span><span className="size-1 rounded-full bg-gray-300" /><span>{guide.estimatedMinutes ?? 5} min read</span></div>
          <h1 className="mt-3 max-w-3xl font-mont text-3xl font-semibold tracking-tight sm:text-4xl">{guide.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-01 sm:text-base">{guide.summary}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {guide.primaryRoute && <Button asChild><Link to={guide.primaryRoute}>Open Console screen <ExternalLink className="size-4" /></Link></Button>}
            {guide.walkthroughId && findWalkthrough(guide.walkthroughId) && <Button variant="outline" onClick={() => startWalkthrough(guide.walkthroughId!)}><PlayCircle className="size-4" /> Start walkthrough</Button>}
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-white-02 pt-4 text-xs text-gray-01"><span>Owner: {guide.owner}</span><span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" /> Reviewed {guide.reviewedAt}</span></div>
        </header>

        <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <Suspense fallback={<div className="grid min-h-80 place-items-center"><Loader2 className="size-5 animate-spin text-primary" /></div>}>{createElement(Article)}</Suspense>
        </div>

        {related.length > 0 && <section className="mt-6"><h2 className="font-mont text-lg font-semibold">Related guides</h2><div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">{related.map((item) => item.status === "published" ? <Link key={item.id} to={routesPath.PROTECTED.SUPPORT.GUIDE_DETAIL(item.slug)} className="rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-primary/30"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs leading-5 text-gray-01">{item.summary}</p></Link> : <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-gray-01">Planned for a later category release.</p></div>)}</div></section>}

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex flex-col gap-3 border-b border-white-02 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-semibold">Finished this guide?</p><p className="mt-1 text-xs text-gray-01">Marking it complete helps editors see which guides lead to a finished task.</p></div>
            <Button
              size="sm"
              variant={completed ? "outline" : "default"}
              disabled={completed}
              onClick={() => {
                setCompleted(true);
                void recordAnalytics({ name: "guide.completed", guide_id: guide.id });
              }}
            >
              <CheckCircle2 className="size-4" /> {completed ? "Completed" : "Mark complete"}
            </Button>
          </div>
          <div className="pt-4">
            {feedback ? <div className="flex items-center gap-2 text-sm font-medium text-emerald-700"><Check className="size-4" /> Thank you. Your feedback was noted for this visit.</div> : <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">Was this guide helpful?</p><p className="mt-1 text-xs text-gray-01">Your answer helps us prioritize guide improvements.</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setFeedback("yes"); void recordAnalytics({ name: "guide.helpful_voted", guide_id: guide.id, outcome: "helpful" }); }}><ThumbsUp className="size-4" /> Yes</Button><Button size="sm" variant="outline" onClick={() => { setFeedback("no"); void recordAnalytics({ name: "guide.helpful_voted", guide_id: guide.id, outcome: "not_helpful" }); }}><ThumbsDown className="size-4" /> Not yet</Button></div></div>}
          </div>
          <div className="mt-4 border-t border-white-02 pt-4"><Button asChild variant="ghost" size="sm" className="px-0 text-gray-01"><Link to={routesPath.PROTECTED.SUPPORT.NEW} onClick={() => { void recordAnalytics({ name: "guide.outdated_reported", guide_id: guide.id }); }}><Flag className="size-4" /> Report an outdated guide</Link></Button></div>
        </section>
      </article>

      <aside className="min-w-0 lg:order-last">
        <nav aria-label="On this page" className="rounded-2xl border border-gray-200 bg-white p-4 lg:sticky lg:top-22">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-01">On this page</p>
          <ol className="mt-3 space-y-1">{guide.sections?.map((section) => <li key={section.id}><a href={`#${section.id}`} onClick={(event: MouseEvent<HTMLAnchorElement>) => {
            event.preventDefault();
            scrollToGuideSection(section.id);
          }} className="block rounded-lg px-2 py-2 text-xs leading-5 text-gray-600 hover:bg-primary/5 hover:text-primary">{section.title}</a></li>)}</ol>
          <Button asChild variant="outline" size="sm" className="mt-4 w-full"><Link to={routesPath.PROTECTED.SUPPORT.GUIDES}>Browse guides <ArrowRight className="size-3.5" /></Link></Button>
        </nav>
      </aside>
    </PageShell>
  );
}

function GuideUnavailable({ title, message }: { title: string; message: string }) {
  return <main className="grid min-h-[60vh] place-items-center px-4"><div className="max-w-md text-center"><BookOpenText className="mx-auto size-9 text-gray-300" /><h1 className="mt-4 font-mont text-xl font-semibold">{title}</h1><p className="mt-2 text-sm leading-6 text-gray-01">{message}</p><Button asChild className="mt-5"><Link to={routesPath.PROTECTED.SUPPORT.GUIDES}>Return to all guides</Link></Button></div></main>;
}
