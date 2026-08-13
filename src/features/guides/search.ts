import { GUIDE_CATEGORIES } from "./categories";
import type { GuideRecord, ScoredGuide } from "./types";

const normalize = (value: string) => value
  .toLocaleLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const words = (value: string) => normalize(value).split(" ").filter(Boolean);

function prefixMatches(query: string, value: string): boolean {
  const valueWords = words(value);
  return words(query).every((queryWord) => valueWords.some((word) => word.startsWith(queryWord)));
}

function scoreGuide(guide: GuideRecord, query: string): Pick<ScoredGuide, "matchKind" | "score"> | null {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return null;

  const title = normalize(guide.title);
  const aliases = guide.aliases.map(normalize);
  if (title === normalizedQuery) return { matchKind: "title", score: 400 };
  if (aliases.includes(normalizedQuery)) return { matchKind: "alias", score: 350 };

  const category = GUIDE_CATEGORIES.find((candidate) => candidate.id === guide.category);
  const searchable = [
    guide.title,
    ...guide.aliases,
    ...guide.tags,
    guide.summary,
    category?.title ?? "",
    ...guide.routes,
    ...guide.audiences.map((audience) => audience.replaceAll("-", " ")),
    ...(guide.sections?.map((section) => section.title) ?? []),
  ];

  if (searchable.some((value) => prefixMatches(normalizedQuery, value))) {
    return { matchKind: "prefix", score: 250 };
  }
  if (searchable.some((value) => normalize(value).includes(normalizedQuery))) {
    return { matchKind: "content", score: 150 };
  }
  return null;
}

/** Rank guide metadata without exposing records that the caller has filtered out. */
export function searchGuides(guides: readonly GuideRecord[], query: string, limit?: number): ScoredGuide[] {
  const ranked = guides
    .map((guide) => {
      const match = scoreGuide(guide, query);
      return match ? { guide, ...match } : null;
    })
    .filter((result): result is ScoredGuide => result !== null)
    .sort((a, b) => b.score - a.score || a.guide.title.localeCompare(b.guide.title));

  return limit == null ? ranked : ranked.slice(0, Math.max(0, limit));
}
