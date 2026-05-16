import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";
import SchoolManagement from "@/pages/protected/school-mgt";
import CreateSchool from "@/pages/protected/school-mgt/create-school";
import ViewSchool from "@/pages/protected/school-mgt/view-school";
import EditSchool from "@/pages/protected/school-mgt/edit-school";
import ViewBranch from "@/pages/protected/school-mgt/view-branch";
import EditBranch from "@/pages/protected/school-mgt/edit-branch";

export const schoolRoutes: RouteObject[] = [
  { path: routesPath.PROTECTED.SCHOOL_MGT.INDEX, Component: SchoolManagement },
  { path: routesPath.PROTECTED.SCHOOL_MGT.VIEW_PATH, Component: ViewSchool },
  { path: routesPath.PROTECTED.SCHOOL_MGT.VIEW_BRANCH_PATH, Component: ViewBranch },
  { path: routesPath.PROTECTED.SCHOOL_MGT.CREATE, Component: CreateSchool },
  { path: routesPath.PROTECTED.SCHOOL_MGT.EDIT_PATH, Component: EditSchool },
  { path: routesPath.PROTECTED.SCHOOL_MGT.EDIT_BRANCH_PATH, Component: EditBranch },
];
