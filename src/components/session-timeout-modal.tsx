import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function SessionTimeoutModal({
  open,
  secondsLeft,
  onContinue,
  onLogout,
}: {
  open: boolean;
  secondsLeft: number;
  onContinue: () => void;
  onLogout: () => void;
}) {
  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-xl">Still there?</DialogTitle>
          <DialogDescription className="text-center text-sm font-medium text-gray-01 font-mont">
            You've been inactive for a while. For your security, you'll be
            logged out automatically in
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-1 py-2">
          <span className="text-5xl font-semibold text-black-01 font-mono tracking-widest tabular-nums">
            {formatTime(secondsLeft)}
          </span>
          <span className="text-xs text-gray-01 font-mont">minutes remaining</span>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full h-11" onClick={onContinue}>
            Continue Session
          </Button>
          <Button
            variant="outline"
            className="w-full h-11"
            onClick={onLogout}
          >
            Log Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
