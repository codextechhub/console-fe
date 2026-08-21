// Notification administration - the platform-side surfaces split out of the
// personal inbox: delivery history, the effective settings matrix, template
// editing and the event-type catalogue. Gated on any communication.* key;
// each tab additionally requires its own key.

import { useSearchParams } from "react-router";
import PageAccessDenied from "@/components/custom/page-access-denied";
import Tabs from "@/components/custom/tab";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { EventsPanel, HistoryPanel, SettingsPanel, TemplatesPanel } from "./admin-panels";

type Panel = "history" | "settings" | "templates" | "events";

const PANEL_LABELS: Record<Panel, string> = {
  history: "Delivery History",
  settings: "Settings",
  templates: "Templates",
  events: "Event Types",
};

export default function NotificationsAdmin() {
  const { hasPermission, hasAnyPermission } = usePermissions();
  const [searchParams] = useSearchParams();

  const panels: Panel[] = [];
  if (hasPermission(P.AUDIT_NOTIFICATION_ACTIVITY)) panels.push("history");
  if (hasPermission(P.ENFORCE_NOTIFICATION_SETTINGS)) panels.push("settings");
  if (hasPermission(P.CONFIGURE_NOTIFICATION_TEMPLATES)) panels.push("templates");

  if (
    !hasAnyPermission(
      P.AUDIT_NOTIFICATION_ACTIVITY,
      P.ENFORCE_NOTIFICATION_SETTINGS,
      P.CONFIGURE_NOTIFICATION_TEMPLATES,
    )
  ) {
    return <PageAccessDenied />;
  }
  // The catalogue is reference material for whoever administers the above.
  panels.push("events");

  // A pasted ?panel= the user can't read falls back to their first tab.
  const requested = searchParams.get("panel") as Panel | null;
  const panel = requested && panels.includes(requested) ? requested : panels[0];

  return (
    <>
      <main className="min-w-0 px-4.5 py-6 space-y-5 text-black-01">
        <div data-guide="notifications-admin.heading">
          <p className="font-semibold font-mont text-gray-01">Notification Administration</p>
          <p className="text-xs text-gray-01 mt-0.5">
            Delivery history, channel settings, templates and the event catalogue.
          </p>
        </div>

        <div data-guide="notifications-admin.tabs">
          <Tabs tabKey="panel" tabs={panels.map((p) => ({ label: PANEL_LABELS[p], value: p }))} />
        </div>

        {panel === "history" && <HistoryPanel />}
        {panel === "settings" && <SettingsPanel />}
        {panel === "templates" && <TemplatesPanel />}
        {panel === "events" && <EventsPanel />}
      </main>
    </>
  );
}
