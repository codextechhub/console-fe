import { useNavigate } from "react-router";
import { Bell, CheckCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeDate } from "@/utils/helpers";
import { routesPath } from "@/routes/routes-path";
import { useNotifications } from "@/hooks/use-notifications";

/**
 * Header bell fed by the universal notification feed (/notify/). Shows the
 * latest unread items; clicking one deep-links to the Notifications page,
 * which opens that item's detail drawer via the ?notification= param.
 */
export function NotificationsBell() {
  const navigate = useNavigate();
  const { items, count } = useNotifications();

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
          {count > 0 && (
            <span className="rounded-full bg-pry-01 px-2 py-1 text-xs font-medium text-primary">
              {count} unread
            </span>
          )}
        </div>

        {!items.length ? (
          <div className="py-10 text-center">
            <CheckCheck className="mx-auto size-6 text-green-01" />
            <p className="mt-2 text-sm font-medium">You’re all caught up</p>
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => navigate(`${routesPath.PROTECTED.NOTIFICATIONS}?notification=${n.id}`)}
                  className="flex w-full gap-3 px-4 py-3 text-left hover:bg-gray-50"
                >
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{n.subject}</span>
                    <span className="block text-xs text-gray-01">
                      {n.event_type_label} · {formatRelativeDate(n.created_at)}
                    </span>
                  </span>
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
