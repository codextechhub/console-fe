import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";

/**
 * Seed a screen's local filter state from a query param, then strip the param.
 * The deep-link side of dashboard cards: "?status=RETURNED" lands with the
 * Returned tab active, after which the filter behaves exactly as if the user
 * had clicked it - the URL doesn't keep tracking later filter changes.
 *
 * Same one-shot + strip semantics as useActionParam (the palette's landing
 * hook); this one carries a value and only fires for values in `valid`.
 */
export function useFilterParam<T extends string>(
  key: string,
  valid: readonly T[],
  apply: (value: T) => void,
): void {
  const [params, setParams] = useSearchParams();
  const firedRef = useRef(false);

  useEffect(() => {
    const raw = params.get(key);
    if (raw === null) {
      firedRef.current = false;
      return;
    }
    if (firedRef.current) return;
    firedRef.current = true;
    if ((valid as readonly string[]).includes(raw)) apply(raw as T);
    const next = new URLSearchParams(params);
    next.delete(key);
    setParams(next, { replace: true });
    // `valid` is a fresh array literal each render at every call site; keying
    // the effect on it would re-run per render for nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, key, apply, setParams]);
}
