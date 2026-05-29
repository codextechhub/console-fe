import { useNavigate } from "react-router";
import { CheckCheck, ChevronRight, ClipboardCheck, CornerUpLeft, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { formatRelativeDate } from "@/utils/helpers";
import { useNotifications, type NotificationType } from "@/hooks/use-notifications";

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  approval: <ClipboardCheck className="size-4" />,
  returned: <CornerUpLeft className="size-4" />,
};

export default function Notifications() {
  const navigate = useNavigate();
  const { groups, items, count, isLoading } = useNotifications();

  return (
    <DashboardLayout title="Notifications">
      <main className="px-4.5 py-6 space-y-5 text-black-01 max-w-3xl">
        <div>
          <p className="font-semibold font-mont text-gray-01">Notifications</p>
          <p className="text-xs text-gray-01 mt-0.5">
            {count > 0
              ? `You have ${count} notification${count === 1 ? "" : "s"} across ${groups.length} module${groups.length === 1 ? "" : "s"}.`
              : "Everything that needs your attention shows up here."}
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-lg border border-white-02 bg-white py-16 text-center">
            <span className="mx-auto grid size-14 place-content-center rounded-full bg-green-01/10 text-green-01">
              <CheckCheck className="size-7" />
            </span>
            <p className="mt-3 text-base font-semibold">You're all caught up</p>
            <p className="text-sm text-gray-01">No notifications right now.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map((g) => {
              const groupItems = items.filter((i) => i.type === g.type);
              return (
                <section key={g.key} className="rounded-lg border border-white-02 bg-white">
                  <div className="flex items-center gap-3 border-b border-white-02 px-5 py-3.5">
                    <span className="grid size-8 place-content-center rounded-full bg-pry-01 text-primary">
                      {TYPE_ICON[g.type]}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{g.title}</p>
                      <p className="text-xs text-gray-01">{g.description}</p>
                    </div>
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                      {g.count}
                    </span>
                  </div>
                  <ul className="divide-y divide-white-02">
                    {groupItems.map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => navigate(n.href)}
                          className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-gray-50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-black-01">{n.title}</p>
                            <p className="truncate text-xs text-gray-01">{n.description}</p>
                            {n.time && (
                              <p className="text-[11px] text-gray-05">{formatRelativeDate(n.time)}</p>
                            )}
                          </div>
                          <ChevronRight className="size-4 shrink-0 text-gray-01" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
