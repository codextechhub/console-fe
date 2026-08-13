import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Compass,
  GraduationCap,
  PlayCircle,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wrench,
} from "lucide-react";
import { Link, useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  featuredGuides,
  GUIDE_CATEGORIES,
  GUIDE_REGISTRY,
  GUIDE_ROLE_ENTRY_POINTS,
  guidesForAudience,
  recentlyReviewedGuides,
  visibleGuides,
  type GuideAudience,
  type GuideCategoryId,
  type GuideRecord,
} from "@/features/guides";
import { selectPermissions } from "@/redux/features/auth/auth-slice";
import { useAppSelector } from "@/redux/store";
import { routesPath } from "@/routes/routes-path";

const CATEGORY_ICONS: Record<GuideCategoryId, React.ElementType> = {
  "getting-started": Compass,
  "schools-and-users": UserRound,
  "roles-and-permissions": ShieldCheck,
  "organogram-and-tasks": CheckCircle2,
  "approvals-and-workflow": PlayCircle,
  "finance-and-payments": BookOpenText,
  "procurement-and-inventory": Wrench,
  "data-imports-and-exports": ArrowRight,
  "audit-and-security": ShieldCheck,
  "platform-health-and-settings": Wrench,
  "account-and-personal-security": UserRound,
  troubleshooting: Wrench,
};

export default function HowToGuides() {
  const permissions = useAppSelector(selectPermissions);
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const categoryParam = params.get("category");
  const audienceParam = params.get("audience");
  const category = GUIDE_CATEGORIES.some((candidate) => candidate.id === categoryParam)
    ? categoryParam as GuideCategoryId
    : null;
  const audience = GUIDE_ROLE_ENTRY_POINTS.some((candidate) => candidate.id === audienceParam)
    ? audienceParam as GuideAudience
    : null;
  const permitted = useMemo(() => visibleGuides(GUIDE_REGISTRY, permissions), [permissions]);
  const audienceGuides = useMemo(() => guidesForAudience(permitted, audience), [audience, permitted]);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtered = useMemo(() => audienceGuides.filter((guide) => {
    if (category && guide.category !== category) return false;
    if (!normalizedQuery) return true;
    return [guide.title, guide.summary, ...guide.tags, ...guide.aliases]
      .some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
  }), [audienceGuides, category, normalizedQuery]);
  const popular = featuredGuides(permitted);
  const recent = recentlyReviewedGuides(permitted);

  const selectParam = (key: "category" | "audience", value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const showBrowseResults = Boolean(category || audience || normalizedQuery);

  return (
    <main className="grid min-w-0 grid-cols-1 gap-8 px-4.5 py-6 text-black-01 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.09] via-white to-emerald-50/70 px-5 py-8 shadow-[0_24px_70px_rgba(15,23,42,.06)] sm:px-8 sm:py-10 lg:px-12">
        <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm">
            <Sparkles className="size-3.5" /> Console how-to guide
          </div>
          <h1 className="max-w-2xl font-mont text-3xl font-semibold tracking-tight sm:text-4xl">
            What do you want to do in Console?
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-01 sm:text-base">
            Find clear steps for your role, understand what must be ready first, and launch guided help for complex work.
          </p>
          <label className="relative mt-6 block max-w-2xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-01" />
            <Input
              aria-label="Search how-to guides"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try ‘create a school’ or ‘permission denied’"
              className="h-13 rounded-2xl border-white bg-white pl-12 pr-4 text-sm shadow-[0_12px_35px_rgba(15,23,42,.08)]"
            />
          </label>
        </div>
      </section>

      <section aria-labelledby="role-heading">
        <SectionHeading id="role-heading" title="Guides for your role" subtitle="Start with the work closest to your responsibilities." />
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {GUIDE_ROLE_ENTRY_POINTS.map((role) => {
            const count = guidesForAudience(permitted, role.id).length;
            const selected = audience === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => selectParam("audience", selected ? null : role.id)}
                className={`min-w-0 rounded-2xl border p-4 text-left transition ${selected ? "border-primary bg-primary/[0.06] ring-3 ring-primary/10" : "border-gray-200 bg-white hover:border-primary/30 hover:shadow-sm"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><GraduationCap className="size-4.5" /></div>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-01">{count} available</span>
                </div>
                <p className="mt-3 text-sm font-semibold">{role.label}</p>
                <p className="mt-1 text-xs leading-5 text-gray-01">{role.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      {!showBrowseResults && popular.length > 0 && (
        <section aria-labelledby="popular-heading">
          <SectionHeading id="popular-heading" title="Popular tasks" subtitle="Start with the work people need most often." />
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {popular.map((guide) => <GuideCard key={guide.id} guide={guide} />)}
          </div>
        </section>
      )}

      <section aria-labelledby="category-heading">
        <SectionHeading id="category-heading" title="Browse by area" subtitle="The complete guide follows the same areas as Console." />
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {GUIDE_CATEGORIES.map((item) => {
            const Icon = CATEGORY_ICONS[item.id];
            const count = permitted.filter((guide) => guide.category === item.id).length;
            const selected = category === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => selectParam("category", selected ? null : item.id)}
                className={`group min-w-0 rounded-2xl border p-4 text-left transition ${selected ? "border-primary bg-primary/[0.05] ring-3 ring-primary/10" : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gray-100 text-gray-700 transition group-hover:bg-primary/10 group-hover:text-primary"><Icon className="size-5" /></div>
                  <ChevronRight className="size-4 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                <p className="mt-3 text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-gray-01">{item.description}</p>
                <p className="mt-3 text-[11px] font-medium text-gray-01">{count ? `${count} available` : "Coming in its category release"}</p>
              </button>
            );
          })}
        </div>
      </section>

      {showBrowseResults && (
        <section aria-live="polite" aria-labelledby="results-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionHeading id="results-heading" title="Guide results" subtitle={`${filtered.length} guide${filtered.length === 1 ? "" : "s"} available for these filters.`} />
            <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setParams({}, { replace: true }); }}>Clear filters</Button>
          </div>
          {filtered.length ? (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((guide) => <GuideCard key={guide.id} guide={guide} />)}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-10 text-center">
              <BookOpenText className="mx-auto size-8 text-gray-300" />
              <p className="mt-3 text-sm font-semibold">No available guide matches yet</p>
              <p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-gray-01">Try a broader phrase or clear the role and category filters. Restricted guides stay hidden until your account has access.</p>
            </div>
          )}
        </section>
      )}

      {!showBrowseResults && recent.length > 0 && (
        <section aria-labelledby="recent-heading">
          <SectionHeading id="recent-heading" title="Recently reviewed" subtitle="Guidance checked against the current Console behaviour." />
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {recent.map((guide) => <GuideCard key={guide.id} guide={guide} compact />)}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Still need help?</p>
          <p className="mt-1 text-xs leading-5 text-gray-01">Create a support ticket and include what happened, what you expected, and any screenshots.</p>
        </div>
        <Button asChild className="w-full shrink-0 sm:w-auto"><Link to={routesPath.PROTECTED.SUPPORT.NEW}>Create support ticket</Link></Button>
      </section>
    </main>
  );
}

