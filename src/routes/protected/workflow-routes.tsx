import { lazy } from "react";
import { type RouteObject } from "react-router";
import type { DashboardHandle } from "@/components/layout/dashboard-header";
import { routesPath } from "@/routes/routes-path";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/index.tsx.
const PendingApprovals = lazy(() => import("@/pages/protected/workflow/approvals"));
const ApprovalDetail = lazy(() => import("@/pages/protected/workflow/approvals/approval-detail"));
const MySubmissions = lazy(() => import("@/pages/protected/workflow/my-submissions"));
const SubmissionDetail = lazy(() => import("@/pages/protected/workflow/my-submissions/submission-detail"));
const AllInstances = lazy(() => import("@/pages/protected/workflow/instances"));
const InstanceDetail = lazy(() => import("@/pages/protected/workflow/instances/instance-detail"));
const TeamLoad = lazy(() => import("@/pages/protected/workflow/instances/team-load"));
const Delegations = lazy(() => import("@/pages/protected/workflow/delegations"));
const WorkflowTemplates = lazy(() => import("@/pages/protected/workflow/templates"));
const TemplateDetail = lazy(() => import("@/pages/protected/workflow/templates/template-detail"));
const TemplateBuilder = lazy(() => import("@/pages/protected/workflow/templates/template-builder"));

const W = routesPath.PROTECTED.WORKFLOW;

export const workflowRoutes: RouteObject[] = [
  { path: W.APPROVALS, element: <PendingApprovals />, handle: { title: "Approvals" } satisfies DashboardHandle },
  { path: W.APPROVAL_DETAIL_PATH, element: <ApprovalDetail />, handle: { title: "Approval", back: true } satisfies DashboardHandle },
  { path: W.MY_SUBMISSIONS, element: <MySubmissions />, handle: { title: "My Submissions" } satisfies DashboardHandle },
  { path: W.SUBMISSION_DETAIL_PATH, element: <SubmissionDetail />, handle: { title: "Submission", back: true } satisfies DashboardHandle },
  { path: W.INSTANCES, element: <AllInstances />, handle: { title: "All Instances" } satisfies DashboardHandle },
  { path: W.INSTANCE_DETAIL_PATH, element: <InstanceDetail />, handle: { title: "Instance", back: true } satisfies DashboardHandle },
  { path: W.TEAM_LOAD, element: <TeamLoad />, handle: { title: "Team Load" } satisfies DashboardHandle },
  { path: W.DELEGATIONS, element: <Delegations />, handle: { title: "Delegations" } satisfies DashboardHandle },
  { path: W.TEMPLATES, element: <WorkflowTemplates />, handle: { title: "Templates" } satisfies DashboardHandle },
  { path: W.TEMPLATE_NEW, element: <TemplateBuilder />, handle: { title: "New Template", back: true } satisfies DashboardHandle },
  { path: W.TEMPLATE_DETAIL_PATH, element: <TemplateDetail />, handle: { title: "Template", back: true } satisfies DashboardHandle },
  { path: W.TEMPLATE_EDIT_PATH, element: <TemplateBuilder />, handle: { title: "Edit Template", back: true } satisfies DashboardHandle },
];
