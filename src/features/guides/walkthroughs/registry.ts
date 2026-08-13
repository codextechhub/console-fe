import { routesPath } from "@/routes/routes-path";
import { P } from "@/permissions";

import type { Walkthrough } from "./types";

const R = routesPath.PROTECTED;

export const WALKTHROUGH_REGISTRY = [
  {
    id: "walkthrough.getting-started.console-basics",
    guideId: "getting-started.console-basics",
    route: R.OVERVIEW.INDEX,
    permissions: [],
    prerequisites: ["Sign in to Console."],
    version: 1,
    steps: [
      {
        id: "welcome",
        title: "Welcome to Console",
        body: "This short tour shows where to start work, find an action, and get help. It never submits anything for you.",
        advance: "next",
      },
      {
        id: "quick-actions-branch",
        kind: "branch",
        target: "overview.quick-actions",
        whenPresent: "quick-actions",
        whenMissing: "workspace-search",
      },
      {
        id: "quick-actions",
        target: "overview.quick-actions",
        title: "Open frequent work quickly",
        body: "Quick actions are permission-aware and adapt to the work you open most. Select an action only when you are ready to leave this page.",
        placement: "top",
        advance: "manual",
      },
      {
        id: "workspace-search",
        target: "header.workspace-search",
        title: "Find pages, actions, people, and guides",
        body: "Workspace search uses task language. On a phone, this target opens the same search in a full-width panel.",
        placement: "bottom",
        advance: "manual",
      },
      {
        id: "page-help",
        target: "header.page-help",
        title: "Get help without losing your place",
        body: "Open page-matched guides, available walkthroughs, troubleshooting, or a support ticket from here.",
        placement: "bottom",
        advance: "manual",
      },
      {
        id: "complete",
        title: "You know the main paths",
        body: "You can now start from quick actions, search the whole workspace, and open help that understands your current screen.",
        advance: "next",
      },
    ],
  },
  {
    id: "walkthrough.schools.create-and-configure",
    guideId: "schools.create-and-configure",
    route: R.SCHOOL_MGT.CREATE,
    permissions: [P.ONBOARD_SCHOOL],
    prerequisites: [
      "Confirm the approved school, branch, administrator, and package details.",
      "Use working administrator email addresses that do not belong to existing accounts.",
    ],
    version: 1,
    steps: [
      {
        id: "welcome",
        title: "Plan the complete school setup",
        body: "This form creates the school, branches, administrators, package access, capacity limits, and invitations. This walkthrough explains the decisions but never fills a field or submits anything.",
        advance: "next",
      },
      {
        id: "school-details",
        target: "school-create.current-step",
        title: "Start with the school identity",
        body: "Enter the agreed name, stable slug, address, ownership type, term structure, and currency. Continue only after checking these values against the onboarding record.",
        placement: "top",
        advance: "manual",
      },
      {
        id: "branches-and-admins",
        target: "school-create.current-step",
        title: "Branches and administrators create invitations",
        body: "The next steps require at least one branch, exactly one main branch, valid branch-admin details, and a primary school administrator. Verify every email before continuing.",
        placement: "top",
        advance: "manual",
      },
      {
        id: "package-boundary",
        target: "school-create.current-step",
        title: "Package choices control access and limits",
        body: "On Package Setup, use only the approved plan, modules, capacities, and expiry. Console may add required module dependencies. Review earlier steps with Back before you submit.",
        placement: "top",
        advance: "manual",
      },
      {
        id: "complete",
        title: "You keep control of the final action",
        body: "The walkthrough stops here. Submit creates business records and sends administrator invitations, so select it yourself only after the complete setup is approved.",
        advance: "next",
      },
    ],
  },
  {
    id: "walkthrough.roles.create-and-assign",
    guideId: "roles.create-and-assign",
    route: R.ROLES.CREATE,
    permissions: [P.VIEW_ROLES, P.DEFINE_ROLE, P.ASSIGN_ROLE],
    prerequisites: [
      "Agree the role's job purpose and minimum required access.",
      "Review existing roles and permission groups before creating another role.",
    ],
    version: 1,
    steps: [
      {
        id: "welcome",
        title: "Build access from an approved job need",
        body: "This walkthrough explains how a role is composed and later assigned. It never selects permissions, creates the role, assigns access, changes a role, or revokes an assignment.",
        advance: "next",
      },
      {
        id: "basic-information",
        target: "role-create.basic-information",
        title: "Name the responsibility clearly",
        body: "Use a distinct role name, describe its intended job, and choose whether it should start Active. A clear purpose makes later reviews and revocations safer.",
        placement: "bottom",
        advance: "manual",
      },
      {
        id: "permission-groups",
        target: "role-create.permission-groups",
        title: "Groups grant their complete permission set",
        body: "Select a group only when every included permission fits the job. Reusing approved groups improves consistency, but it can also grant more than the role needs.",
        placement: "bottom",
        advance: "manual",
      },
      {
        id: "individual-permissions",
        target: "role-create.individual-permissions",
        title: "Add only the remaining individual access",
        body: "Search by key or description and select permissions that are required but not already represented by the chosen groups. Check dependencies before creation.",
        placement: "top",
        advance: "manual",
      },
      {
        id: "complete",
        title: "Review before two separate actions",
        body: "Creating the role does not assign it. Review the final permission set before Create Role, then separately verify the user and their existing roles before Assign Role.",
        advance: "next",
      },
    ],
  },
  {
    id: "walkthrough.roles.transfer-super-admin",
    guideId: "roles.review-changes-and-transfer-super-admin",
    route: R.ROLES.TRANSFER_SUPER_ADMIN,
    permissions: [P.TRANSFER_SUPER_ADMIN],
    prerequisites: [
      "Confirm the handover is authorized and the successor is an active CX staff member.",
      "Ensure the successor is ready to assume the platform's single highest-privilege role.",
    ],
    version: 1,
    steps: [
      {
        id: "welcome",
        title: "Protect the single Super Admin role",
        body: "This walkthrough explains the ownership handover. It never chooses a successor, types a confirmation email, transfers ownership, or bypasses the current-owner check.",
        advance: "next",
      },
      {
        id: "current-owner",
        target: "super-admin-transfer.current-owner",
        title: "Verify the current owner first",
        body: "The platform must have exactly one active Super Admin, and only that current owner can initiate a transfer. Stop and contact engineering if no active owner appears.",
        placement: "bottom",
        advance: "manual",
      },
      {
        id: "successor",
        target: "super-admin-transfer.successor",
        title: "Choose an eligible, prepared successor",
        body: "Only active CX staff appear. Confirm identity, readiness, and authorization before selecting anyone. The current owner is excluded from the list.",
        placement: "top",
        advance: "manual",
      },
      {
        id: "consequence",
        target: "super-admin-transfer.warning",
        title: "The access change is immediate",
        body: "The successor becomes the only Super Admin. The current owner becomes Platform Admin and immediately loses super-admin-only capabilities, including this transfer flow.",
        placement: "bottom",
        advance: "manual",
      },
      {
        id: "complete",
        title: "The final confirmation stays with you",
        body: "The walkthrough stops here. Compare From and To, type the successor's email exactly, and confirm only when the authorized handover is ready to take effect.",
        advance: "next",
      },
    ],
  },
  {
    id: "walkthrough.roles.maintain-permission-catalogue",
    guideId: "roles.maintain-permission-catalogue",
    route: R.PERMISSIONS.CREATE,
    permissions: [P.CREATE_PERMISSION],
    prerequisites: [
      "Confirm the backend already enforces the proposed permission key.",
      "Agree its module, resource, action, sensitivity, restrictions, and dependencies.",
    ],
    version: 1,
    steps: [
      {
        id: "welcome",
        title: "Treat the catalogue as a security contract",
        body: "This walkthrough explains permission composition and classification. It never chooses catalogue values, creates a key, changes dependencies, or edits a permission group.",
        advance: "next",
      },
      {
        id: "permission-key",
        target: "permission-create.key",
        title: "Compose the exact authorization key",
        body: "Select the approved module, one of its resources, and the action. Check the preview against the backend permission check and prevent duplicate keys.",
        placement: "bottom",
        advance: "manual",
      },
      {
        id: "classification",
        target: "permission-create.classification",
        title: "Classify the consequence",
        body: "Describe what the permission allows, choose Normal, Sensitive, or Critical, decide whether it is Restricted, and choose whether it starts Active.",
        placement: "top",
        advance: "manual",
      },
      {
        id: "backend-boundary",
        title: "Frontend visibility is not authorization",
        body: "Before creation, verify the backend rejects an unauthorized request and enforces tenant or entity scope. A key used only to hide a button does not secure the operation.",
        advance: "manual",
      },
      {
        id: "complete",
        title: "Creation remains a deliberate action",
        body: "The walkthrough stops before Create Permission. After creation, add required dependencies, review groups and roles, and test both permitted and denied requests.",
        advance: "next",
      },
    ],
  },
] as const satisfies readonly Walkthrough[];

export function findWalkthrough(id: string): Walkthrough | undefined {
  return WALKTHROUGH_REGISTRY.find((walkthrough) => walkthrough.id === id);
}