function SectionHeading({ id, title, subtitle }: { id: string; title: string; subtitle: string }) {
  return <div><h2 id={id} className="font-mont text-lg font-semibold">{title}</h2><p className="mt-1 text-xs text-gray-01">{subtitle}</p></div>;
}

function GuideCard({ guide, compact = false }: { guide: GuideRecord; compact?: boolean }) {
  const category = GUIDE_CATEGORIES.find((candidate) => candidate.id === guide.category);
  const content = (
    <>
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-01">
        <span>{category?.title}</span>
        <span className="size-1 rounded-full bg-gray-300" />
        <span className="inline-flex items-center gap-1"><Clock3 className="size-3" /> Reviewed {guide.reviewedAt}</span>
      </div>
      <p className="mt-2 text-sm font-semibold leading-5">{guide.title}</p>
      {!compact && <p className="mt-1 text-xs leading-5 text-gray-01">{guide.summary}</p>}
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className={guide.status === "published" ? "rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700" : "rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700"}>{guide.status === "published" ? "Published" : "Planned"}</span>
        {guide.walkthroughId && <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary"><PlayCircle className="size-3.5" /> Walkthrough planned</span>}
      </div>
    </>
  );

  if (guide.status !== "published") {
    return <article className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4">{content}</article>;
  }

  return <Link to={routesPath.PROTECTED.SUPPORT.GUIDE_DETAIL(guide.slug)} className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-primary/30 hover:shadow-md">{content}</Link>;
}
