import { Bell, BellOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Mute or unmute a ticket's notifications.
 *
 * Muting is not leaving: the ticket stays open to the reader and they can
 * still reply, it just stops notifying them. The button is pressed while the
 * ticket is muted. The school app uses the same words for the same control.
 */
export function FollowTicketControl({
  following,
  busy,
  onChange,
}: {
  following: boolean;
  busy: boolean;
  onChange: (following: boolean) => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 shrink-0 gap-1.5 px-2.5 text-xs"
      aria-pressed={!following}
      data-guide="ticket-follow-toggle"
      disabled={busy}
      onClick={() => onChange(!following)}
    >
      {busy ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : following ? (
        <BellOff className="size-3.5" />
      ) : (
        <Bell className="size-3.5" />
      )}
      {following ? "Mute" : "Unmute"}
    </Button>
  );
}
