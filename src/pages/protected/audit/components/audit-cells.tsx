import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { returnInitial } from "@/utils/helpers";
import { useUserPhoto } from "@/hooks/use-user-photo";

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return returnInitial(name) || name.slice(0, 2).toUpperCase();
}

function initialsFromEmail(email: string | null | undefined): string {
  if (!email) return "?";
  const local = email.split("@")[0];
  const parts = local.split(/[._-]/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : local.slice(0, 2).toUpperCase();
}

interface ActorCellProps {
  /** Preferred display label shown in the tooltip */
  label: string;
  /** Used to derive initials when label is email-shaped; omit if label is a full name */
  email?: string | null;
  /** Actor's user id - resolves their profile photo when present. */
  userId?: string | number | null;
}

/**
 * Circular avatar - the actor's photo when there is one, otherwise initials.
 * Tooltip shows the full label. Used for actor / user / requested-by columns
 * across audit tables.
 */
export function ActorCell({ label, email, userId }: ActorCellProps) {
  const blobUrl = useUserPhoto(userId);
  const abbr =
    label === "System"
      ? "SY"
      : email && label === email
        ? initialsFromEmail(email)
        : initials(label);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Avatar className="size-7 cursor-default">
            {blobUrl && <AvatarImage src={blobUrl} alt={label} className="object-cover" />}
            <AvatarFallback className="text-[10px] font-semibold bg-blue-100 text-blue-700">
              {abbr}
            </AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface EntityCellProps {
  label: string;
  type: string;
}

/**
 * Stacked entity display: label on top (text-xs), type below (text-[10px] gray).
 */
export function EntityCell({ label, type }: EntityCellProps) {
  return (
    <div className="flex flex-col leading-snug">
      <span className="text-xs text-black-01">{label || "-"}</span>
      <span className="text-[10px] text-gray-01">{type}</span>
    </div>
  );
}
