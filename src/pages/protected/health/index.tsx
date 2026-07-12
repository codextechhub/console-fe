// Health module entry — one lazy chunk for all seven screens, dispatched by
// pathname (the sidebar children link straight to each sub-route).

import { useLocation } from "react-router";
import { routesPath } from "@/routes/routes-path";
import ApiPage from "./api-endpoints";
import CommandCenter from "./command-center";
import IncidentsPage from "./incidents";
import JobsPage from "./jobs";
import SlosPage from "./slos";
import TenantsPage from "./tenants";
import UptimePage from "./uptime";

const H = routesPath.PROTECTED.HEALTH;

export default function HealthPage() {
  const { pathname } = useLocation();
  if (pathname === H.UPTIME) return <UptimePage />;
  if (pathname === H.API) return <ApiPage />;
  if (pathname === H.JOBS) return <JobsPage />;
  if (pathname === H.INCIDENTS) return <IncidentsPage />;
  if (pathname === H.TENANTS) return <TenantsPage />;
  if (pathname === H.SLOS) return <SlosPage />;
  return <CommandCenter />;
}
