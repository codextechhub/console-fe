import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";

/**
 * Keys consumed by any instance of this hook in the current commit.
 *
 * A screen can land with two deep-link params (`?status=ACTIVE&assignee=me`),
 * which means two effects stripping one key each in the same commit. Neither
 * sees the other's write - react-router hands the updater the params from the
 * last render, not the URL as it stands - so each would put the other's key
 * back, and whichever ran first would lose. Stripping *every* consumed key on
 * each write makes the outcome the same regardless of order: the last write
 * removes them all.
 */
const consumedKeys = new Set<string>();

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

  // Stop announcing this key once the screen is gone, so a later screen using
  // the same param name is not stripped by a mount that has nothing to do
  // with it.
  useEffect(() => () => { consumedKeys.delete(key); }, [key]);

  useEffect(() => {
    const raw = params.get(key);
    if (raw === null) {
      firedRef.current = false;
      return;
    }
    if (firedRef.current) return;
    firedRef.current = true;
    if ((valid as readonly string[]).includes(raw)) apply(raw as T);
    consumedKeys.add(key);
    const next = new URLSearchParams(params);
    consumedKeys.forEach((consumed) => next.delete(consumed));
    setParams(next, { replace: true });
    // `valid` is a fresh array literal each render at every call site; keying
    // the effect on it would re-run per render for nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, key, apply, setParams]);
}
