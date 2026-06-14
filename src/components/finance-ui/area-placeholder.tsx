// Route-shell placeholder for a console area whose screens land in a later
// build slice. Renders in the house page structure so the navigation, layout
// and entity scoping are real and reviewable now; the data screens replace this
// body as each slice ships.

import { Hammer } from "lucide-react";
import { useActiveEntity } from "./use-entity";

export function AreaPlaceholder({
  title,
  description,
  slice,
}: {
  title: string;
  description?: string;
  /** Which build slice delivers this area's screens. */
  slice?: string;
}) {
  const { entity, code } = useActiveEntity();

  return (
    <main className="min-w-0 space-y-5 px-4.5 py-6 text-black-01">
      <div>
        <h1 className="font-mont text-lg font-semibold text-gray-01">{title}</h1>
        {description && <p className="mt-0.5 max-w-2xl font-mont text-xs text-gray-05">{description}</p>}
      </div>

      <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-gray-03 bg-white px-6 py-16 text-center">
        <Hammer className="mb-3 size-7 text-gray-03" />
        <p className="font-mont text-sm font-semibold text-gray-01">Screens for this area are on the way</p>
        <p className="mt-1 max-w-md font-mont text-xs text-gray-05">
          The navigation, layout, entity scoping and permission gating are live.
          {slice ? ` Data screens ship in ${slice}.` : ""}
        </p>
        {code ? (
          <p className="mt-4 font-mont text-xs text-gray-05">
            Active entity:{" "}
            <span className="font-semibold text-black-01">{entity ? `${entity.code} — ${entity.name}` : code}</span>
          </p>
        ) : (
          <p className="mt-4 font-mont text-xs text-gray-05">Select an entity to begin.</p>
        )}
      </div>
    </main>
  );
}
