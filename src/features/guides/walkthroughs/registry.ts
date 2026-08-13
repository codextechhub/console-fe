import { routesPath } from "@/routes/routes-path";

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
] as const satisfies readonly Walkthrough[];

export function findWalkthrough(id: string): Walkthrough | undefined {
  return WALKTHROUGH_REGISTRY.find((walkthrough) => walkthrough.id === id);
}
