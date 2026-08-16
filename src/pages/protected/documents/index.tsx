// Documents - the requirements library. One row per document, not per file.
//
// The docs tree holds 42 .docx files, but they are 12 documents with history:
// the cross-module MRD (16 revisions) and 11 module FRDs. Listing all 42 would
// bury the current M23 spec under four near-identical filenames, so the table
// shows the current version of each document and the drawer reveals the rest.
//
// Ordering is flat: the MRD first because it spans every module, then the FRDs
// by module number. No folders and no domain grouping - with 12 rows a grouping
// is a thing to navigate rather than a thing that helps, and the module number
// is already the order the team refers to these documents in.
//
// Everything here downloads; nothing previews. A .docx cannot render in a
// browser tab anyway, and the backend sends Content-Disposition: attachment, so
// a click saves the file and the reader opens it beside the console.

import { useMemo, useState } from "react";
import { Download, FileText, Search } from "lucide-react";
import KpiCard from "@/components/custom/kpi-card";
import PageAccessDenied from "@/components/custom/page-access-denied";
import { DataTable, type Column } from "@/components/finance-ui/data-table";
import { DetailDrawer } from "@/components/finance-ui/detail-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { cn } from "@/lib/utils";
import { useGetRequirementsDocumentsQuery } from "@/redux/services/dashboard/documents-api";
import type { RequirementsDocument } from "@/redux/services/dashboard/documents-types";
import { formatBytes } from "@/utils/format-bytes";
import { errorStatus } from "@/utils/api-errors";
import { useDocumentDownload } from "./use-document-download";

const NUM = "font-geist-mono tabular-nums";

/** "M23" for a module spec, "All modules" for the cross-module tracker. */
function moduleLabel(doc: RequirementsDocument): string {
  return doc.module_number == null ? "All modules" : `M${String(doc.module_number).padStart(2, "0")}`;
}

/**
 * Free-text match over the fields a person actually types.
 *
 * Filtered in memory rather than over the wire: the whole library is 12 rows in
 * one response, so a request per keystroke would add latency to answer a
 * question the client can already answer.
 */
function matches(doc: RequirementsDocument, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    doc.title.toLowerCase().includes(q) ||
    doc.kind.toLowerCase().includes(q) ||
    moduleLabel(doc).toLowerCase().includes(q) ||
    doc.slug.includes(q)
  );
}

export default function DocumentsPage() {
  const { hasPermission } = usePermissions();
  const canView = hasPermission(P.VIEW_REQUIREMENTS_DOCS);

  const [query, setQuery] = useState("");
  const [openDoc, setOpenDoc] = useState<RequirementsDocument | null>(null);

  const { data, isLoading, isError, error, refetch } = useGetRequirementsDocumentsQuery(undefined, {
    skip: !canView,
  });

  const { save, busyKey } = useDocumentDownload();

  const documents = useMemo(() => data?.data.results ?? [], [data]);
  const visible = useMemo(() => documents.filter((d) => matches(d, query)), [documents, query]);

  // Counted from the whole library, not the filtered view - a KPI that moved
  // while you typed in the search box would be reporting on your search rather
  // than on the library.
  const moduleSpecs = documents.filter((d) => d.kind === "FRD").length;
  const totalFiles = documents.reduce((sum, d) => sum + d.version_count, 0);

  const forbidden = errorStatus(error) === 403;
  if (!canView) return <PageAccessDenied />;

  const columns: Column<RequirementsDocument>[] = [
    {
      header: "Document",
      cell: (doc) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-black-01">{doc.title}</p>
          <p className={cn(NUM, "mt-0.5 truncate text-xs font-normal text-gray-06-text")}>
            {doc.kind} · {doc.version_count === 1 ? "1 version" : `${doc.version_count} versions`}
          </p>
        </div>
      ),
    },
    { header: "Module", cell: (doc) => <span className={NUM}>{moduleLabel(doc)}</span> },
    {
      header: "Current",
      cell: (doc) => <span className={NUM}>v{doc.current_version}</span>,
    },
    {
      header: "Size",
      align: "right",
      cell: (doc) => <span className={NUM}>{formatBytes(doc.current_size_bytes)}</span>,
    },
    {
      header: "",
      align: "right",
      cell: (doc) => (
        <Button
          variant="ghost"
          size="sm"
          loading={busyKey === doc.slug}
          onClick={(e) => {
            e.stopPropagation();
            save(doc);
          }}
          className="font-mont"
        >
          Download
        </Button>
      ),
    },
  ];

  return (
    <main className="min-w-0 px-4.5 py-6 space-y-5 text-black-01">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold font-mont text-gray-01">Documents</p>
          <p className="mt-0.5 text-xs text-gray-01">
            Product requirements for the platform - the cross-module MRD and the module FRDs.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-03" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or module"
            aria-label="Search documents"
            className="h-9 pl-8"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard label="Documents" value={documents.length} foot="MRD plus module specs" />
        <KpiCard label="Modules covered" value={moduleSpecs} foot="one FRD each" />
        <KpiCard
          label="Files available"
          value={totalFiles}
          foot="every version, current and past"
        />
      </div>

      <DataTable
        columns={columns}
        rows={visible}
        rowKey={(doc) => doc.slug}
        loading={isLoading}
        error={isError}
        forbidden={forbidden}
        onRetry={refetch}
        onRowClick={(doc) => setOpenDoc(doc)}
        // Cards through tablet, not just phone. Five columns plus the expanded
        // sidebar leaves too little room at ~820px: the table stays inside its
        // own scroller so the page never overflows, but the Download action ends
        // up clipped off the right edge, which reads as broken rather than as
        // scrollable.
        cardBreakpoint="lg"
        emptyTitle={query ? "No matching documents" : "No documents published"}
        emptyMessage={
          query
            ? "Nothing here matches that search. Clear it to see the whole library."
            : "The requirements library is empty. Documents are published from the backend repository."
        }
        forbiddenMessage="You do not have access to the requirements library."
      />

      <DetailDrawer
        open={openDoc !== null}
        onOpenChange={(open) => !open && setOpenDoc(null)}
        title={openDoc?.title ?? ""}
        description={
          openDoc
            ? `${openDoc.kind} · ${moduleLabel(openDoc)} · current v${openDoc.current_version}`
            : undefined
        }
        typeface="app"
      >
        {openDoc && (
          <div className="space-y-4 px-5 py-4">
            <div>
              <p className="font-mont text-[11px] text-gray-05">Version history</p>
              <p className="mt-0.5 text-xs text-gray-01">
                Newest first. Every revision is kept, so an older version can be pulled up when a
                decision needs to be traced back to what was written at the time.
              </p>
            </div>

            <ul className="divide-y divide-gray-03 border-y border-gray-03">
              {openDoc.versions.map((version, index) => (
                <li
                  key={version.version}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <FileText className="size-4 shrink-0 text-gray-03" />
                    <div className="min-w-0">
                      <p className="font-mont text-sm font-semibold text-black-01">
                        <span className={NUM}>v{version.version}</span>
                        {index === 0 && (
                          <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                            Current
                          </span>
                        )}
                      </p>
                      <p className={cn(NUM, "mt-0.5 truncate text-[11px] text-gray-06-text")}>
                        {formatBytes(version.size_bytes)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={busyKey === `${openDoc.slug}@${version.version}`}
                    onClick={() => save(openDoc, version.version)}
                    className="font-mont"
                  >
                    <Download className="size-3.5" />
                    Download
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DetailDrawer>
    </main>
  );
}
