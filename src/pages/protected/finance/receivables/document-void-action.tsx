import { useState } from "react";
import { Ban } from "lucide-react";
import { toast } from "sonner";

import { ConfirmActionModal } from "@/components/finance-ui";
import { Can } from "@/components/finance-ui/can";
import { Button } from "@/components/ui/button";
import { useVoidArDocumentMutation } from "@/redux/services/finance/ar-api";
import { DOCUMENT_VOID_CONFIG, type VoidableDocumentType } from "./document-void-config";

export function DocumentVoidAction({
  documentType,
  documentId,
  documentNumber,
  entity,
  onVoided,
  buttonText,
}: {
  documentType: VoidableDocumentType;
  documentId: number;
  documentNumber: string;
  entity: string;
  onVoided?: () => void;
  buttonText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [voidDocument, { isLoading }] = useVoidArDocumentMutation();
  const config = DOCUMENT_VOID_CONFIG[documentType];

  const confirm = async () => {
    try {
      const response = await voidDocument({
        resource: config.resource,
        id: documentId,
        entity,
      }).unwrap();
      toast.success(response.message || `${documentNumber} voided.`);
      setOpen(false);
      onVoided?.();
    } catch { /* handled centrally */ }
  };

  return (
    <>
      <Can permission={config.permission}>
        <Button
          variant="outline"
          disabled={isLoading}
          onClick={() => setOpen(true)}
          className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/5"
        >
          <Ban className="size-4" /> {buttonText ?? `Void ${config.label}`}
        </Button>
      </Can>
      <ConfirmActionModal
        open={open}
        onOpenChange={setOpen}
        title={`Void ${documentNumber}?`}
        description={`This ${config.effect} in one transaction. The original document and allocation rows remain in history for audit.`}
        confirmText={`Void ${config.label}`}
        destructive
        loading={isLoading}
        onConfirm={confirm}
      />
    </>
  );
}
