import { type RouteObject } from "react-router";
import { routesPath } from "@/routes/routesPath";
import PendingApprovals from "@/pages/protected/workflow/approvals";
import ApprovalDetail from "@/pages/protected/workflow/approvals/approval-detail";
import MySubmissions from "@/pages/protected/workflow/my-submissions";
import SubmissionDetail from "@/pages/protected/workflow/my-submissions/submission-detail";
import AllInstances from "@/pages/protected/workflow/instances";
import InstanceDetail from "@/pages/protected/workflow/instances/instance-detail";
import TeamLoad from "@/pages/protected/workflow/instances/team-load";
import Delegations from "@/pages/protected/workflow/delegations";
import WorkflowTemplates from "@/pages/protected/workflow/templates";
import TemplateDetail from "@/pages/protected/workflow/templates/template-detail";
import TemplateBuilder from "@/pages/protected/workflow/templates/template-builder";

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
