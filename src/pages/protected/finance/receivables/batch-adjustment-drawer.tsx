import { useMemo, useState } from "react";
import { Plus, Send, X } from "lucide-react";
import { toast } from "sonner";
import {
  AccountPicker,
  BankAccountPicker,
  DetailDrawer,
  FormField,
  MoneyInput,
  PostingDateField,
  PostingRecap,
  Segmented,
  toArray,
  type RecapRow,
} from "@/components/finance-ui";
import { useCan } from "@/components/finance-ui/can";
import { SearchSelect } from "@/components/custom/search-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { P } from "@/permissions";
import {
  useCreateArAdjustmentBatchMutation,
  useGetInvoicesQuery,
  useGetRefundAvailabilityQuery,
} from "@/redux/services/finance/ar-api";
import type {
  ArAdjustmentBatchAction,
  ArAdjustmentBatchInput,
  ArAdjustmentBatchKind,
} from "@/redux/services/finance/ar-types";
import { formatMoney } from "@/utils/money";
import { batchAdjustmentLinesAreValid } from "./batch-adjustment-validation";

type Line = { id: number; target: string; amount: number; available: number };
let lineSequence = 1;
const newLine = (): Line => ({ id: lineSequence++, target: "", amount: 0, available: 0 });

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-gray-50 px-3 py-2.5">
      <p className="font-mont text-[11px] text-gray-05">{label}</p>
      <p className="mt-0.5 truncate font-mont text-sm font-semibold tabular-nums text-black-01">{value}</p>
    </div>
  );
}

