import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import {
  CheckCircle2, Clock3, FileCheck2, FileText, Loader2, LockKeyhole,
  Mail, Paperclip, Save, Send, ShieldCheck, UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AuthToaster } from "@/components/ui/sonner";
import { apiErrorMessage } from "@/utils/api-errors";
import {
  type PublicRfqForm,
  useDeclinePublicRfqMutation,
  useAcknowledgePublicRfqAmendmentMutation,
  useGetPublicRfqFormQuery,
  useGetPublicRfqPreviewQuery,
  useRequestPublicRfqCodeMutation,
  useRevisePublicRfqMutation,
  useSavePublicRfqDraftMutation,
  useSubmitPublicRfqMutation,
  useUploadPublicRfqAttachmentMutation,
  useVerifyPublicRfqCodeMutation,
} from "@/redux/services/procurement/vendor-quotation-api";

type ResponseKind = "" | "QUOTED" | "ALTERNATIVE" | "NO_BID";
type DraftLine = {
  rfq_line: number;
  description: string;
  quantity: string;
  unitPrice: string;
  response_type: ResponseKind;
};
type Draft = {
  reference: string;
  valid_until: string;
  lead_time_days: string;
  notes: string;
  lines: DraftLine[];
};

const smallestUnit = (value: string) => Math.round(Number(value || 0) * 100);
const majorUnit = (value: number) => (value / 100).toFixed(2);
const money = (value: number, currency: string) => new Intl.NumberFormat(undefined, {
  style: "currency", currency: currency || "NGN",
}).format(value / 100);
const backendUrl = String(import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
const logoUrl = (value?: string) => value ? `${backendUrl}${value.replace(/^\/v1/, "")}` : "";

function sessionKey(token: string) {
  return `vendor-rfq-session:${token}`;
}

export default function VendorRfqPage() {
  const { token = "" } = useParams<{ token: string }>();
  const [session, setSession] = useState(() => sessionStorage.getItem(sessionKey(token)) || "");
  const preview = useGetPublicRfqPreviewQuery({ token }, { skip: !token });
  const form = useGetPublicRfqFormQuery({ token, session }, { skip: !token || !session });

  const sessionInvalid = Boolean(
    session && form.isError && /verification|session/i.test(apiErrorMessage(form.error, "")),
  );

  if (preview.isLoading || (session && form.isLoading)) return <PortalFrame><Loading /></PortalFrame>;
  if (preview.isError || !preview.data?.data) return <PortalFrame><InvalidLink /></PortalFrame>;
  if (!session || sessionInvalid || !form.data?.data) {
    return <PortalFrame issuer={preview.data.data.issuer_name} logo={logoUrl(preview.data.data.logo_url)}>
      <Verification token={token} preview={preview.data.data} onVerified={(value) => {
        sessionStorage.setItem(sessionKey(token), value);
        setSession(value);
      }} />
    </PortalFrame>;
  }
  return <PortalFrame issuer={form.data.data.issuer.name} logo={logoUrl(form.data.data.issuer.logo_url)} wide>
    <QuotationWorkspace token={token} session={session} initial={form.data.data} />
  </PortalFrame>;
}

function PortalFrame({ children, issuer, logo, wide = false }: {
  children: React.ReactNode; issuer?: string; logo?: string; wide?: boolean;
}) {
  return <div className="min-h-screen bg-[#f4f7fb] text-black-01">
    <AuthToaster />
    <header className="border-b border-[#dce3ee] bg-[#0b1f4a] px-4 py-4 text-white">
      <div className={`mx-auto flex items-center gap-3 ${wide ? "max-w-6xl" : "max-w-xl"}`}>
        {logo ? <img src={logo} alt="" className="size-10 shrink-0 rounded-lg bg-white object-contain p-1" /> : <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/10 font-mont text-sm font-bold">{(issuer || "XV").slice(0, 2).toUpperCase()}</div>}
        <div className="min-w-0">
          <p className="truncate font-mont text-sm font-semibold">{issuer || "Secure vendor quotations"}</p>
          <p className="font-mont text-xs text-white/70">Vendor quotation portal</p>
        </div>
        <ShieldCheck className="ml-auto size-5 text-emerald-300" />
      </div>
    </header>
    <main className={`mx-auto px-4 py-6 sm:py-10 ${wide ? "max-w-6xl" : "max-w-xl"}`}>{children}</main>
  </div>;
}

function Loading() {
  return <div className="flex min-h-56 items-center justify-center gap-2 rounded-xl bg-white text-sm text-gray-05 shadow-sm">
    <Loader2 className="size-4 animate-spin" /> Loading secure invitation
  </div>;
}

function InvalidLink() {
  return <div className="rounded-xl bg-white p-8 text-center shadow-sm">
    <LockKeyhole className="mx-auto size-10 text-gray-04" />
    <h1 className="mt-4 font-mont text-xl font-semibold">Invitation unavailable</h1>
    <p className="mt-2 text-sm text-gray-05">This quotation link is invalid or has been replaced. Ask the buyer to resend it.</p>
  </div>;
}

function Verification({ token, preview, onVerified }: {
  token: string;
  preview: { vendor_name: string; rfq_number: string; deadline_display: string; expired: boolean; has_submission: boolean };
  onVerified: (session: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [requestCode, requestState] = useRequestPublicRfqCodeMutation();
  const [verify, verifyState] = useVerifyPublicRfqCodeMutation();

  const request = async () => {
    try {
      await requestCode({ token, email }).unwrap();
      setSent(true);
      toast.success("Verification code sent.");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not send the verification code."));
    }
  };
  const confirm = async () => {
    try {
      const response = await verify({ token, email, code }).unwrap();
      onVerified(response.data.session_token);
    } catch (error) {
      toast.error(apiErrorMessage(error, "The verification code is invalid or expired."));
    }
  };

  return <section className="overflow-hidden rounded-xl bg-white shadow-sm">
    <div className="border-b border-gray-03 bg-[#f8fafc] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><FileText className="size-5" /></div>
        <div>
          <p className="font-mont text-xs font-semibold uppercase tracking-wide text-primary">{preview.rfq_number}</p>
          <h1 className="mt-1 font-mont text-xl font-semibold">Quotation invitation for {preview.vendor_name}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-05"><Clock3 className="size-3.5" /> {preview.deadline_display}</p>
        </div>
      </div>
    </div>
    <div className="space-y-5 p-5 sm:p-6">
      {preview.expired && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        {preview.has_submission ? "The deadline has passed. Verify your email to view the submitted receipt." : "This RFQ has expired and no longer accepts quotations."}
      </div>}
      <div>
        <label className="font-mont text-xs font-semibold text-gray-01">Invitation email</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1"><Mail className="absolute left-3 top-3 size-4 text-gray-04" /><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@vendor.com" className="h-10 pl-9" /></div>
          <Button onClick={request} disabled={!email || requestState.isLoading} loading={requestState.isLoading}>Send code</Button>
        </div>
      </div>
      {sent && <div>
        <label className="font-mont text-xs font-semibold text-gray-01">Six-digit code</label>
        <Input inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="mt-2 h-11 text-center font-mono text-lg tracking-[0.35em]" />
        <p className="mt-2 text-xs text-gray-05">This browser stays verified for 24 hours. Your draft remains saved after verification expires.</p>
        <Button className="mt-4 w-full" onClick={confirm} disabled={code.length !== 6 || verifyState.isLoading} loading={verifyState.isLoading}>Open secure quotation</Button>
      </div>}
    </div>
  </section>;
}

function toDraft(form: PublicRfqForm): Draft {
  const quoteLines = new Map((form.quotation?.lines || []).map((line) => [line.rfq_line_id, line]));
  return {
    reference: form.quotation?.reference || "",
    valid_until: form.quotation?.valid_until || "",
    lead_time_days: form.quotation?.lead_time_days == null ? "" : String(form.quotation.lead_time_days),
    notes: form.quotation?.notes || "",
    lines: form.rfq.lines.map((line) => {
      const saved = quoteLines.get(line.id);
      return {
        rfq_line: line.id,
        description: saved?.description || line.description,
        quantity: saved?.quantity || line.quantity,
        unitPrice: saved ? majorUnit(saved.unit_price) : "",
        response_type: saved?.response_type || "",
      };
    }),
  };
}

function QuotationWorkspace({ token, session, initial }: { token: string; session: string; initial: PublicRfqForm }) {
  const [data, setData] = useState(initial);
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial));
  const [savedAt, setSavedAt] = useState("");
  const [dirty, setDirty] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const initialized = useRef(true);
  const [save, saveState] = useSavePublicRfqDraftMutation();
  const [submit, submitState] = useSubmitPublicRfqMutation();
  const [revise, reviseState] = useRevisePublicRfqMutation();
  const [decline, declineState] = useDeclinePublicRfqMutation();
  const [acknowledge, acknowledgeState] = useAcknowledgePublicRfqAmendmentMutation();
  const [upload, uploadState] = useUploadPublicRfqAttachmentMutation();

  const payload = useMemo(() => ({
    reference: draft.reference,
    valid_until: draft.valid_until || null,
    lead_time_days: draft.lead_time_days || null,
    notes: draft.notes,
    lines: draft.lines.filter((line) => line.response_type).map((line) => ({
      rfq_line: line.rfq_line,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.response_type === "NO_BID" ? 0 : smallestUnit(line.unitPrice),
      response_type: line.response_type,
    })),
  }), [draft]);

  const saveNow = useCallback(async (quiet = false) => {
    if (!data.invitation.can_edit) return;
    try {
      const response = await save({ token, session, body: payload }).unwrap();
      setData(response.data);
      setDirty(false);
      setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      if (!quiet) toast.success("Draft saved.");
    } catch (error) {
      if (!quiet) toast.error(apiErrorMessage(error, "Could not save the draft."));
    }
  }, [data.invitation.can_edit, payload, save, session, token]);

  useEffect(() => {
    if (!initialized.current || !dirty || !data.invitation.can_edit) return;
    const timer = window.setTimeout(() => void saveNow(true), 1400);
    return () => window.clearTimeout(timer);
  }, [dirty, data.invitation.can_edit, saveNow]);

  const updateHeader = (key: keyof Omit<Draft, "lines">, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };
  const updateLine = (index: number, patch: Partial<DraftLine>) => {
    setDraft((current) => ({ ...current, lines: current.lines.map((line, position) => position === index ? { ...line, ...patch } : line) }));
    setDirty(true);
  };

  const submitNow = async () => {
    if (draft.lines.some((line) => !line.response_type)) {
      toast.error("Answer every requested line before submitting.");
      return;
    }
    try {
      if (dirty) await saveNow(true);
      const response = await submit({ token, session }).unwrap();
      setData(response.data);
      setDraft(toDraft(response.data));
      toast.success("Quotation submitted. A receipt was emailed to you.");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not submit the quotation."));
    }
  };

  const reviseNow = async () => {
    try {
      const response = await revise({ token, session }).unwrap();
      setData(response.data);
      setDraft(toDraft(response.data));
      toast.success("Quotation reopened for revision.");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not reopen the quotation."));
    }
  };

  const declineNow = async () => {
    try {
      const response = await decline({ token, session, reason: declineReason }).unwrap();
      setData(response.data);
      toast.success("RFQ declined.");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not decline the RFQ."));
    }
  };

  const uploadFile = async (file?: File) => {
    if (!file) return;
    try {
      const response = await upload({ token, session, file }).unwrap();
      setData(response.data);
      toast.success("Attachment uploaded.");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not upload the attachment."));
    }
  };
  const acknowledgeNow = async () => {
    try {
      const response = await acknowledge({ token, session }).unwrap();
      setData(response.data);
      toast.success("Latest RFQ amendment acknowledged.");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not acknowledge the amendment."));
    }
  };
  const openAttachment = async (id: number, name: string) => {
    try {
      const response = await fetch(`${backendUrl}/procurement/public/rfqs/${token}/attachments/${id}/`, {
        headers: { "X-RFQ-Session": session },
      });
      if (!response.ok) throw new Error("Attachment unavailable");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.download = name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error("Could not open the attachment.");
    }
  };

  if (data.invitation.expired && !data.latest_submission) return <Expired form={data} />;
  const readOnly = !data.invitation.can_edit;
  return <div className="space-y-5">
    <section className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mont text-xs font-semibold uppercase tracking-wide text-primary">{data.rfq.number} · Version {data.rfq.version}</p>
          <h1 className="mt-1 font-mont text-2xl font-semibold">{data.rfq.title || "Request for quotation"}</h1>
          <p className="mt-1 text-sm text-gray-05">Prepared for {data.vendor.name}</p>
        </div>
        <div className={`rounded-lg px-3 py-2 text-xs font-semibold ${data.invitation.expired ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>
          <Clock3 className="mr-1.5 inline size-3.5" />{data.rfq.deadline_display}
        </div>
      </div>
      {data.rfq.notes && <p className="mt-4 rounded-lg bg-[#f8fafc] p-3 text-sm leading-6 text-gray-01">{data.rfq.notes}</p>}
      {data.rfq.amendments.length > 0 && <div className="mt-4 space-y-2">{data.rfq.amendments.map((row) => <div key={row.version} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><p className="font-mont text-xs font-semibold uppercase tracking-wide">Amendment · Version {row.version}</p><p className="mt-1 leading-5">{row.summary}</p>{row.response_required && <p className="mt-1 text-xs font-semibold">A new quotation response is required.</p>}</div>)}{data.invitation.requires_acknowledgement && <Button size="sm" variant="outline" onClick={acknowledgeNow} loading={acknowledgeState.isLoading}><CheckCircle2 className="size-3.5" /> I have reviewed the latest amendment</Button>}</div>}
      {data.latest_submission && <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"><CheckCircle2 className="size-4" /><span className="min-w-0 flex-1">{data.invitation.can_edit ? `Revision ${data.submission_revision} remains preserved. Complete and submit the new RFQ version.` : `Submitted revision ${data.submission_revision}. This receipt is read-only.`}</span><Button size="sm" variant="outline" className="print:hidden" onClick={() => window.print()}><FileText className="size-3.5" /> Print or save PDF</Button></div>}
    </section>

    <section className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-mont text-base font-semibold">Commercial details</h2><p className="mt-1 text-xs text-gray-05">Fields save automatically while the quotation is editable.</p></div>
        <span className="text-xs text-gray-05">{saveState.isLoading ? "Saving..." : savedAt ? `Saved at ${savedAt}` : "Not saved yet"}</span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Quotation reference"><Input value={draft.reference} onChange={(event) => updateHeader("reference", event.target.value)} disabled={readOnly} /></Field>
        <Field label="Valid until"><Input type="date" value={draft.valid_until} onChange={(event) => updateHeader("valid_until", event.target.value)} disabled={readOnly} /></Field>
        <Field label="Lead time (days)"><Input type="number" min="0" max="3650" value={draft.lead_time_days} onChange={(event) => updateHeader("lead_time_days", event.target.value)} disabled={readOnly} /></Field>
      </div>
      <Field label="Notes" className="mt-4"><Textarea value={draft.notes} onChange={(event) => updateHeader("notes", event.target.value)} disabled={readOnly} maxLength={255} /></Field>
    </section>

    <section className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-mont text-base font-semibold">Requested items</h2>
      <p className="mt-1 text-xs text-gray-05">Answer every line as quoted, alternative offered, or not available.</p>
      <div className="mt-4 space-y-3">{draft.lines.map((line, index) => <div key={line.rfq_line} className="rounded-lg border border-gray-03 p-4">
        <div className="flex items-start gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span><div className="min-w-0"><p className="font-mont text-sm font-semibold">{data.rfq.lines[index]?.description}</p><p className="mt-1 text-xs text-gray-05">Requested quantity: {data.rfq.lines[index]?.quantity}</p></div></div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Field label="Response"><select className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm disabled:bg-gray-03" value={line.response_type} onChange={(event) => updateLine(index, { response_type: event.target.value as ResponseKind })} disabled={readOnly}><option value="">Choose response</option><option value="QUOTED">Quoted</option><option value="ALTERNATIVE">Alternative offered</option><option value="NO_BID">Not available / no-bid</option></select></Field>
          <Field label="Description" className="sm:col-span-2"><Input value={line.description} onChange={(event) => updateLine(index, { description: event.target.value })} disabled={readOnly || line.response_type !== "ALTERNATIVE"} /></Field>
          <Field label={`Unit price (${data.rfq.currency})`}><Input type="number" min="0" step="0.01" value={line.unitPrice} onChange={(event) => updateLine(index, { unitPrice: event.target.value })} disabled={readOnly || !line.response_type || line.response_type === "NO_BID"} /></Field>
        </div>
      </div>)}</div>
      {data.quotation && <div className="mt-5 grid grid-cols-1 gap-3 border-t border-gray-03 pt-4 sm:grid-cols-3"><Total label="Subtotal" value={money(data.quotation.subtotal, data.rfq.currency)} /><Total label="Tax" value={money(data.quotation.tax_total, data.rfq.currency)} /><Total label="Total" value={money(data.quotation.total, data.rfq.currency)} strong /></div>}
    </section>

    <section className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-mont text-base font-semibold">Supporting documents</h2><p className="mt-1 text-xs text-gray-05">Up to five PDF or image files, 500KB each.</p></div>{!readOnly && <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-gray-02"><UploadCloud className="size-4" />{uploadState.isLoading ? "Uploading..." : "Upload file"}<input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="sr-only" disabled={uploadState.isLoading} onChange={(event) => void uploadFile(event.target.files?.[0])} /></label>}</div>
      <div className="mt-4 space-y-2">{data.attachments.length ? data.attachments.map((file) => <div key={file.id} className="flex items-center gap-3 rounded-lg border border-gray-03 p-3"><Paperclip className="size-4 text-gray-04" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{file.name}</p><p className="text-xs text-gray-05">{Math.ceil(file.size / 1024)}KB · Revision {file.revision}</p></div><Button size="sm" variant="outline" onClick={() => void openAttachment(file.id, file.name)}>Open</Button></div>) : <p className="rounded-lg bg-[#f8fafc] p-4 text-center text-sm text-gray-05">No supporting documents uploaded.</p>}</div>
    </section>

    <section className="flex flex-col-reverse gap-3 rounded-xl bg-white p-5 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
      {data.invitation.can_edit && <><div className="mr-auto flex min-w-0 flex-1 flex-col gap-2 sm:max-w-md sm:flex-row"><Input value={declineReason} onChange={(event) => setDeclineReason(event.target.value)} placeholder="Optional reason for declining" /><Button variant="outline" onClick={declineNow} loading={declineState.isLoading}>Decline</Button></div><Button variant="outline" onClick={() => void saveNow()} loading={saveState.isLoading}><Save className="size-4" /> Save draft</Button><Button onClick={submitNow} disabled={data.invitation.requires_acknowledgement} loading={submitState.isLoading}><Send className="size-4" /> Submit quotation</Button></>}
      {data.invitation.can_revise && <Button onClick={reviseNow} loading={reviseState.isLoading}><FileCheck2 className="size-4" /> Withdraw and revise</Button>}
    </section>
  </div>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`block font-mont text-xs font-semibold text-gray-01 ${className}`}>{label}<div className="mt-2">{children}</div></label>;
}

function Total({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className={`rounded-lg p-3 ${strong ? "bg-primary text-white" : "bg-[#f8fafc]"}`}><p className={`text-xs ${strong ? "text-white/70" : "text-gray-05"}`}>{label}</p><p className="mt-1 font-mont text-base font-semibold">{value}</p></div>;
}

function Expired({ form }: { form: PublicRfqForm }) {
  return <section className="rounded-xl bg-white p-8 text-center shadow-sm">
    <Clock3 className="mx-auto size-10 text-amber-500" />
    <h1 className="mt-4 font-mont text-2xl font-semibold">Quotation period closed</h1>
    <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-05">The deadline for {form.rfq.number} passed on {form.rfq.deadline_display}. Contact {form.issuer.name} if you need an extension.</p>
  </section>;
}
