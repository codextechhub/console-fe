import { Download, FileText, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { useCreateAuditExportMutation } from "@/redux/services/dashboard/audit-api";
import { useAppSelector } from "@/redux/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/layout/page-shell";

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
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
  actionDisabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-03 rounded-lg p-[18px] space-y-3.5">
      <div className="flex flex-col items-start gap-3 sm:flex-row">
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
        {actionLabel && (
          <div className="shrink-0 pt-0.5">
            <Button
              size="sm"
              onClick={onAction}
              loading={actionLoading}
              disabled={actionDisabled}
              variant={accentIcon ? "default" : "outline"}
            >
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

const DATA_CATEGORIES = [
  "Profile and employment details needed to operate your account and staff record.",
  "Sign-in, session, and password events used to protect access.",
  "Audit events used to explain actions, investigate problems, and meet obligations.",
];

export default function MyPrivacy() {
  const user = useAppSelector((s) => s.auth.user);
  const { hasPermission } = usePermissions();
  const canExportActivity = hasPermission(P.EXPORT_AUDIT);
  const [createExport, { isLoading }] = useCreateAuditExportMutation();

  const handleExportMyActivity = () => {
    if (!user?.id) return;
    createExport({
      filter_payload: { actor_user_id: user.id },
      export_format: "CSV",
    })
      .unwrap()
      .then(() => {
        toast.success("Activity CSV created. Open Audit Exports to download it.");
      })
      .catch(() => {});
  };

  return (
    <>
      <PageShell className="space-y-5 text-black-01 max-w-2xl">
        <div>
          <p className="font-semibold font-mont text-gray-01">Data & privacy</p>
          <p className="text-xs text-gray-01 mt-0.5">
            How Console uses your information, and what you can do about it
          </p>
        </div>

        <div className="space-y-3">
          {/* ── Download a copy ── */}
          <InfoCard
            iconName={Download}
            accentIcon
            title="Export your account activity"
            description={canExportActivity
              ? "Creates a CSV of audit events where you are the actor. It follows the same tenant scope and masking rules as Audit Exports."
              : "Activity CSVs require audit-export access. Contact Support or your privacy owner for an approved personal-data request."}
            actionLabel={canExportActivity ? "Request activity CSV" : "Export access required"}
            onAction={handleExportMyActivity}
            actionLoading={isLoading}
            actionDisabled={!user?.id || !canExportActivity}
          />

          {/* ── What we log ── */}
          <InfoCard
            iconName={FileText}
            title="What Console records"
            description="These categories support your account, security, investigations, and the organisation's approved operations."
          >
            <div className="rounded-md bg-gray-50 px-4 py-3 space-y-2">
              {DATA_CATEGORIES.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Check className="size-3 text-green-600 mt-0.5 shrink-0" strokeWidth={2.5} />
                  <p className="text-xs text-black-01 font-mont leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </InfoCard>

          {/* ── Retention policy ── */}
          <InfoCard
            iconName={Clock}
            title="Retention and access requests"
            description="Retention varies by tenant, record type, legal obligation, and active policy. Support or your privacy owner can confirm the rule for a specific record."
          >
            <div className="rounded-md bg-gray-50 px-4 py-3 space-y-2">
              <p className="text-[11px] font-semibold text-gray-01 font-mont uppercase tracking-wider">
                Before making a request
              </p>
              <p className="text-xs text-black-01 font-mont leading-relaxed">
                State the record type, purpose, relevant dates, and the account or school involved. Never include passwords, reset links, or full bank details.
              </p>
            </div>
          </InfoCard>
        </div>
      </PageShell>
    </>
  );
}
