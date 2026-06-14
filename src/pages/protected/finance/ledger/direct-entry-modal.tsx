// Direct Entry (§6.2) — the ONLY screen that submits raw debit/credit lines
// (capital, opening balances, loans, adjustments). Validates Σdebit = Σcredit
// in the UI before POST /finance/direct-entries/. Amounts edited in naira,
// submitted in kobo.

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput, Money } from "@/components/finance-ui";
import { cn } from "@/lib/utils";
import { usePostDirectEntryMutation } from "@/redux/services/finance/gl-api";

interface Row {
  account: string;
  amountKobo: number;
  side: "debit" | "credit";
}

const emptyRow = (): Row => ({ account: "", amountKobo: 0, side: "debit" });

export function DirectEntryModal({
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
  const [date, setDate] = useState("");
  const [narration, setNarration] = useState("");
  const [reference, setReference] = useState("");
  const [rows, setRows] = useState<Row[]>([emptyRow(), emptyRow()]);
  const [post, { isLoading }] = usePostDirectEntryMutation();

  const totalDebit = rows.reduce((s, r) => s + (r.side === "debit" ? r.amountKobo : 0), 0);
  const totalCredit = rows.reduce((s, r) => s + (r.side === "credit" ? r.amountKobo : 0), 0);
  const balanced = totalDebit === totalCredit && totalDebit > 0;
  const hasBlankAccount = rows.some((r) => r.amountKobo > 0 && !r.account.trim());

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const reset = () => {
    setDate(""); setNarration(""); setReference("");
    setRows([emptyRow(), emptyRow()]);
  };

  const submit = async () => {
    try {
      const lines = rows
        .filter((r) => r.amountKobo > 0 && r.account.trim())
        .map((r) => ({
          account: r.account.trim(),
          debit: r.side === "debit" ? r.amountKobo : 0,
          credit: r.side === "credit" ? r.amountKobo : 0,
        }));
      const res = await post({ entity, date: date || undefined, narration, reference, lines }).unwrap();
      toast.success(res.message || "Direct entry posted.");
      reset();
      onClose();
    } catch {
      /* error toast handled centrally */
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isLoading && !o && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-mont text-base font-semibold">Post Direct Entry</DialogTitle>
          <DialogDescription className="font-mont text-sm text-gray-05">
            Raw debit/credit lines for capital, opening balances, loans or adjustments. Must balance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="space-y-1">
              <span className="font-mont text-xs text-gray-05">Date</span>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white" />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="font-mont text-xs text-gray-05">Reference</span>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional" className="bg-white" />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="font-mont text-xs text-gray-05">Narration</span>
            <Input value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="What is this entry for?" className="bg-white" />
          </label>

          {/* Lines */}
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={r.account}
                  onChange={(e) => setRow(i, { account: e.target.value })}
                  placeholder="Account code"
                  className="w-32 bg-white font-mont"
                />
                <div className="inline-flex overflow-hidden rounded-md border">
                  {(["debit", "credit"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRow(i, { side: s })}
                      className={cn(
                        "px-3 py-2 font-mont text-xs capitalize",
                        r.side === s ? "bg-primary text-white" : "bg-white text-gray-05",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <MoneyInput valueKobo={r.amountKobo} onChangeKobo={(k) => setRow(i, { amountKobo: k })} currency={currency} className="flex-1" />
                <button
                  type="button"
                  onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                  disabled={rows.length <= 2}
                  className="text-gray-05 hover:text-destructive disabled:opacity-30"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setRows((rs) => [...rs, emptyRow()])} className="gap-1.5">
              <Plus className="size-4" /> Add line
            </Button>
          </div>

          {/* Totals */}
          <div className="flex items-center justify-between rounded-md bg-white-02/50 px-4 py-2.5 font-mont text-sm">
            <span className={cn("font-semibold", balanced ? "text-green-01" : "text-destructive")}>
              {balanced ? "Balanced" : "Must balance"}
            </span>
            <div className="flex gap-6">
              <span className="text-gray-05">Dr <Money kobo={totalDebit} currency={currency} className="ml-1 font-semibold text-black-01" /></span>
              <span className="text-gray-05">Cr <Money kobo={totalCredit} currency={currency} className="ml-1 font-semibold text-black-01" /></span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" disabled={isLoading} onClick={onClose}>Cancel</Button>
          <Button disabled={isLoading || !balanced || hasBlankAccount} onClick={submit}>
            {isLoading ? "Posting…" : "Post entry"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
