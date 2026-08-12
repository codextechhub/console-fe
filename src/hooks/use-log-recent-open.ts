import { useEffect } from "react";
import { useAppSelector } from "@/redux/store";
import { logRecentOpen, type RecentKind } from "@/lib/recent-opens";

/**
 * Log "the user opened this entity" once its label is known. Detail screens
 * pass null until their query resolves; the log fires once per distinct
 * kind+id+label and feeds the dashboard's "Pick up where you left off" strip.
 */
export function useLogRecentOpen(
  entry: { kind: RecentKind; id: string; label: string; to: string } | null,
): void {
  const userId = useAppSelector((state) => state.auth.user?.id);
  const kind = entry?.kind;
  const id = entry?.id;
  const label = entry?.label;
  const to = entry?.to;

  useEffect(() => {
    if (!kind || !id || !label || !to) return;
    logRecentOpen(userId, { kind, id, label, to });
  }, [userId, kind, id, label, to]);
}
