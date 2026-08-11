import { useNavigate } from "react-router";
import { Bell, CheckCheck, Loader2, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeDate } from "@/utils/helpers";
import { routesPath } from "@/routes/routes-path";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationEventIcon } from "@/components/custom/notification-event-icon";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationsReadMutation,
} from "@/redux/services/notifications-api";

/**
 * Header bell fed by the universal notification feed (/notify/). Shows the
 * latest unread items; clicking one takes the user directly to the event.
 */
export function NotificationsBell() {
  const navigate = useNavigate();
  const { items, count } = useNotifications();
  const [markRead, { isLoading: markingOne }] = useMarkNotificationsReadMutation();
  const [markAll, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={count ? `${count} unread notifications` : "Notifications"}
          className="relative grid size-8.5 place-content-center rounded-full bg-gray-04 text-gray-700"
        >
          <Bell className="size-4.5" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-content-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-[380px] max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-gray-01">Your latest updates</p>
          </div>
          <div className="flex items-center gap-2">
            {count > 0 && (
              <span className="rounded-full bg-pry-01 px-2 py-1 text-xs font-medium text-primary">
                {count} unread
              </span>
            )}
            {count > 0 && (
              <button
                type="button"
                disabled={markingAll}
                onClick={() => markAll()}
                className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-gray-01 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {markingAll ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="size-3.5" />
                )}
                Clear all
              </button>
            )}
          </div>
        </div>

        {!items.length ? (
          <div className="py-10 text-center">
            <CheckCheck className="mx-auto size-6 text-green-01" />
            <p className="mt-2 text-sm font-medium">You’re all caught up</p>
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((n) => (
              <li key={n.id} className="group relative">
                <button
                  type="button"
                  onClick={() => {
                    // Fire-and-forget so navigation isn't held on the
                    // mark-read round-trip.
                    markRead({ ids: [n.id] });
                    navigate(n.action_url || routesPath.PROTECTED.NOTIFICATIONS);
                  }}
                  className="flex w-full gap-3 px-4 py-3 pr-12 text-left hover:bg-gray-50"
                >
                  <span className="mt-0.5 grid size-8 shrink-0 place-content-center rounded-full bg-pry-01 text-primary">
                    <NotificationEventIcon eventKey={n.event_type_key} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{n.subject}</span>
                    <span className="mt-0.5 line-clamp-2 block text-xs text-gray-01">{n.body}</span>
                    <span className="mt-1 block text-[10px] text-gray-400">
                      {n.event_type_key === "workflow.final_approved"
                        ? formatRelativeDate(n.created_at)
                        : `${n.event_type_label} · ${formatRelativeDate(n.created_at)}`}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Clear ${n.subject}`}
                  title="Clear notification"
                  disabled={markingOne}
                  onClick={() => markRead({ ids: [n.id] })}
                  className="absolute right-3 top-3 grid size-6 place-content-center rounded-full bg-gray-100 text-gray-500 opacity-100 transition hover:bg-gray-200 hover:text-gray-800 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:opacity-0 sm:group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={() => navigate(routesPath.PROTECTED.NOTIFICATIONS)}
          className="w-full border-t px-4 py-3 text-center text-xs font-semibold text-primary hover:bg-gray-50"
        >
          View all notifications
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
