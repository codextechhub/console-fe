/**
 * In-console reader for a requirements document.
 *
 * Browsers cannot display a .docx, so the file is fetched with the signed-in
 * session (the same request Download makes) and drawn as HTML by `docx-preview`.
 * Everything happens in the browser: the bytes never go to a third-party viewer,
 * which matters because these are unreleased product specs.
 *
 * `docx-preview` is imported on first open rather than with the page, so the
 * library costs nothing to anyone who only lists or downloads documents.
 *
 * The preview is faithful to content (headings, tables, lists, images) but it is
 * not Word: page breaks, headers and footers can land differently. The Download
 * button in the header saves the exact file, from the bytes already fetched for
 * the preview rather than a second request.
 *
 * The object URL holding those bytes lives exactly as long as the document is on
 * screen: it is revoked when the viewer closes, retries, or switches document,
 * including when that happens before the fetch has finished.
 *
 * On narrow screens the document reflows to the viewer's width instead of
 * keeping the fixed A4 page, so a phone reads it without sideways scrolling.
 * Wide tables inside it scroll within the viewer, never the page.
 */

import { useEffect, useRef, useState } from "react";
import { Download, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useDownloadRequirementsDocumentMutation } from "@/redux/services/dashboard/documents-api";
import type { RequirementsDocument } from "@/redux/services/dashboard/documents-types";
import { apiErrorMessage } from "@/utils/api-errors";
import { formatBytes } from "@/utils/format-bytes";
import { documentFilename, saveObjectUrl } from "./use-document-download";

/** A document plus the version to show; no version means the current one. */
export interface ViewerTarget {
  doc: RequirementsDocument;
  version?: string;
}

interface DocumentViewerProps {
  target: ViewerTarget | null;
  onClose: () => void;
}

/** Below this container width the document reflows instead of keeping A4 pages. */
const REFLOW_BELOW_PX = 820;

type ViewerState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; message: string };

export function DocumentViewer({ target, onClose }: DocumentViewerProps) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="flex h-dvh max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-[90dvh] sm:max-w-5xl sm:rounded-lg"
      >
        {target && (
          <ViewerBody
            key={`${target.doc.slug}@${target.version ?? "current"}`}
            target={target}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ViewerBody({ target }: { target: ViewerTarget }) {
  const { doc, version } = target;
  const shown = version ? doc.versions.find((v) => v.version === version) : doc.versions[0];

  const [download] = useDownloadRequirementsDocumentMutation();
  const bodyRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<ViewerState>({ status: "loading" });
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const body = bodyRef.current;
    const styles = styleRef.current;
    let cancelled = false;
    let ownedUrl: string | null = null;
    setState({ status: "loading" });
    setFileUrl(null);

    (async () => {
      try {
        const [url, docx] = await Promise.all([
          download({ slug: doc.slug, version }).unwrap(),
          import("docx-preview"),
        ]);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        ownedUrl = url;
        setFileUrl(url);

        const blob = await (await fetch(url)).blob();
        if (cancelled || !body) return;

        const reflow = body.clientWidth < REFLOW_BELOW_PX;
        await docx.renderAsync(blob, body, styles ?? undefined, {
          className: "docx",
          inWrapper: true,
          ignoreWidth: reflow,
          ignoreHeight: reflow,
          breakPages: !reflow,
          // Inline images as data URLs: blob URLs would outlive the viewer.
          useBase64URL: true,
          renderChanges: false,
          renderComments: false,
        });
        if (!cancelled) setState({ status: "ready" });
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message: apiErrorMessage(error, "This document could not be displayed."),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
      if (ownedUrl) URL.revokeObjectURL(ownedUrl);
      body?.replaceChildren();
      styles?.replaceChildren();
    };
  }, [download, doc.slug, version, attempt]);

  const meta = [doc.kind, shown ? `v${shown.version}` : null, shown ? formatBytes(shown.size_bytes) : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <DialogHeader className="flex-row flex-wrap items-center justify-between gap-3 border-b border-white-02 py-3 pr-14 pl-4 text-left sm:pl-5">
        <div className="min-w-0 flex-1">
          <DialogTitle className="truncate font-mont text-sm font-semibold text-black-01">
            {doc.title}
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-gray-06-text">
            <span className="font-geist-mono tabular-nums">{meta}</span>
            <span className="hidden sm:inline">{" · Preview. Download for the exact Word layout."}</span>
          </DialogDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!fileUrl}
          onClick={() => fileUrl && saveObjectUrl(fileUrl, documentFilename(doc, version))}
          className="font-mont"
        >
          <Download className="size-3.5" />
          Download
        </Button>
      </DialogHeader>

      <div className="relative min-h-0 flex-1 overflow-auto bg-[#f3f4f6]">
        <div ref={styleRef} hidden />
        <div
          ref={bodyRef}
          aria-label={`${doc.title} preview`}
          aria-busy={state.status === "loading"}
          className={cn(
            // Soften the library's grey page backdrop and tighten it on phones.
            "[&_.docx-wrapper]:bg-transparent! [&_.docx-wrapper]:p-2! sm:[&_.docx-wrapper]:p-6!",
            // Safe centring: an over-wide page must overflow rightward, where it can be scrolled to.
            "[&_.docx-wrapper]:[align-items:safe_center]!",
            "[&_img]:h-auto [&_img]:max-w-full",
            "[&_section.docx]:shadow-sm! [&_section.docx]:mb-4!",
            // Reflowed on a phone, Word's page margins would eat half the screen.
            "max-sm:[&_section.docx]:px-4! max-sm:[&_section.docx]:py-5!",
            // Fixed-width Word tables would stretch the page past the screen; fit them instead.
            "max-sm:[&_section.docx]:w-full! max-sm:[&_table]:w-full! max-sm:[&_table]:table-auto!",
            "max-sm:[&_col]:w-auto! max-sm:[&_td]:[overflow-wrap:anywhere]",
            state.status !== "ready" && "invisible",
          )}
        />

        {state.status === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-xs text-gray-06-text">
            <span className="size-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
            Opening document...
          </div>
        )}

        {state.status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm font-semibold text-black-01">The preview could not be shown</p>
            <p className="max-w-sm text-xs text-gray-01">{state.message}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAttempt((n) => n + 1)}
                className="font-mont"
              >
                <RotateCw className="size-3.5" />
                Try again
              </Button>
              {fileUrl && (
                <Button
                  size="sm"
                  onClick={() => saveObjectUrl(fileUrl, documentFilename(doc, version))}
                  className="font-mont"
                >
                  <Download className="size-3.5" />
                  Download instead
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
