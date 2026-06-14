import { useNavigate } from "react-router";
import { CheckCheck, ClipboardCheck, CornerUpLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { svgIcons } from "@/assets/svg";
import { formatRelativeDate } from "@/utils/helpers";
import { routesPath } from "@/routes/routes-path";
import { useNotifications, type NotificationType } from "@/hooks/use-notifications";

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  approval: <ClipboardCheck className="size-4" />,
  returned: <CornerUpLeft className="size-4" />,
};

/**
 * Universal notifications center in the header. Opens a dropdown listing one
 * row per module (from `useNotifications`); each row opens that module's list.
 * The footer links to the full notifications page.
 */
export function NotificationsBell() {
  const navigate = useNavigate();
  const { groups, count } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={count > 0 ? `${count} notifications` : "Notifications"}
          className="size-8.5 rounded-full relative bg-gray-04 grid place-content-center"
        >
          {svgIcons.notificationBell}
          {count > 0 && (
            <span className="absolute -top-1 -right-1 grid min-w-4 h-4 place-content-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[360px] max-w-[calc(100vw-2rem)] p-0"
      >
        <div className="flex items-center justify-between border-b border-white-02 px-4 py-3">
          <span className="text-sm font-semibold text-black-01">Notifications</span>
          {count > 0 && (
            <span className="rounded-full bg-pry-01 px-2 py-0.5 text-xs font-medium text-primary">
              {count} new
            </span>
          )}
        </div>

        {groups.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <span className="mx-auto grid size-11 place-content-center rounded-full bg-green-01/10 text-green-01">
              <CheckCheck className="size-5" />
            </span>
            <p className="mt-2 text-sm font-medium text-black-01">You're all caught up</p>
            <p className="text-xs text-gray-01">No new notifications.</p>
          </div>
        ) : (
          <ul className="py-1">
            {groups.map((g) => (
              <li key={g.key}>
                <button
                  type="button"
                  onClick={() => navigate(g.href)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                >
                  <span className="mt-0.5 grid size-8 shrink-0 place-content-center rounded-full bg-pry-01 text-primary">
                    {TYPE_ICON[g.type]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-black-01">{g.title}</span>
                      <span className="shrink-0 rounded-full bg-destructive/10 px-1.5 text-[11px] font-semibold text-destructive">
                        {g.count}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-gray-01">{g.description}</span>
                    {g.time && (
                      <span className="block text-[11px] text-gray-05">
                        {formatRelativeDate(g.time)}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={() => navigate(routesPath.PROTECTED.NOTIFICATIONS)}
          className="block w-full border-t border-white-02 px-4 py-2.5 text-center text-xs font-medium text-primary hover:bg-gray-50"
        >
          View all notifications
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
