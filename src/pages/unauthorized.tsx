import { Button } from "@/components/ui/button";
import { routesPath } from "@/routes/routesPath";
import { ShieldX } from "lucide-react";
import { useNavigate } from "react-router";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-03 grid place-content-center text-center px-4">
      <div className="space-y-5 max-w-sm mx-auto">
        <div className="size-16 rounded-full bg-destructive/10 grid place-content-center mx-auto">
          <ShieldX className="size-8 text-destructive" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold text-black-01">Access Denied</h1>
          <p className="text-sm text-gray-01 font-mont">
            You don't have permission to view this page. Contact your administrator if you think this is a mistake.
          </p>
        </div>
        <Button onClick={() => navigate(routesPath.PROTECTED.OVERVIEW.INDEX, { replace: true })}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
