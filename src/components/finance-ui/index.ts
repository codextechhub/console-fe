// Shared Finance & Procurement UI primitives (spec §4). Built once in the app's
// design language and reused across both consoles. Import from "@/components/
// finance-ui".

export { Can, useCan } from "./can";
export { Money } from "./money";
export { MoneyInput } from "./money-input";
export { StatusPill } from "./status-pill";
export { JournalTable, type JournalLineView } from "./journal-table";
export { DataTable, type Column } from "./data-table";
export { DetailDrawer } from "./detail-drawer";
export { ConfirmActionModal } from "./confirm-action-modal";
export { ActionButton } from "./action-button";
export { EntitySelect } from "./entity-select";
export { FormModal, FormField } from "./form-modal";
export { AccountPicker, CustomerPicker, CurrencyPicker, TaxCodePicker, CostCenterPicker, TaxObligationPicker, PettyCashFundPicker } from "./pickers";
export { LineEditor, emptyLine, toApiLines, type DocLine } from "./line-editor";
export { useActiveEntity, useEntityCode } from "./use-entity";
export {
  LoadingState,
  EmptyState,
  ErrorState,
  ForbiddenState,
} from "./states";
// KpiCard already exists app-wide; re-export so finance pages import from one place.
export { default as KpiCard } from "@/components/custom/kpi-card";
export { TeachingNote } from "./teaching-note";
export { BarChart, Donut, StatStrip, WorkflowStrip, Sparkline, BudgetBar, AgingStack, TrendArea, CHART_COLORS, type BarDatum, type DonutDatum, type AgingDatum } from "./charts";
// Coerce an endpoint's `data` to an array (backend sends `{}` for an empty list).
export { toArray } from "@/redux/services/finance/api-types";
