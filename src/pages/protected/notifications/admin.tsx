// Notification administration — the platform-side surfaces split out of the
// personal inbox: delivery history, the effective settings matrix, template
// editing and the event-type catalogue. Gated on any communication.* key;
// each tab additionally requires its own key.

import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import PageAccessDenied from "@/components/custom/page-access-denied";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { EventsPanel, HistoryPanel, SettingsPanel, TemplatesPanel } from "./admin-panels";

type Panel = "history" | "settings" | "templates" | "events";

const PANEL_LABELS: Record<Panel, string> = {
  history: "Delivery history",
  settings: "Settings",
  templates: "Templates",
  events: "Event types",
};

export default function NotificationsAdmin() {
  const { hasPermission, hasAnyPermission } = usePermissions();

  const panels: Panel[] = [];
  if (hasPermission(P.AUDIT_NOTIFICATION_ACTIVITY)) panels.push("history");
  if (hasPermission(P.ENFORCE_NOTIFICATION_SETTINGS)) panels.push("settings");
  if (hasPermission(P.CONFIGURE_NOTIFICATION_TEMPLATES)) panels.push("templates");
  const [panel, setPanel] = useState<Panel | undefined>(panels[0]);

  if (
    !hasAnyPermission(
      P.AUDIT_NOTIFICATION_ACTIVITY,
      P.ENFORCE_NOTIFICATION_SETTINGS,
      P.CONFIGURE_NOTIFICATION_TEMPLATES,
    )
  ) {
    return <PageAccessDenied layoutTitle="Notifications" />;
  }
  // The catalogue is reference material for whoever administers the above.
  if (!panels.includes("events")) panels.push("events");

  return (
    <DashboardLayout title="Notifications">
      <main className="px-4.5 py-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Notification administration</h1>
            <p className="mt-1 text-sm text-gray-01">
              Delivery history, channel settings, templates and the event catalogue.
            </p>
          </div>

          <section className="overflow-hidden rounded-xl border border-white-02 bg-white shadow-sm">
            <div className="flex overflow-x-auto border-b px-3">
              {panels.map((p) => (
                <button
                  key={p}
                  onClick={() => setPanel(p)}
                  className={cn(
                    "whitespace-nowrap border-b-2 px-4 py-3 text-sm",
                    panel === p
                      ? "border-primary font-semibold text-primary"
                      : "border-transparent text-gray-01",
                  )}
                >
                  {PANEL_LABELS[p]}
                </button>
              ))}
            </div>
            {panel === "history" && <HistoryPanel />}
            {panel === "settings" && <SettingsPanel />}
            {panel === "templates" && <TemplatesPanel />}
            {panel === "events" && <EventsPanel />}
          </section>
        </div>
      </main>
    </DashboardLayout>
  );
}
