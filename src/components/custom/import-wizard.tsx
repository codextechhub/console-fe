import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  useCreateImportBatchMutation,
  useGetImportBatchQuery,
  useValidateImportBatchMutation,
  useStartImportBatchMutation,
} from "@/redux/services/dashboard/import-api";
import type { DatasetType, ImportBatch } from "@/redux/services/dashboard/import-types";
import {
  type WizardStep,
  unwrap,
  extractUploadError,
  WizardStepper,
  UploadStep,
  HeaderReviewStep,
  ValidationStep,
  ReviewIssuesStep,
  ConfirmStep,
  ImportProgressStep,
  CompleteStep,
} from "./import-wizard/wizard-steps";

interface ImportWizardProps {
  datasetType?: DatasetType;
  lockTemplate?: boolean;
  onComplete?: (batchId: number) => void;
  onReturn?: () => void;
  returnLabel?: string;
  onCancel?: () => void;
}

// ── Main Wizard ─────────────────────────────────────────────────────────────

export default function ImportWizard({ datasetType, lockTemplate, onComplete, onReturn, returnLabel, onCancel }: ImportWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);

  // Step 1 state
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  // Batch state (populated after upload)
  const [batchId, setBatchId] = useState<number | null>(null);
  const [jobId, setJobId] = useState<number | null>(null);

  // Step 3 state
  const [validationPhase, setValidationPhase] = useState<"running" | "done">("running");


  // Mutations
  const [createBatch, { isLoading: uploading }] = useCreateImportBatchMutation();
  const [validateBatch] = useValidateImportBatchMutation();
  const [startImport] = useStartImportBatchMutation();

  // Batch detail (steps 2-7)
  const { data: batchData, refetch: refetchBatch } = useGetImportBatchQuery(batchId!, {
    skip: !batchId,
    refetchOnMountOrArgChange: true,
  });
  const batch = unwrap<ImportBatch>(batchData);

  // Warn on browser refresh/tab close for steps 1-5 (before import commits)
  useEffect(() => {
    if (step >= 6) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [step]);

  const [uploadError, setUploadError] = useState(false);
  const [uploadErrorMsg, setUploadErrorMsg] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!templateId || !file) return;
    setUploadError(false);
    setUploadErrorMsg(null);
    const fd = new FormData();
    fd.append("template_id", String(templateId));
    fd.append("file", file);
    if (notes.trim()) fd.append("notes", notes.trim());
    try {
      const result = await createBatch(fd).unwrap();
      const newBatch = result.data;
      setBatchId(newBatch.id);
      toast.success(`File parsed: ${newBatch.total_rows} ${newBatch.total_rows === 1 ? "row" : "rows"}, ${newBatch.total_columns} ${newBatch.total_columns === 1 ? "column" : "columns"}`);
      setStep(2);
    } catch (err: unknown) {
      setUploadErrorMsg(extractUploadError(err));
      setUploadError(true);
    }
  };

  const handleValidate = async () => {
    if (!batchId) return;
    setValidationPhase("running");
    setStep(3);
    const minDisplay = new Promise<void>((r) => setTimeout(r, 2000));
    try {
      await Promise.all([validateBatch({ id: batchId }).unwrap(), minDisplay]);
      await refetchBatch();
    } catch {
      await Promise.all([refetchBatch(), minDisplay]);
    }
    setValidationPhase("done");
  };

  const handleStartImport = async () => {
    if (!batchId) return;
    setStep(6);
    try {
      const result = await startImport({ id: batchId, body: { run_async: true } }).unwrap();
      if (result.data.job_id) {
        setJobId(Number(result.data.job_id));
      }
    } catch {
      await refetchBatch();
    }
  };

  const handleReset = () => {
    setStep(1);
    setTemplateId(null);
    setFile(null);
    setNotes("");
    setBatchId(null);
    setJobId(null);
    setUploadError(false);
    setUploadErrorMsg(null);
  };

  return (
    <div className="space-y-5">
      <WizardStepper currentStep={step} />

      {step === 1 && (
        <UploadStep
          datasetType={datasetType}
          lockTemplate={lockTemplate}
          templateId={templateId}
          onTemplateChange={setTemplateId}
          file={file}
          onFileChange={setFile}
          notes={notes}
          onNotesChange={setNotes}
          onNext={handleUpload}
          onCancel={onCancel}
          uploading={uploading}
          uploadError={uploadError}
          uploadErrorMsg={uploadErrorMsg}
          onRetry={handleUpload}
        />
      )}

      {step === 2 && batch && (
        <HeaderReviewStep
          batch={batch}
          onBack={() => { setBatchId(null); setStep(1); }}
          onNext={handleValidate}
        />
      )}

      {step === 3 && (
        <ValidationStep phase={validationPhase} onComplete={() => setStep(4)} />
      )}

      {step === 4 && batch && (
        <ReviewIssuesStep
          batch={batch}
          batchId={batchId!}

          onBack={() => setStep(2)}
          onNext={() => setStep(5)}
          onCancel={onCancel}
        />
      )}

      {step === 5 && batch && (
        <ConfirmStep
          batch={batch}
          onBack={() => setStep(4)}
          onStart={handleStartImport}
          onCancel={onCancel}
        />
      )}

      {step === 6 && (
        <ImportProgressStep
          batchId={batchId!}
          jobId={jobId}
          onComplete={() => { refetchBatch(); setStep(7); }}
        />
      )}

      {step === 7 && batch && (
        <CompleteStep
          batch={batch}
          batchId={batchId!}
          jobId={jobId}
          onNewImport={handleReset}
          onViewDetails={onComplete}
          onReturn={onReturn}
          returnLabel={returnLabel}
        />
      )}
    </div>
  );
}
