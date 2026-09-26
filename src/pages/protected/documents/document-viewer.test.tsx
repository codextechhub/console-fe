import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RequirementsDocument } from "@/redux/services/dashboard/documents-types";

const mocks = vi.hoisted(() => ({
  download: vi.fn(),
  renderAsync: vi.fn(),
}));

vi.mock("@/redux/services/dashboard/documents-api", () => ({
  useDownloadRequirementsDocumentMutation: () => [mocks.download],
}));

vi.mock("docx-preview", () => ({ renderAsync: mocks.renderAsync }));

import { DocumentViewer, type ViewerTarget } from "./document-viewer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const DOC: RequirementsDocument = {
  slug: "m23-procurement",
  title: "M23 Procurement FRD",
  kind: "FRD",
  module_number: 23,
  current_version: "2.3",
  current_size_bytes: 480_000,
  version_count: 2,
  versions: [
    { version: "2.3", filename: "M23_FRD_v2.3.docx", size_bytes: 480_000 },
    { version: "2.2", filename: "M23_FRD_v2.2.docx", size_bytes: 470_000 },
  ],
};

let container: HTMLDivElement;
let root: Root;
let revoke: ReturnType<typeof vi.spyOn>;

/** Resolves on demand, so a test can close the viewer while the fetch is in flight. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function render(target: ViewerTarget | null) {
  await act(async () => {
    root.render(<DocumentViewer target={target} onClose={() => undefined} />);
  });
}

async function flush() {
  await act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  });
}

function downloadButton(): HTMLButtonElement | undefined {
  return Array.from(document.querySelectorAll("button")).find(
    (b) => b.textContent?.trim() === "Download",
  );
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ blob: async () => new Blob(["docx"]) })),
  );
  mocks.renderAsync.mockImplementation(async (_blob, body: HTMLElement) => {
    body.innerHTML = "<section class='docx'>Rendered spec</section>";
  });
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  mocks.download.mockReset();
  mocks.renderAsync.mockReset();
});

describe("DocumentViewer", () => {
  it("renders the requested version and frees its bytes when closed", async () => {
    mocks.download.mockReturnValue({ unwrap: async () => "blob:m23-v2.2" });

    await render({ doc: DOC, version: "2.2" });
    await flush();

    expect(mocks.download).toHaveBeenCalledWith({ slug: "m23-procurement", version: "2.2" });
    expect(document.body.textContent).toContain("Rendered spec");
    expect(downloadButton()?.disabled).toBe(false);

    await render(null);
    expect(revoke).toHaveBeenCalledWith("blob:m23-v2.2");
  });

  it("discards a file that arrives after the viewer has closed", async () => {
    const pending = deferred<string>();
    mocks.download.mockReturnValue({ unwrap: () => pending.promise });

    await render({ doc: DOC });
    await render(null);

    pending.resolve("blob:late");
    await flush();

    expect(revoke).toHaveBeenCalledWith("blob:late");
    expect(mocks.renderAsync).not.toHaveBeenCalled();
  });

  it("renders a reopened document even when the first open is still loading", async () => {
    const first = deferred<string>();
    mocks.download
      .mockReturnValueOnce({ unwrap: () => first.promise })
      .mockReturnValueOnce({ unwrap: async () => "blob:second" });

    await render({ doc: DOC });
    await render(null);
    await render({ doc: DOC });
    first.resolve("blob:first");
    await flush();

    expect(revoke).toHaveBeenCalledWith("blob:first");
    expect(revoke).not.toHaveBeenCalledWith("blob:second");
    expect(document.body.textContent).toContain("Rendered spec");
  });

  it("offers a retry when the preview fails, and the retry fetches again", async () => {
    mocks.download.mockReturnValue({ unwrap: async () => "blob:m23" });
    mocks.renderAsync.mockRejectedValueOnce(new Error("Corrupt file"));

    await render({ doc: DOC });
    await flush();

    expect(document.body.textContent).toContain("The preview could not be shown");
    const retry = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Try again"),
    );
    expect(retry).toBeDefined();

    await act(async () => retry!.click());
    await flush();

    expect(mocks.download).toHaveBeenCalledTimes(2);
    expect(revoke).toHaveBeenCalledWith("blob:m23");
    expect(document.body.textContent).toContain("Rendered spec");
  });
});
