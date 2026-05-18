import { type RouteObject } from "react-router";
import AuditDashboard from "@/pages/protected/audit/dashboard";
import AuditEventsExplorer from "@/pages/protected/audit/events";
import EntityTrailsList from "@/pages/protected/audit/entity-trails";
import EntityTrailDetail from "@/pages/protected/audit/entity-trail-detail";
import LiveSessions from "@/pages/protected/audit/sessions";
import LoginAttempts from "@/pages/protected/audit/login-attempts";
import AccountLockouts from "@/pages/protected/audit/lockouts";
import PasswordActivity from "@/pages/protected/audit/password-activity";
import Impersonations from "@/pages/protected/audit/impersonations";
import AuditExports from "@/pages/protected/audit/exports";
import NewAuditExport from "@/pages/protected/audit/export-new";
import ComplianceRules from "@/pages/protected/audit/compliance-rules";
import ComplianceRuleForm from "@/pages/protected/audit/compliance-rule-form";

export const auditRoutes: RouteObject[] = [
  { path: "/audit", element: <AuditDashboard /> },
  { path: "/audit/events", element: <AuditEventsExplorer /> },
  { path: "/audit/entity-trails", element: <EntityTrailsList /> },
  { path: "/audit/entity-trails/:entity_type/:entity_id", element: <EntityTrailDetail /> },
  { path: "/audit/sessions", element: <LiveSessions /> },
  { path: "/audit/login-attempts", element: <LoginAttempts /> },
  { path: "/audit/lockouts", element: <AccountLockouts /> },
  { path: "/audit/password-activity", element: <PasswordActivity /> },
  { path: "/audit/impersonations", element: <Impersonations /> },
  { path: "/audit/exports", element: <AuditExports /> },
  { path: "/audit/exports/new", element: <NewAuditExport /> },
  { path: "/audit/compliance-rules", element: <ComplianceRules /> },
  { path: "/audit/compliance-rules/create", element: <ComplianceRuleForm /> },
  { path: "/audit/compliance-rules/:id/edit", element: <ComplianceRuleForm /> },
];
