type AttentionDestination = {
  count: number;
  to: string;
};

/**
 * Send the aggregate Spotlight card to the first attention category that
 * actually contributed to its count. Callers pass items in display/urgency
 * order, keeping the hero destination aligned with the detail list below it.
 */
export function resolveAttentionDestination(
  items: readonly AttentionDestination[],
  fallback: string,
) {
  return items.find((item) => item.count > 0)?.to ?? fallback;
}
