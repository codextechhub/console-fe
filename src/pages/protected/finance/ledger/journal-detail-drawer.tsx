// Journal detail drawer — read-only view of a journal with its Dr/Cr lines, and
// the Reverse action (gated finance.journal.reverse) for posted entries.

import { useState } from "react";
import { toast } from "sonner";
import {
  DetailDrawer,
  JournalTable,
  StatusPill,
  ConfirmActionModal,
} from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { LoadingState, ErrorState } from "@/components/finance-ui/states";
import { Button } from "@/components/ui/button";
import { P } from "@/permissions";
import { useGetJournalQuery, useReverseJournalMutation } from "@/redux/services/finance/gl-api";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="font-mont text-xs uppercase tracking-wide text-gray-05">{label}</p>
      <p className="mt-0.5 font-mont text-sm font-medium text-black-01">{value || "—"}</p>
    </div>
  );
}

export function JournalDetailDrawer({
  journalId,
  entity,
  currency,
  onClose,
}: {
  journalId: number | null;
  entity: string;
  currency?: string | null;
  onClose: () => void;
}) {
  const open = journalId != null;
  const { data, isLoading, isError, refetch } = useGetJournalQuery(
    { id: journalId!, entity },
    { skip: !open },
  );
  const [reverse, { isLoading: reversing }] = useReverseJournalMutation();
  const [confirmReverse, setConfirmReverse] = useState(false);

  const j = data?.data;

  const doReverse = async () => {
    try {
      const res = await reverse({ id: journalId!, entity }).unwrap();
      toast.success(res.message || "Journal reversed.");
      setConfirmReverse(false);
      onClose();
    } catch {
      /* handled centrally */
    }
  };

  return (
    <>
      <DetailDrawer
        open={open}
        onOpenChange={(o) => !o && onClose()}
        title={j ? j.document_number : "Journal"}
        description={j ? `${j.date} · ${j.source}` : undefined}
        footer={
          j?.status === "POSTED" ? (
            <Can permission={P.FIN_REVERSE_JOURNAL}>
              <Button
                variant="outline"
                onClick={() => setConfirmReverse(true)}
                className="border-destructive/40 text-destructive hover:bg-destructive/5"
              >
                Reverse journal
              </Button>
            </Can>
          ) : null
        }
      >
        {isLoading ? (
          <LoadingState rows={5} />
        ) : isError || !j ? (
          <ErrorState onRetry={refetch} />
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <StatusPill status={j.status} />
              {j.reverses_id && (
                <span className="font-mont text-xs text-gray-05">Reverses #{j.reverses_id}</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Period" value={j.period} />
              <Field label="Reference" value={j.reference} />
              <Field label="Posted at" value={j.posted_at ? new Date(j.posted_at).toLocaleString("en-GB") : "—"} />
              <Field label="Source" value={j.source} />
            </div>
            {j.narration && <Field label="Narration" value={j.narration} />}
            <JournalTable lines={j.lines} currency={currency} totalDebit={j.total_debit} totalCredit={j.total_credit} />
          </div>
        )}
      </DetailDrawer>

      <ConfirmActionModal
        open={confirmReverse}
        onOpenChange={setConfirmReverse}
        title="Reverse this journal?"
        description={`A contra entry will be posted to reverse ${j?.document_number}. This cannot be undone.`}
        confirmText="Reverse journal"
        destructive
        loading={reversing}
        onConfirm={doReverse}
      />
    </>
  );
}
