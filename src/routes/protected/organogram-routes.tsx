import { type RouteObject } from "react-router";
import { routesPath } from "@/routes/routesPath";
import OrganogramPage from "@/pages/protected/organogram";
import OrganogramManage from "@/pages/protected/organogram/manage";
import StaffDirectory from "@/pages/protected/organogram/staff";
import StaffDetail from "@/pages/protected/organogram/staff/staff-detail";
import StaffForm from "@/pages/protected/organogram/staff/staff-form";
import MyProfile from "@/pages/protected/me-profile";

const O = routesPath.PROTECTED.ORGANOGRAM;

export const organogramRoutes: RouteObject[] = [
  { path: O.INDEX, element: <OrganogramPage /> },
  { path: O.MANAGE, element: <OrganogramManage /> },
  { path: O.STAFF, element: <StaffDirectory /> },
  { path: O.STAFF_CREATE, element: <StaffForm /> },
  { path: O.STAFF_VIEW_PATH, element: <StaffDetail /> },
  { path: O.STAFF_EDIT_PATH, element: <StaffForm /> },
  { path: routesPath.PROTECTED.ME_PROFILE.INDEX, element: <MyProfile /> },
];
