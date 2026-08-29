import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
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
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  featuredGuides,
  guideLandingView,
  GUIDE_CATEGORIES,
  GUIDE_REGISTRY,
  GUIDE_ROLE_ENTRY_POINTS,
  findWalkthrough,
  guidesForAudience,
  recentlyReviewedGuides,
  resolveGuideRoutePattern,
  searchGuides,
  visibleGuides,
  type GuideAudience,
  type GuideCategoryId,
  type GuideRecord,
} from "@/features/guides";
import { selectPermissions } from "@/redux/features/auth/auth-slice";
import { useAppSelector } from "@/redux/store";
import { routesPath } from "@/routes/routes-path";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { useRecordGuideAnalyticsMutation } from "@/redux/services/guide-analytics-api";
import { PageShell } from "@/components/layout/page-shell";

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
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermissions();
  const permissions = useAppSelector(selectPermissions);
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [activeResult, setActiveResult] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const recordedNoResults = useRef(new Set<string>());
  const [recordAnalytics] = useRecordGuideAnalyticsMutation();
  const categoryParam = params.get("category");
  const audienceParam = params.get("audience");
  const category = GUIDE_CATEGORIES.some((candidate) => candidate.id === categoryParam)
    ? categoryParam as GuideCategoryId
    : null;
  const audience = GUIDE_ROLE_ENTRY_POINTS.some((candidate) => candidate.id === audienceParam)
    ? audienceParam as GuideAudience
    : null;
  const selectedCategory = GUIDE_CATEGORIES.find((candidate) => candidate.id === category) ?? null;
  const selectedAudience = GUIDE_ROLE_ENTRY_POINTS.find((candidate) => candidate.id === audience) ?? null;
  const permitted = useMemo(() => visibleGuides(GUIDE_REGISTRY, permissions), [permissions]);
  const audienceGuides = useMemo(() => guidesForAudience(permitted, audience), [audience, permitted]);
  const normalizedQuery = query.trim();
  const categoryGuides = useMemo(
    () => audienceGuides.filter((guide) => !category || guide.category === category),
    [audienceGuides, category],
  );
  const searchResults = useMemo(() => {
    if (!normalizedQuery) return [];
    return searchGuides(categoryGuides, normalizedQuery);
  }, [categoryGuides, normalizedQuery]);
  const filtered = normalizedQuery
    ? searchResults.map((result) => result.guide)
    : categoryGuides;
  const suggestions = searchResults.slice(0, 6);
  const popular = featuredGuides(permitted);
  const recent = recentlyReviewedGuides(permitted);
  const activeGuideIndex = filtered.length ? Math.min(activeResult, filtered.length - 1) : 0;
  const activeSuggestionIndex = suggestions.length ? Math.min(activeResult, suggestions.length - 1) : 0;
  const landingView = guideLandingView({ category, audience, query: normalizedQuery });
  const roleEntries = selectedAudience ? [selectedAudience] : GUIDE_ROLE_ENTRY_POINTS;

  useEffect(() => {
    if (normalizedQuery.length < 2 || filtered.length > 0) return;
    const key = `${category ?? "all"}:${audience ?? "all"}:${normalizedQuery.toLocaleLowerCase()}`;
    if (recordedNoResults.current.has(key)) return;
    const timeout = window.setTimeout(() => {
      recordedNoResults.current.add(key);
      const routePattern = resolveGuideRoutePattern(location.pathname);
      void recordAnalytics({
        name: "search.no_results",
        query: normalizedQuery,
        ...(routePattern ? { route_pattern: routePattern } : {}),
        result_count: 0,
      });
    }, 800);
    return () => window.clearTimeout(timeout);
  }, [audience, category, filtered.length, location.pathname, normalizedQuery, recordAnalytics]);

  const selectParam = (key: "category" | "audience", value: string | null) => {
    setActiveResult(0);
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const handleSearchNavigation = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setSearchOpen(false);
      return;
    }
    if (!normalizedQuery || suggestions.length === 0) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setSearchOpen(true);
      setActiveResult((index) => (index + step + suggestions.length) % suggestions.length);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const guide = suggestions[activeSuggestionIndex]?.guide ?? suggestions[0].guide;
      setSearchOpen(false);
      navigate(routesPath.PROTECTED.SUPPORT.GUIDE_DETAIL(guide.slug));
    }
  };

  return (
    <PageShell className="gap-8 text-black-01 sm:px-6 lg:px-8" grid>
      <section className="relative z-10 rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.09] via-white to-emerald-50/70 px-5 py-8 shadow-[0_24px_70px_rgba(15,23,42,.06)] sm:px-8 sm:py-10 lg:px-12">
        <div className="pointer-events-none absolute right-0 top-0 size-40 rounded-full bg-primary/10 blur-3xl sm:size-56" />
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
          <div
            className="relative mt-6 max-w-2xl"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false);
            }}
          >
            <Search className="pointer-events-none absolute left-4 top-6.5 z-10 size-5 -translate-y-1/2 text-gray-01" />
            <Input
              aria-label="Search how-to guides"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={searchOpen && Boolean(normalizedQuery)}
              aria-controls="guide-search-suggestions"
              aria-activedescendant={searchOpen && suggestions.length
                ? `guide-search-suggestion-${activeSuggestionIndex}`
                : undefined}
              value={query}
              onFocus={() => setSearchOpen(true)}
              onChange={(event) => { setQuery(event.target.value); setActiveResult(0); setSearchOpen(true); }}
              onKeyDown={handleSearchNavigation}
              placeholder="Try ‘create a school’ or ‘permission denied’"
              className="h-13 rounded-2xl border-white bg-white pl-12 pr-4 text-sm shadow-[0_12px_35px_rgba(15,23,42,.08)]"
            />
            {searchOpen && normalizedQuery && (
              <div
                id="guide-search-suggestions"
                role="listbox"
                aria-label="Guide suggestions"
                className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,.16)]"
              >
                {suggestions.length ? suggestions.map((result, index) => {
                  const category = GUIDE_CATEGORIES.find((candidate) => candidate.id === result.guide.category);
                  const active = index === activeSuggestionIndex;
                  return (
                    <button
                      id={`guide-search-suggestion-${index}`}
                      key={result.guide.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setActiveResult(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => navigate(routesPath.PROTECTED.SUPPORT.GUIDE_DETAIL(result.guide.slug))}
                      className={`flex w-full min-w-0 items-start gap-3 rounded-xl px-3 py-3 text-left transition ${active ? "bg-primary/[0.07]" : "hover:bg-gray-50"}`}
                    >
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><BookOpenText className="size-4" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-black-01">{result.guide.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-gray-01">{category?.title} · {result.guide.summary}</span>
                      </span>
                      <ArrowRight className="mt-2 size-4 shrink-0 text-gray-300" />
                    </button>
                  );
                }) : (
                  <div className="px-4 py-5 text-center">
                    <p className="text-sm font-semibold">No guide matches yet</p>
                    <p className="mt-1 text-xs text-gray-01">Try fewer words, a different order, or a task phrase.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {landingView === "search-results" && (
        <GuideResults
          guides={filtered}
          queryActive
          activeGuideIndex={activeGuideIndex}
          onActivateGuide={setActiveResult}
          onClear={() => { setQuery(""); setActiveResult(0); setParams({}, { replace: true }); }}
        />
      )}

      {landingView !== "search-results" && (
        <section aria-labelledby="role-heading">
          <SectionHeading
            id="role-heading"
            title="Guides for your role"
            subtitle={selectedAudience
              ? "Showing this responsibility. Select it again or clear the filter to see every role."
              : "Start with the work closest to your responsibilities."}
          />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {roleEntries.map((role) => {
              const count = guidesForAudience(permitted, role.id).length;
              const selected = audience === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  aria-pressed={selected}
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
      )}

      {landingView === "audience-results" && (
        <GuideResults
          guides={filtered}
          queryActive={false}
          activeGuideIndex={activeGuideIndex}
          onActivateGuide={setActiveResult}
          onClear={() => { setActiveResult(0); setParams({}, { replace: true }); }}
        />
      )}

      {(landingView === "browse" || landingView === "category-results") && (
        <section aria-labelledby="category-heading">
          {selectedCategory ? (
            <CategoryGuideResults
              category={selectedCategory}
              guides={filtered}
              audienceLabel={selectedAudience?.label}
              queryActive={Boolean(normalizedQuery)}
              activeGuideIndex={activeGuideIndex}
              onActivateGuide={setActiveResult}
              onBack={() => selectParam("category", null)}
            />
          ) : (
            <>
              <SectionHeading id="category-heading" title="Browse by area" subtitle="Choose an area to see its guides here without losing your place." />
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {GUIDE_CATEGORIES.map((item) => {
                  const Icon = CATEGORY_ICONS[item.id];
                  const count = audienceGuides.filter((guide) => guide.category === item.id).length;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => selectParam("category", item.id)}
                      className="group min-w-0 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
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
            </>
          )}
        </section>
      )}

      {landingView === "browse" && popular.length > 0 && (
        <section aria-labelledby="popular-heading">
          <SectionHeading id="popular-heading" title="Popular tasks" subtitle="Start with the work people need most often." />
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {popular.map((guide) => <GuideCard key={guide.id} guide={guide} />)}
          </div>
        </section>
      )}

      {landingView === "browse" && recent.length > 0 && (
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

      {hasPermission(P.VIEW_HEALTH) && (
        <section className="flex flex-col gap-4 rounded-2xl border border-primary/15 bg-primary/[0.035] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><BarChart3 className="size-5" /></span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Maintain the guide system</p>
              <p className="mt-1 text-xs leading-5 text-gray-01">Review route and action gaps, stale articles, broken relations, and walkthrough target checks.</p>
            </div>
          </div>
          <Button asChild variant="white" className="w-full shrink-0 sm:w-auto"><Link to={routesPath.PROTECTED.SUPPORT.GUIDE_COVERAGE}>View coverage</Link></Button>
        </section>
      )}
    </PageShell>
  );
}

function GuideResults({
  guides,
  queryActive,
  activeGuideIndex,
  onActivateGuide,
  onClear,
}: {
  guides: GuideRecord[];
  queryActive: boolean;
  activeGuideIndex: number;
  onActivateGuide: (index: number) => void;
  onClear: () => void;
}) {
  return (
    <section aria-live="polite" aria-labelledby="results-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeading
          id="results-heading"
          title="Guide results"
          subtitle={`${guides.length} guide${guides.length === 1 ? "" : "s"} available for these filters.`}
        />
        <Button variant="ghost" size="sm" onClick={onClear}>Clear filters</Button>
      </div>
      {guides.length ? (
        <div
          id="guide-browse-results"
          role={queryActive ? "listbox" : undefined}
          aria-label={queryActive ? "Guide search results" : undefined}
          className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
        >
          {guides.map((guide, index) => (
            <GuideCard
              key={guide.id}
              guide={guide}
              resultIndex={queryActive ? index : undefined}
              active={queryActive && index === activeGuideIndex}
              onActivate={() => onActivateGuide(index)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-10 text-center">
          <BookOpenText className="mx-auto size-8 text-gray-300" />
          <p className="mt-3 text-sm font-semibold">No available guide matches yet</p>
          <p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-gray-01">
            Try a broader phrase or clear the filters. Restricted and unpublished guides stay hidden.
          </p>
        </div>
      )}
    </section>
  );
}

function CategoryGuideResults({
  category,
  guides,
  audienceLabel,
  queryActive,
  activeGuideIndex,
  onActivateGuide,
  onBack,
}: {
  category: (typeof GUIDE_CATEGORIES)[number];
  guides: GuideRecord[];
  audienceLabel?: string;
  queryActive: boolean;
  activeGuideIndex: number;
  onActivateGuide: (index: number) => void;
  onBack: () => void;
}) {
  const Icon = CATEGORY_ICONS[category.id];
  const filterContext = [audienceLabel, queryActive ? "your search" : null].filter(Boolean).join(" and ");

  return (
    <div aria-live="polite" className="rounded-3xl border border-primary/15 bg-primary/[0.025] p-4 sm:p-6">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-01 hover:text-primary">
        <ArrowLeft className="size-3.5" /> Back to all areas
      </button>
      <div className="mt-4 flex min-w-0 items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Selected area</p>
          <h2 id="category-heading" className="mt-1 font-mont text-xl font-semibold sm:text-2xl">{category.title}</h2>
          <p className="mt-1 text-sm leading-6 text-gray-01">{category.description}</p>
          <p className="mt-2 text-xs font-medium text-gray-01">
            {guides.length} guide{guides.length === 1 ? "" : "s"}{filterContext ? ` matching ${filterContext}` : " in this area"}
          </p>
        </div>
      </div>

      {guides.length ? (
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {guides.map((guide, index) => (
            <GuideCard
              key={guide.id}
              guide={guide}
              resultIndex={queryActive ? index : undefined}
              active={queryActive && index === activeGuideIndex}
              onActivate={() => onActivateGuide(index)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-8 text-center">
          <BookOpenText className="mx-auto size-8 text-gray-300" />
          <p className="mt-3 text-sm font-semibold">No available guide matches here</p>
          <p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-gray-01">Clear the search or role filter, or return to all areas to browse somewhere else.</p>
        </div>
      )}
    </div>
  );
}

function SectionHeading({ id, title, subtitle }: { id: string; title: string; subtitle: string }) {
  return <div><h2 id={id} className="font-mont text-lg font-semibold">{title}</h2><p className="mt-1 text-xs text-gray-01">{subtitle}</p></div>;
}

function GuideCard({
  guide,
  compact = false,
  resultIndex,
  active = false,
  onActivate,
}: {
  guide: GuideRecord;
  compact?: boolean;
  resultIndex?: number;
  active?: boolean;
  onActivate?: () => void;
}) {
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
        {guide.walkthroughId && <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary"><PlayCircle className="size-3.5" /> {findWalkthrough(guide.walkthroughId) ? "Walkthrough available" : "Walkthrough planned"}</span>}
      </div>
    </>
  );

  if (guide.status !== "published") {
    return <article className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4">{content}</article>;
  }

  return (
    <Link
      id={resultIndex == null ? undefined : `guide-search-result-${resultIndex}`}
      role={resultIndex == null ? undefined : "option"}
      aria-selected={resultIndex == null ? undefined : active}
      onMouseEnter={onActivate}
      to={routesPath.PROTECTED.SUPPORT.GUIDE_DETAIL(guide.slug)}
      className={`min-w-0 rounded-2xl border bg-white p-4 transition hover:border-primary/30 hover:shadow-md ${active ? "border-primary ring-3 ring-primary/10" : "border-gray-200"}`}
    >
      {content}
    </Link>
  );
}
