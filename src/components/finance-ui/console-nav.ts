// Types for a console's hierarchical sidebar menu. Parents with `children` are
// expand-only (they don't navigate — you click a child); leaf items navigate.
// `prefixes` gate visibility by backend key prefix (hasModuleAccess); a parent
// is shown when it has its own prefixes OR any visible child.

import type { ElementType } from "react";

export interface ConsoleNavChild {
  title: string;
  url: string;
  prefixes?: string[];
}

export interface ConsoleNavItem {
  title: string;
  url: string;
  icon?: ElementType;
  prefixes?: string[];
  children?: ConsoleNavChild[];
}

// A labelled section of the console sidebar (the design groups items under
// headings like "Ledger & Setup" / "Receivables"). An omitted `label` renders the
// items with no heading (e.g. a pinned Dashboard above the first group).
export interface ConsoleNavGroup {
  label?: string;
  items: ConsoleNavItem[];
}
