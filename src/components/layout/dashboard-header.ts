/**
 * Per-screen header config for the dashboard shell.
 *
 * DashboardLayout is an eager LAYOUT ROUTE (see routes/protected/index.tsx): it
 * renders once above the lazy page chunks and so can no longer receive props
 * from the page it wraps. Two channels replace those props:
 *
 *  1. `handle` - react-router's slot for static, route-owned metadata. Carries
 *     the screen's default title, its back affordance, and which sidebar the
 *     console uses. Deepest matched route wins, so a nested screen overrides
 *     its parent without the parent knowing.
 *  2. `useDashboardTitle` / `useDashboardBack` - the runtime escape hatch, for
 *     the handful of screens whose title only exists once server data lands
 *     (a ticket number) or whose back destination is a closure over state.
 *
 * A runtime override is stamped with the location key it was set under and is
 * ignored the moment the location changes, so a stale title can never bleed
 * into the next screen even if a page forgets to clean up.
 */

import { createContext, useContext, useEffect, useRef } from "react";

/** Which left navigation the shell renders for this route. */
export type SidebarKind = "global" | "finance" | "procurement";

/**
 * Back affordance declared on a route: `true` = history back, a path string =
 * navigate there. Destinations that need a closure use `useDashboardBack`.
 */
export type BackSpec = true | string;

/** Route-owned header metadata: `handle: { … } satisfies DashboardHandle`. */
export type DashboardHandle = {
  /** Header title. Falls back to "Home" when omitted. */
  title?: string;
  /** Show the back affordance, and where it goes. */
  back?: BackSpec;
  /** Left navigation; defaults to the global AppSidebar. */
  sidebar?: SidebarKind;
};

/** A runtime override, valid only for the location it was set under. */
export type HeaderOverride = {
  key: string;
  title?: string;
  back?: () => void;
};

/** The resolved header, after handles and any live override are combined. */
export type ResolvedHeader = {
  title?: string;
  back?: BackSpec | (() => void);
};

/**
 * Fold the matched route chain into one handle - deepest match wins per field,
 * so a detail route can set its own title while inheriting the parent's sidebar.
 */
export function mergeHandles(matches: readonly { handle?: unknown }[]): DashboardHandle {
  return matches.reduce<DashboardHandle>((acc, match) => {
    const handle = match.handle as DashboardHandle | undefined;
    if (!handle) return acc;
    return {
      title: handle.title ?? acc.title,
      back: handle.back ?? acc.back,
      sidebar: handle.sidebar ?? acc.sidebar,
    };
  }, {});
}

/**
 * Runtime override beats the route handle - but only while the user is still on
 * the location that set it. Once `locationKey` moves on, the override is dead
 * and the new route's handle takes over immediately (no stale-title flash).
 */
export function resolveHeader(
  handle: DashboardHandle,
  override: HeaderOverride | null,
  locationKey: string,
): ResolvedHeader {
  const live = override && override.key === locationKey ? override : null;
  return {
    title: live?.title ?? handle.title,
    back: live?.back ?? handle.back,
  };
}

export type DashboardHeaderApi = {
  setTitle: (title?: string) => void;
  setBack: (back?: () => void) => void;
};

// Outside the layout (unit tests, isolated renders) the setters are inert
// rather than throwing, so a page component stays mountable on its own.
const INERT: DashboardHeaderApi = { setTitle: () => {}, setBack: () => {} };

export const DashboardHeaderContext = createContext<DashboardHeaderApi | null>(null);

export function useDashboardHeader(): DashboardHeaderApi {
  return useContext(DashboardHeaderContext) ?? INERT;
}

/**
 * Override the header title from page state. Pass `undefined` while the data is
 * still loading and the route's `handle.title` shows through.
 */
export function useDashboardTitle(title?: string): void {
  const { setTitle } = useDashboardHeader();
  useEffect(() => {
    setTitle(title);
    return () => setTitle(undefined);
  }, [setTitle, title]);
}

/**
 * Override the back destination with a closure - for the sites whose target
 * depends on state the route can't express. Static destinations belong in
 * `handle.back`.
 *
 * The handler is read through a ref at click time, so an inline arrow (a fresh
 * identity every render) registers once instead of re-registering forever.
 */
export function useDashboardBack(handler?: () => void): void {
  const { setBack } = useDashboardHeader();
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });

  const enabled = Boolean(handler);
  useEffect(() => {
    if (!enabled) return;
    setBack(() => latest.current?.());
    return () => setBack(undefined);
  }, [setBack, enabled]);
}
