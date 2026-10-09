/**
 * Organogram → Manage. Tabbed CRUD for Org Units / Positions / Matrix.
 *
 * The page admits holders of a concrete organogram write action.
 * Hiding the nav link left the route reachable by typing the URL, and this
 * page is where establishment size lives: the position list shows headcount
 * and how many seats of each are unfilled, which the org chart deliberately
 * no longer reveals. The backend remains the authoritative gate for writes.
 */

import { useRef, useState } from "react";
import { Building2, Briefcase, ChevronDown, Plus, Spline, Upload } from "lucide-react";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import PageAccessDenied from "@/components/custom/page-access-denied";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { routesPath } from "@/routes/routes-path";
import OrgNodeManager, { type OrgNodeManagerHandle } from "./org-node-manager";
import PositionManager, { type PositionManagerHandle } from "./position-manager";
import MatrixManager, { type MatrixManagerHandle } from "./matrix-manager";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { InfoHint } from "@/components/finance-ui";
import BulkImportDrawer from "@/components/custom/bulk-import-drawer";
import { baseApi } from "@/redux/services/base-api";
import { useAppDispatch } from "@/redux/store";
import type { DatasetType } from "@/redux/services/dashboard/import-types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TABS = [
  { id: "units", label: "Org Units", icon: Building2 },
  { id: "positions", label: "Positions", icon: Briefcase },
  { id: "matrix", label: "Matrix", icon: Spline },
] as const;

type TabId = (typeof TABS)[number]["id"];

const TAB_ACTIONS: Record<TabId, {
  buttonLabel: string;
  createLabel: string;
  guideTarget: string;
  infoLabel: string;
  info: string;
  datasetType: Exclude<DatasetType, "bank_statements">;
  importTitle: string;
  importDescription: string;
}> = {
  units: {
    buttonLabel: "New org unit",
    createLabel: "Create one org unit",
    guideTarget: "organogram-manage.new-org-unit",
    infoLabel: "About organisation units",
    info: "Tiered org units: Division → Department → Team. Click a row to expand or collapse its children. Set a head position whose current holder leads the unit.",
    datasetType: "org_units",
    importTitle: "Bulk upload org units",
    importDescription: "Upload, validate and publish divisions, departments and teams without leaving Organogram Manage.",
  },
  positions: {
    buttonLabel: "New position",
    createLabel: "Create one position",
    guideTarget: "organogram-manage.new-position",
    infoLabel: "About organisation positions",
    info: "Seats in the org chart ordered by the solid reporting line. Click a row to expand or collapse its direct reports.",
    datasetType: "positions",
    importTitle: "Bulk upload positions",
    importDescription: "Upload, validate and publish organogram seats and solid reporting lines without leaving Organogram Manage.",
  },
  matrix: {
    buttonLabel: "New matrix line",
    createLabel: "Create one matrix line",
    guideTarget: "organogram-manage.new-matrix-line",
    infoLabel: "About matrix reporting lines",
    info: "Dotted-line relationships are separate from the solid reporting line. Each position pair can have one matrix line.",
    datasetType: "matrix_reports",
    importTitle: "Bulk upload matrix reporting lines",
    importDescription: "Upload, validate and publish dotted reporting lines without leaving Organogram Manage.",
  },
};

export default function OrganogramManage() {
  const [tab, setTab] = useState<TabId>("units");
  const [bulkImportType, setBulkImportType] = useState<Exclude<DatasetType, "bank_statements"> | null>(null);
  const orgUnitsRef = useRef<OrgNodeManagerHandle>(null);
  const positionsRef = useRef<PositionManagerHandle>(null);
  const matrixRef = useRef<MatrixManagerHandle>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { hasAnyPermission, hasPermission } = usePermissions();
  const canCreate = hasPermission(P.CREATE_ORGANOGRAM);
  const canBulkUpload = hasPermission(P.UPLOAD_IMPORT_BATCH);
  const action = TAB_ACTIONS[tab];

  const openCreate = () => {
    if (tab === "units") orgUnitsRef.current?.openCreate();
    if (tab === "positions") positionsRef.current?.openCreate();
    if (tab === "matrix") matrixRef.current?.openCreate();
  };

  if (!hasAnyPermission(P.CREATE_ORGANOGRAM, P.UPDATE_ORGANOGRAM, P.DELETE_ORGANOGRAM, P.ASSIGN_ORGANOGRAM)) {
    return (
      <PageAccessDenied
        onBack={() => navigate(routesPath.PROTECTED.ORGANOGRAM.INDEX)}
        message="You don't have permission to manage the organogram."
      />
    );
  }

  return (
    <>
      <PageShell className="space-y-5 text-black-01">
        <div>
          <p className="font-semibold font-mont text-gray-01">Manage Organogram</p>
          <p className="text-xs text-gray-01 mt-0.5">Create and maintain the org structure - units (division/department/team), seats and dotted lines.</p>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white-02">
          <div className="flex max-w-full items-center gap-1 overflow-x-auto whitespace-nowrap">
            {TABS.map((t) => (
              <button
                key={t.id}
                data-guide={`organogram-manage.tab.${t.id}`}
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold transition-colors",
                  tab === t.id ? "text-primary" : "text-gray-01 hover:text-black-01",
                )}
              >
                <t.icon className="size-4" />
                {t.label}
                {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 pb-2">
            <InfoHint ariaLabel={action.infoLabel} className="text-gray-01">
              {action.info}
            </InfoHint>
            {canCreate && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button data-guide={action.guideTarget} size="sm">
                    <Plus className="size-4" /> {action.buttonLabel} <ChevronDown className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-52 bg-white">
                  <DropdownMenuItem onClick={openCreate}>
                    <Plus className="size-4" /> {action.createLabel}
                  </DropdownMenuItem>
                  {canBulkUpload && (
                    <DropdownMenuItem onClick={() => setBulkImportType(action.datasetType)}>
                      <Upload className="size-4" /> Bulk upload
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {tab === "units" && <OrgNodeManager ref={orgUnitsRef} />}
        {tab === "positions" && <PositionManager ref={positionsRef} />}
        {tab === "matrix" && <MatrixManager ref={matrixRef} />}
      </PageShell>

      <BulkImportDrawer
        open={bulkImportType !== null}
        datasetType={bulkImportType ?? action.datasetType}
        title={TAB_ACTIONS[tab].importTitle}
        description={TAB_ACTIONS[tab].importDescription}
        returnLabel="Back to Organogram Manage"
        onClose={() => setBulkImportType(null)}
        onFinished={() => {
          dispatch(baseApi.util.invalidateTags([
            "OrgNodes", "OrgPositions", "OrgPositionTree", "OrgMatrixReports",
          ]));
        }}
      />
    </>
  );
}
