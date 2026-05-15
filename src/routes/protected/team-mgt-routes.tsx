import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import TeamManagement from "@/pages/protected/team-mgt";
import CreateAdmin from "@/pages/protected/team-mgt/create-admin";
import EditAdmin from "@/pages/protected/team-mgt/edit-admin";
import ViewAdmin from "@/pages/protected/team-mgt/view-admin";
import RequirePermission from "@/middleware/require-permission";
import { P } from "@/permissions";

export const teamMgtRoutes: RouteObject[] = [
  {
    element: <RequirePermission permission={P.ACCESS_TEAM_PANEL} />,
    children: [
      { path: routesPath.PROTECTED.TEAM_MGT.INDEX, Component: TeamManagement },
      { path: routesPath.PROTECTED.TEAM_MGT.VIEW_PATH, Component: ViewAdmin },
    ],
  },
  {
    element: <RequirePermission permission={[P.ACCESS_TEAM_PANEL, P.INVITE_TEAM_MEMBER]} mode="all" />,
    children: [
      { path: routesPath.PROTECTED.TEAM_MGT.CREATE, Component: CreateAdmin },
    ],
  },
  {
    element: <RequirePermission permission={[P.ACCESS_TEAM_PANEL, P.MODIFY_TEAM_MEMBER]} mode="all" />,
    children: [
      { path: routesPath.PROTECTED.TEAM_MGT.EDIT_PATH, Component: EditAdmin },
    ],
  },
];
