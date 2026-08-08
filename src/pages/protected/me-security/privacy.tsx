import { Download, FileText, Clock, ArrowUpRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateAuditExportMutation } from "@/redux/services/dashboard/audit-api";
import { useAppSelector } from "@/redux/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function InfoCard({
  iconName: Icon,
  accentIcon,
  title,
  description,
  actionLabel,
  onAction,
  actionLoading,
  actionDisabled,
  children,
}: {
  iconName: React.ElementType;
  accentIcon?: boolean;
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
  actionLoading?: boolean;
  actionDisabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-03 rounded-lg p-[18px] space-y-3.5">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "size-11 rounded-[10px] shrink-0 grid place-items-center",
            accentIcon ? "bg-pry-01 text-primary" : "bg-gray-50 text-gray-01",
          )}
        >
          <Icon className="size-5" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-black-01">{title}</p>
          <p className="text-xs text-gray-01 font-mont mt-1 leading-relaxed">{description}</p>
        </div>
        <div className="shrink-0 pt-0.5">
          {accentIcon ? (
            <Button
              size="sm"
              onClick={onAction}
              loading={actionLoading}
              disabled={actionDisabled}
            >
              {actionLabel}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onAction} disabled={actionDisabled}>
              <ArrowUpRight className="size-3" />
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

const RETENTION_RULES = [
  { text: <>General audit events kept for <strong>2 years</strong>, then archived.</> },
  { text: <>Finance &amp; procurement events kept for <strong>7 years</strong> (regulatory).</> },
  { text: <>Sign-in attempts kept for <strong>1 year</strong>.</> },
];

export default function MyPrivacy() {
  const user = useAppSelector((s) => s.auth.user);
  const [createExport, { isLoading }] = useCreateAuditExportMutation();

  const handleExportMyActivity = () => {
    if (!user?.id) return;
    createExport({
      filter_payload: { actor_user_id: user.id },
      export_format: "CSV",
    })
      .unwrap()
      .then(() => {
        toast.success("Export queued. We'll email you when it's ready.");
      })
      .catch(() => {});
  };

  return (
    <>
      <main className="px-4.5 py-6 space-y-5 text-black-01 max-w-2xl">
        <div>
          <p className="font-semibold font-mont text-gray-01">Data & privacy</p>
          <p className="text-xs text-gray-01 mt-0.5">
            How Vision uses your information, and what you can do about it
          </p>
        </div>

        <div className="space-y-3">
          {/* ── Download a copy ── */}
          <InfoCard
            iconName={Download}
            accentIcon
            title="Download a copy of your data"
            description="Includes sign-in history, audit events on your account, and your profile data - packaged as a ZIP. Ready in about 5 minutes."
            actionLabel="Request export"
            onAction={handleExportMyActivity}
            actionLoading={isLoading}
            actionDisabled={!user?.id}
          />

          {/* ── What we log ── */}
          <InfoCard
            iconName={FileText}
            title="What we log and why"
            description="A plain-English summary of every category of data Vision records about your activity, the purpose, and the retention period."
            actionLabel="Read"
          />

          {/* ── Retention policy ── */}
          <InfoCard
            iconName={Clock}
            title="Retention policy"
            description="Driven by your school's active retention rules - see what's kept and for how long."
            actionLabel="View policy"
          >
            <div className="rounded-md bg-gray-50 px-4 py-3 space-y-2">
              <p className="text-[11px] font-semibold text-gray-01 font-mont uppercase tracking-wider">
                Active retention rules on your school
              </p>
              <div className="space-y-1.5">
                {RETENTION_RULES.map((rule, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="size-3 text-green-600 mt-0.5 shrink-0" strokeWidth={2.5} />
                    <p className="text-xs text-black-01 font-mont leading-relaxed">{rule.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </InfoCard>
        </div>
      </main>
    </>
  );
}
