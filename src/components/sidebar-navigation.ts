/**
 * Restore a sidebar's position, then reveal the most specific active entry.
 * Expandable navigation marks both the section and its child active, so the
 * last active element is the leaf the user actually navigated to.
 */
export function revealActiveSidebarItem(
  element: HTMLElement,
  rememberedScroll: number | null | undefined,
) {
  if (rememberedScroll != null) element.scrollTop = rememberedScroll;

  const activeItems = element.querySelectorAll<HTMLElement>('[data-active="true"]');
  const active = activeItems.item(activeItems.length - 1);
  if (!active) return;

  const containerRect = element.getBoundingClientRect();
  const activeRect = active.getBoundingClientRect();

  if (rememberedScroll == null) {
    element.scrollTop +=
      activeRect.top - containerRect.top -
      (element.clientHeight - activeRect.height) / 2;
  } else if (activeRect.top < containerRect.top) {
    element.scrollTop -= containerRect.top - activeRect.top + 8;
  } else if (activeRect.bottom > containerRect.bottom) {
    element.scrollTop += activeRect.bottom - containerRect.bottom + 8;
  }
}
