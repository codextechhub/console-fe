import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { INFORMATION_CARD_SURFACE } from "@/components/ui/card-surface";
import { LoadingMark } from "@/components/custom/loading-mark";

/** The placeholder a Settings panel shows while its data loads. */
export function Busy() {
  return (
    <div className={cn(INFORMATION_CARD_SURFACE, "grid h-48 place-content-center rounded-md")}>
      <LoadingMark className="size-10" />
    </div>
  );
}

/** The panel a Settings section shows when its data could not be read. */
export function SettingsLoadError({ retry }: { retry: () => void }) {
  return (
    <div className="grid min-h-48 place-content-center rounded-xl border border-white-02 bg-white p-6 text-center">
      <p className="font-mont text-sm font-semibold text-gray-01">Settings could not be loaded</p>
      <p className="mt-1 font-mont text-xs text-gray-05">Check your access or try the request again.</p>
      <Button className="mx-auto mt-4" variant="outline" size="sm" onClick={retry}>Try again</Button>
    </div>
  );
}
