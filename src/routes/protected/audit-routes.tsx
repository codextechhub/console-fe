import { lazy } from "react";
import { type RouteObject } from "react-router";
import type { DashboardHandle } from "@/components/layout/dashboard-header";

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
  { path: "/audit", element: <AuditDashboard />, handle: { title: "Security Dashboard" } satisfies DashboardHandle },
  { path: "/audit/events", element: <AuditEventsExplorer />, handle: { title: "Audit Events" } satisfies DashboardHandle },
  { path: "/audit/entity-trails", element: <EntityTrailsList />, handle: { title: "Entity Trails" } satisfies DashboardHandle },
  { path: "/audit/entity-trails/:entity_type/:entity_id", element: <EntityTrailDetail />, handle: { title: "Entity Trails", back: true } satisfies DashboardHandle },
  { path: "/audit/sessions", element: <LiveSessions />, handle: { title: "Live Sessions" } satisfies DashboardHandle },
  { path: "/audit/login-attempts", element: <LoginAttempts />, handle: { title: "Login Attempts" } satisfies DashboardHandle },
  { path: "/audit/lockouts", element: <AccountLockouts />, handle: { title: "Account Lockouts" } satisfies DashboardHandle },
  { path: "/audit/password-activity", element: <PasswordActivity />, handle: { title: "Password Activity" } satisfies DashboardHandle },
  { path: "/audit/impersonations", element: <Impersonations />, handle: { title: "Proxy Sessions" } satisfies DashboardHandle },
  { path: "/audit/exports", element: <AuditExports />, handle: { title: "Audit Exports" } satisfies DashboardHandle },
  { path: "/audit/exports/new", element: <NewAuditExport />, handle: { title: "New Audit Export", back: true } satisfies DashboardHandle },
  { path: "/audit/compliance-rules", element: <ComplianceRules />, handle: { title: "Compliance Rules" } satisfies DashboardHandle },
  { path: "/audit/compliance-rules/create", element: <ComplianceRuleForm />, handle: { title: "New Compliance Rule", back: true } satisfies DashboardHandle },
  { path: "/audit/compliance-rules/:id/edit", element: <ComplianceRuleForm />, handle: { title: "Edit Compliance Rule", back: true } satisfies DashboardHandle },
];
