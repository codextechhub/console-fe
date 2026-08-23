import { Bell, BellOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

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
    <div className="rounded-md bg-white p-5">
      <h2 className="font-semibold">Notifications</h2>
      <p className="mt-1 text-xs leading-5 text-gray-01">
        Commenting follows this ticket automatically. Followers receive new comments and status updates.
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3 w-full justify-center"
        aria-pressed={following}
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
        {following ? "Stop notifications" : "Follow ticket"}
      </Button>
    </div>
  );
}
