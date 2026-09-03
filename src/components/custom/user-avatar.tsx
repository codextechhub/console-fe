/**
 * One photo-aware avatar for the whole app. Give it a user's id + display name;
 * it shows their profile photo when there is one (resolved by id from the shared
 * staff-photo map and fetched through the auth-gated media pipeline), otherwise
 * their initials. Built on the shadcn Avatar primitives so it matches every
 * plain <Avatar><AvatarFallback> initials block in the app.
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserPhoto } from "@/hooks/use-user-photo";
import { returnInitial } from "@/utils/helpers";
import { cn } from "@/lib/utils";

export function UserAvatar({
  userId,
  name,
  className,
  fallbackClassName,
}: {
  userId?: string | number | null;
  name?: string | null;
  className?: string;
  fallbackClassName?: string;
}) {
  const blobUrl = useUserPhoto(userId);
  return (
    // Thin light-blue outline so a white/light photo doesn't blend into the page.
    <Avatar className={cn("ring-1 ring-pry-01", className)}>
      {blobUrl && <AvatarImage src={blobUrl} alt={name ?? ""} className="object-cover" />}
      <AvatarFallback className={fallbackClassName}>{returnInitial(name ?? "")}</AvatarFallback>
    </Avatar>
  );
}
