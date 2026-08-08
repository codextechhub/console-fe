import { CheckCircle2, Circle } from "lucide-react";
import { PASSWORD_RULES } from "@/lib/password-policy";
import { cn } from "@/lib/utils";

/**
 * Live password-policy checklist shown on every set/change-password screen.
 * Each rule ticks green as the typed password satisfies it. The rules come from
 * the shared policy (src/lib/password-policy.ts), which mirrors what the backend
 * enforces - so this is guidance, not a second, divergent policy.
 */
export function PasswordRequirements({
  password,
  className,
}: {
  password: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-xs text-gray-01">Your password must include:</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password);
          return (
            <li
              key={rule.label}
              className={cn(
                "flex items-center gap-1.5 text-xs",
                met ? "text-green-600" : "text-gray-400",
              )}
            >
              {met ? (
                <CheckCircle2 size={12} strokeWidth={2} />
              ) : (
                <Circle size={12} strokeWidth={1.5} />
              )}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
