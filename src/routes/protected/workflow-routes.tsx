import { lazy } from "react";
import { type RouteObject } from "react-router";
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
  { path: W.APPROVALS, element: <PendingApprovals /> },
  { path: W.APPROVAL_DETAIL_PATH, element: <ApprovalDetail /> },
  { path: W.MY_SUBMISSIONS, element: <MySubmissions /> },
  { path: W.SUBMISSION_DETAIL_PATH, element: <SubmissionDetail /> },
  { path: W.INSTANCES, element: <AllInstances /> },
  { path: W.INSTANCE_DETAIL_PATH, element: <InstanceDetail /> },
  { path: W.TEAM_LOAD, element: <TeamLoad /> },
  { path: W.DELEGATIONS, element: <Delegations /> },
  { path: W.TEMPLATES, element: <WorkflowTemplates /> },
  { path: W.TEMPLATE_NEW, element: <TemplateBuilder /> },
  { path: W.TEMPLATE_DETAIL_PATH, element: <TemplateDetail /> },
  { path: W.TEMPLATE_EDIT_PATH, element: <TemplateBuilder /> },
];
