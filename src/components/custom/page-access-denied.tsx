import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/dashboard-layout";

interface Props {
  layoutTitle: string;
  message?: string;
  hasBack?: boolean;
  onBack?: () => void;
}

export default function PageAccessDenied({
  layoutTitle,
  message = "You don't have permission to view this page. Contact your administrator if you think this is a mistake.",
  hasBack,
  onBack,
}: Props) {
  return (
    <DashboardLayout title={layoutTitle} hasBack={hasBack} onBack={onBack}>
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
        <div className="rounded-full bg-gray-100 p-4">
          <ShieldOff className="size-8 text-gray-400" />
        </div>
        <div className="space-y-1.5">
          <p className="text-base font-semibold font-mont text-black-01">Access Denied</p>
          <p className="text-sm text-gray-01 max-w-xs mx-auto">{message}</p>
        </div>
        {hasBack && onBack && (
          <Button variant="white" size="sm" onClick={onBack}>
            Go Back
          </Button>
        )}
      </div>
    </DashboardLayout>
  );
}
