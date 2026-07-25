// Notifications page — the user's personal in-app feed over /notify/, with a
// actionable links. Platform administration (history, settings, templates, event
// catalogue) lives on its own gated page at /notifications/admin.

import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Bell, CheckCheck, Loader2, Settings2 } from "lucide-react";
import { CustomInput } from "@/components/custom/custom-input";
import { Button } from "@/components/ui/button";
import { NotificationEventIcon } from "@/components/custom/notification-event-icon";
import { formatRelativeDate } from "@/utils/helpers";
import { cn } from "@/lib/utils";
import { routesPath } from "@/routes/routes-path";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationsReadMutation,
} from "@/redux/services/notifications-api";

type Filter = "all" | "unread" | "read";

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
];

export default function Notifications() {
  const navigate = useNavigate();
  const { hasAnyPermission } = usePermissions();
  const canAdminister = hasAnyPermission(
    P.AUDIT_NOTIFICATION_ACTIVITY,
    P.ENFORCE_NOTIFICATION_SETTINGS,
    P.CONFIGURE_NOTIFICATION_TEMPLATES,
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const params = { page, page_size: 20, ...(filter === "all" ? {} : { is_read: filter === "read" }) };
  const { data, isLoading, isError, refetch } = useGetNotificationsQuery(params);
  // Total unread across all pages (drives "Mark all as read"); the bell
  // already polls this endpoint, so the page reuses the cached entry.
  const unreadCount = useGetUnreadCountQuery().data?.data.unread_count ?? 0;
  const [markRead] = useMarkNotificationsReadMutation();
  const [markAll, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();

  // Client-side filter over the loaded page only (the feed has no server-side
  // text search) — the placeholder says so honestly.
  const rows = (data?.data ?? []).filter(
    (n) => !search || `${n.subject} ${n.body} ${n.event_type_label}`.toLowerCase().includes(search.toLowerCase()),
  );

  const open = (notification: (typeof rows)[number]) => {
    // Fire-and-forget so navigation isn't held on the mark-read round-trip.
    if (!notification.is_read) markRead({ ids: [notification.id] });
    if (notification.action_url) navigate(notification.action_url);
  };

  return (
    <>
      <main className="min-w-0 px-4.5 py-6 space-y-5 text-black-01">
        {/* Intro row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold font-mont text-gray-01">Notification Centre</p>
            <p className="text-xs text-gray-01 mt-0.5">
              Stay on top of activity across every part of the platform.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {canAdminister && (
              <Button variant="white" size="lg" asChild>
                <Link to={routesPath.PROTECTED.NOTIFICATIONS_ADMIN}>
                  <Settings2 className="size-4" />
                  Administration
                </Link>
              </Button>
            )}
            <Button
              variant="white"
              size="lg"
              disabled={!unreadCount || markingAll}
              onClick={() => markAll()}
            >
              <CheckCheck className="size-4" />
              {markingAll ? "Marking…" : "Mark all as read"}
            </Button>
          </div>
        </div>

        {/* Filter pill + page search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="flex h-11 w-fit items-center gap-x-1 rounded-sm bg-white px-1.5 py-1"
            role="tablist"
            aria-label="Read state"
          >
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                role="tab"
                aria-selected={filter === value}
                onClick={() => {
                  setFilter(value);
                  setPage(1);
                }}
                className={cn(
                  "h-full min-w-20 cursor-pointer rounded bg-transparent px-2 font-mont text-sm font-medium text-black-01",
                  filter === value && "bg-pry-01",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <CustomInput
            id="notifications-search"
            canSearch
            placeholder="Search this page"
            className="h-10"
            containerClass="w-full sm:max-w-[280px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Feed */}
        <section className="rounded-md bg-white">
          {isLoading ? (
            <div className="grid h-72 place-content-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="py-20 text-center">
              <p className="font-mont text-sm font-medium text-gray-05">
                Notifications couldn’t be loaded
              </p>
              <button onClick={refetch} className="mt-2 text-sm font-medium text-primary">
                Try again
              </button>
            </div>
          ) : !rows.length ? (
            <div className="py-20 text-center">
              <span className="mx-auto grid size-14 place-content-center rounded-full bg-pry-01 text-primary">
                <Bell className="size-6" />
              </span>
              <p className="mt-3 font-mont font-semibold">Nothing to show</p>
              <p className="text-sm text-gray-01">New activity will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-white-02">
              {rows.map((n) => (
                <button
                  key={n.id}
                  onClick={() => open(n)}
                  className={cn(
                    "flex w-full items-start gap-4 px-5 py-4 text-left hover:bg-gray-50",
                    !n.is_read && "bg-pry-01/30",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1 grid size-9 shrink-0 place-content-center rounded-full",
                      n.is_read ? "bg-gray-100 text-gray-500" : "bg-primary text-white",
                    )}
                  >
                    <NotificationEventIcon eventKey={n.event_type_key} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className={cn("truncate text-sm", !n.is_read && "font-semibold")}>
                        {n.subject}
                      </span>
                      <span className="shrink-0 text-xs text-gray-01">
                        {formatRelativeDate(n.created_at)}
                      </span>
                    </span>
                    <span className="mt-1 line-clamp-2 block text-xs leading-5 text-gray-01">{n.body}</span>
                    <span className="mt-1 block text-[11px] font-medium text-primary/80">{n.event_type_label}</span>
                  </span>
                  {!n.is_read && <span className="mt-3 size-2 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          )}

          {(data?.pagination.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between border-t border-white-02 px-5 py-3 text-sm">
              <span className="text-gray-01">
                Page {page} of {data?.pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="white" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button
                  variant="white"
                  size="sm"
                  disabled={page === data?.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </section>

      </main>
    </>
  );
}
