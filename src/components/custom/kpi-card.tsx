import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: number | string;
  foot?: string;
  tone?: "default" | "alert" | "warn" | "live";
}

export default function KpiCard({ label, value, foot, tone = "default" }: KpiCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-md px-5.5 py-5 min-h-26 space-y-2.5 border border-transparent",
        tone === "alert" && "bg-red-50 border-red-200",
        tone === "warn" && "bg-amber-50 border-amber-200",
      )}
    >
      <h5 className="font-mont text-sm font-medium text-gray-01">{label}</h5>
      <div className="flex items-center gap-2">
        {tone === "live" && (
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
        )}
        <p
          className={cn(
            "font-semibold text-2xl text-[#221122]",
            tone === "alert" && "text-red-700",
            tone === "warn" && "text-amber-700",
          )}
        >
          {value}
        </p>
      </div>
      {foot && <p className="text-xs text-gray-01">{foot}</p>}
    </div>
  );
}
