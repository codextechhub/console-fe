import { lazy } from "react";
import { type RouteObject } from "react-router";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/index.tsx.
const AuditDashboard = lazy(() => import("@/pages/protected/audit/dashboard"));
const AuditEventsExplorer = lazy(() => import("@/pages/protected/audit/events"));
const EntityTrailsList = lazy(() => import("@/pages/protected/audit/entity-trails"));
const EntityTrailDetail = lazy(() => import("@/pages/protected/audit/entity-trail-detail"));
const LiveSessions = lazy(() => import("@/pages/protected/audit/sessions"));
const LoginAttempts = lazy(() => import("@/pages/protected/audit/login-attempts"));
const AccountLockouts = lazy(() => import("@/pages/protected/audit/lockouts"));
const PasswordActivity = lazy(() => import("@/pages/protected/audit/password-activity"));
const Impersonations = lazy(() => import("@/pages/protected/audit/impersonations"));
const AuditExports = lazy(() => import("@/pages/protected/audit/exports"));
const NewAuditExport = lazy(() => import("@/pages/protected/audit/export-new"));
const ComplianceRules = lazy(() => import("@/pages/protected/audit/compliance-rules"));
const ComplianceRuleForm = lazy(() => import("@/pages/protected/audit/compliance-rule-form"));

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
