import {
  Bell,
  CircleDollarSign,
  ClipboardCheck,
  DatabaseZap,
  FileOutput,
  Headset,
  KeyRound,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export function NotificationEventIcon({ eventKey, className = "size-4" }: { eventKey: string; className?: string }) {
  if (eventKey.startsWith("ticket.")) return <Headset className={className} />;
  if (eventKey.startsWith("workflow.")) return <ClipboardCheck className={className} />;
  if (eventKey.startsWith("import.")) return <DatabaseZap className={className} />;
  if (eventKey.startsWith("export.")) return <FileOutput className={className} />;
  if (["finance.", "payments.", "procurement."].some((prefix) => eventKey.startsWith(prefix))) return <CircleDollarSign className={className} />;
  if (eventKey.startsWith("security.")) return <ShieldCheck className={className} />;
  if (eventKey.startsWith("user.password")) return <KeyRound className={className} />;
  if (["user.", "team."].some((prefix) => eventKey.startsWith(prefix))) return <UserRound className={className} />;
  return <Bell className={className} />;
}
