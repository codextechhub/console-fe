import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      // not shadcn's bg-accent: at oklch(0.97) it vanishes on the app's
      // #F7F7F7 page background, so loading screens read as blank
      className={cn("bg-gray-200 animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
