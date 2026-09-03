/**
 * A school's logo, with its initials behind it.
 *
 * One component for the two places the console shows a school as itself - the
 * school list and the school detail header - so the fallback is decided once.
 *
 * The image is fetched from the PUBLIC brand route rather than /media/. That is
 * not laziness: core.media.authorize compares the file's tenant to the caller's
 * before any per-model policy runs, so a CodeX operator reading Holy Cross's
 * logo is refused by a boundary worth keeping. The public route serves the same
 * bytes that a school's own sign-in page paints for anyone who opens it.
 *
 * onError matters as much as the empty case. A URL that is present but does not
 * load - a logo deleted between the list being served and the row being drawn -
 * would otherwise render as a browser's broken-image glyph, which reads as a
 * bug in the console rather than as a school without a logo.
 */

import { useState } from "react";
import { returnInitial } from "@/utils/helpers";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  /** Absolute public brand URL, or "" when the school has no logo. */
  logo?: string | null;
  /** Sizing and shape; the caller owns both. */
  className?: string;
  /** Initials sizing, which does not follow the box size on its own. */
  textClassName?: string;
}

export function SchoolMark({ name, logo, className, textClassName }: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(logo) && !failed;

  return (
    <div
      className={cn(
        "grid shrink-0 place-content-center overflow-hidden rounded-full",
        "border border-primary/15 bg-pry-01",
        className,
      )}
    >
      {showImage ? (
        <img
          src={logo as string}
          alt=""
          // Decorative: the school's name is always beside it, and a screen
          // reader announcing "Holy Cross College logo, Holy Cross College" is
          // worse than announcing the name once.
          aria-hidden="true"
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={cn("font-bold text-primary", textClassName)}>
          {returnInitial(name || "")}
        </span>
      )}
    </div>
  );
}