export function BatchAdjustmentDrawer({
  open,
  onClose,
  entity,
  currency,
}: {
  open: boolean;
  onClose: () => void;
  entity: string;
  currency?: string | null;
}) {
  const { can } = useCan();
  const canCreateRefund = can(P.FIN_CREATE_REFUND);
  const canCreateWriteOff = can(P.FIN_CREATE_WRITE_OFF);
  const [kind, setKind] = useState<ArAdjustmentBatchKind>(
    canCreateRefund ? "REFUND" : "WRITEOFF",
  );
  const [date, setDate] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [writeOffAccount, setWriteOffAccount] = useState("");
  const [reason, setReason] = useState("");
  const [action, setAction] = useState<ArAdjustmentBatchAction>("DRAFT");
  const [lines, setLines] = useState<Line[]>(() => [newLine()]);
  const [createBatch, { isLoading }] = useCreateArAdjustmentBatchMutation();
  const writeOff = kind === "WRITEOFF";

  const refundAvailability = useGetRefundAvailabilityQuery(
    { entity, page_size: 100 },
    { skip: !open || writeOff },
  );
  const invoices = useGetInvoicesQuery(
    { entity, status: "POSTED", page_size: 100 },
    { skip: !open || !writeOff },
  );
  const refundTargets = useMemo(
    () => toArray(refundAvailability.data?.data),
    [refundAvailability.data],
  );
  const invoiceTargets = useMemo(
    () => toArray(invoices.data?.data).filter((invoice) => invoice.balance_due > 0),
    [invoices.data],
  );
  const options = useMemo(
    () => writeOff
      ? invoiceTargets.map((invoice) => ({
          value: String(invoice.id),
          label: `${invoice.document_number} — ${invoice.customer_name} · ${formatMoney(invoice.balance_due, currency)} due`,
        }))
      : refundTargets.map((customer) => ({
          value: customer.customer_code,
          label: `${customer.customer_code} — ${customer.customer_name} · ${formatMoney(customer.refundable_credit, currency)} available`,
        })),
    [writeOff, invoiceTargets, refundTargets, currency],
  );

  const actionOptions = useMemo(() => {
    const values: { value: ArAdjustmentBatchAction; label: string }[] = [
      { value: "DRAFT", label: "Save all as drafts" },
    ];
    if (can(writeOff ? P.FIN_SUBMIT_WRITE_OFF : P.FIN_SUBMIT_REFUND)) {
      values.push({ value: "SUBMIT", label: "Submit all for approval" });
    }
    if (can(writeOff ? P.FIN_POST_WRITE_OFF : P.FIN_POST_REFUND)) {
      values.push({ value: "POST", label: "Post all now" });
    }
    return values;
  }, [can, writeOff]);

  const setLine = (id: number, patch: Partial<Line>) => {
    setLines((current) => current.map((line) => (
      line.id === id ? { ...line, ...patch } : line
    )));
  };
  const pickTarget = (id: number, target: string) => {
    const available = writeOff
      ? invoiceTargets.find((invoice) => String(invoice.id) === target)?.balance_due ?? 0
      : refundTargets.find((customer) => customer.customer_code === target)?.refundable_credit ?? 0;
    setLine(id, { target, amount: available, available });
  };
  const total = lines.reduce((sum, line) => sum + (line.amount || 0), 0);
  const valid = batchAdjustmentLinesAreValid(lines);
  const duplicateTargets = new Set(
    lines
      .filter((line, index) => (
        !!line.target && lines.findIndex((other) => other.target === line.target) !== index
      ))
      .map((line) => line.target),
  );
  const canCreateKind = writeOff ? canCreateWriteOff : canCreateRefund;
  const canSubmit = canCreateKind && valid && !!date && (writeOff || !!bankAccount);

  const recap = useMemo<{ dr: RecapRow[]; cr: RecapRow[] }>(() => writeOff
    ? {
        dr: [{ code: writeOffAccount || "5300", name: "Bad debt expense", amount: total }],
        cr: [{ code: "AR", name: "Accounts Receivable (control)", amount: total }],
      }
    : {
        dr: [{ code: "2140", name: "Customer credit", amount: total }],
        cr: [{ code: "Bank", name: "cash out", amount: total }],
      }, [writeOff, writeOffAccount, total]);

  const defaultAction = (nextKind: ArAdjustmentBatchKind): ArAdjustmentBatchAction => {
    const isWriteOff = nextKind === "WRITEOFF";
    if (can(isWriteOff ? P.FIN_POST_WRITE_OFF : P.FIN_POST_REFUND)) return "POST";
    if (can(isWriteOff ? P.FIN_SUBMIT_WRITE_OFF : P.FIN_SUBMIT_REFUND)) return "SUBMIT";
    return "DRAFT";
  };
  const changeKind = (nextKind: ArAdjustmentBatchKind) => {
    setKind(nextKind);
    setLines([newLine()]);
    setAction(defaultAction(nextKind));
  };
  const reset = () => {
    const initialKind = canCreateRefund ? "REFUND" : "WRITEOFF";
    lineSequence = 1;
    setKind(initialKind);
    setDate("");
    setBankAccount("");
    setWriteOffAccount("");
    setReason("");
    setLines([newLine()]);
    setAction(defaultAction(initialKind));
  };
  const close = () => {
    reset();
    onClose();
  };
  const submit = async () => {
    if (!canSubmit) return;
    const input: ArAdjustmentBatchInput = {
      entity,
      kind,
      action,
      date,
      reason: reason.trim() || undefined,
      narration: reason.trim() || undefined,
      ...(writeOff
        ? { write_off_account: writeOffAccount || undefined }
        : { bank_account: bankAccount }),
      items: writeOff
        ? lines.map((line) => ({ invoice: Number(line.target), amount: line.amount }))
        : lines.map((line) => ({ customer: line.target, amount: line.amount })),
    };
    try {
      const response = await createBatch(input).unwrap();
      toast.success(response.message || `${response.data.count} adjustments processed.`);
      close();
    } catch { /* central */ }
  };

  return (
    <DetailDrawer
      open={open}
      onOpenChange={(nextOpen) => (nextOpen ? undefined : close())}
      title={writeOff ? "Batch write-offs" : "Batch refunds"}
      description="Process up to 100 adjustments in one all-or-nothing batch."
      widthClass="sm:max-w-3xl"
      footer={(
        <>
          <Button variant="outline" disabled={isLoading} onClick={close}>Cancel</Button>
          <div className="flex-1" />
          <Button disabled={isLoading || !canSubmit} onClick={submit} className="gap-1.5">
            <Send className="size-4" />
            {isLoading
              ? "Processing…"
              : action === "POST"
                ? `Post ${lines.length}`
                : action === "SUBMIT"
                  ? `Submit ${lines.length}`
                  : `Save ${lines.length} drafts`}
          </Button>
        </>
      )}
    >
      <div className="space-y-5">
        <Segmented
          label="Adjustment type"
          value={kind}
          onChange={changeKind}
          options={[["REFUND", "Refunds"], ["WRITEOFF", "Write-offs"]]}
          isDisabled={(value) => (
            value === "REFUND" ? !canCreateRefund : !canCreateWriteOff
          )}
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric label="Lines" value={String(lines.length)} />
          <Metric label="Batch total" value={formatMoney(total, currency)} />
          <div className="col-span-2 sm:col-span-1">
            <Metric label="Processing" value="All or nothing" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PostingDateField label="Posting date" entity={entity} value={date} onChange={setDate} />
          {writeOff ? (
            <FormField label="Write-off expense account">
              <AccountPicker
                entity={entity}
                value={writeOffAccount}
                onChange={setWriteOffAccount}
                accountType="EXPENSE"
                postableOnly
                placeholder="Defaults to bad debt (5300)"
              />
            </FormField>
          ) : (
            <FormField label="Refund bank account" required>
              <BankAccountPicker entity={entity} value={bankAccount} onChange={setBankAccount} />
            </FormField>
          )}
        </div>
        <FormField label="Reason">
          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Applied to every line"
            className="bg-white"
          />
        </FormField>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">
              Batch lines
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={lines.length >= 100}
              onClick={() => setLines((current) => [...current, newLine()])}
              className="h-7 gap-1 text-xs"
            >
              <Plus className="size-3.5" /> Add line
            </Button>
          </div>
          <div className="space-y-2">
            {lines.map((line) => {
              const duplicate = duplicateTargets.has(line.target);
              const overLimit = line.amount > line.available;
              return (
                <div key={line.id} className="rounded-md border border-gray-03 bg-white p-2.5">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 sm:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_auto]">
                    <div className="col-span-2 min-w-0 sm:col-span-1">
                      <p className="mb-1 font-mont text-[11px] text-gray-05">
                        {writeOff ? "Invoice" : "Customer credit"}
                      </p>
                      <SearchSelect
                        options={options}
                        value={line.target}
                        onChange={(event) => pickTarget(line.id, event.target.value)}
                        loading={writeOff ? invoices.isFetching : refundAvailability.isFetching}
                        placeholder={writeOff ? "Select an open invoice" : "Select refundable credit"}
                        revealOnSearch
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="mb-1 font-mont text-[11px] text-gray-05">Amount</p>
                      <MoneyInput
                        valueKobo={line.amount}
                        onChangeKobo={(amount) => setLine(line.id, { amount })}
                        currency={currency}
                        disabled={!line.target}
                        className="[&_input]:h-9"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={lines.length === 1}
                      onClick={() => setLines((current) => (
                        current.length > 1
                          ? current.filter((candidate) => candidate.id !== line.id)
                          : current
                      ))}
                      className="size-9 text-gray-05 hover:text-destructive"
                      aria-label="Remove line"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                  {line.target ? (
                    <p className={cn(
                      "mt-1.5 font-mont text-[11px]",
                      duplicate || overLimit ? "text-destructive" : "text-gray-05",
                    )}>
                      {duplicate
                        ? "This target already appears in the batch."
                        : overLimit
                          ? `Amount cannot exceed ${formatMoney(line.available, currency)}.`
                          : `${formatMoney(line.available, currency)} available.`}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
          {(writeOff ? invoices.isError : refundAvailability.isError) ? (
            <p className="mt-2 font-mont text-xs text-destructive">
              Eligible targets could not be loaded. Try again.
            </p>
          ) : null}
        </div>

        <PostingRecap
          title={writeOff ? "Combined write-off posting" : "Combined refund posting"}
          dr={recap.dr}
          cr={recap.cr}
          currency={currency}
          stackOnMobile
          helper="Each line keeps its own document and audit trail; the batch only commits when every line succeeds."
        />

        <FormField label="Next action">
          <select
            value={action}
            onChange={(event) => setAction(event.target.value as ArAdjustmentBatchAction)}
            className="h-9 w-full rounded-md border border-gray-03 bg-white px-3 font-mont text-sm text-black-01 focus:border-primary focus:outline-none"
          >
            {actionOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </FormField>
      </div>
    </DetailDrawer>
  );
}
