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
] as const satisfies readonly Walkthrough[];

export function findWalkthrough(id: string): Walkthrough | undefined {
  return WALKTHROUGH_REGISTRY.find((walkthrough) => walkthrough.id === id);
}
