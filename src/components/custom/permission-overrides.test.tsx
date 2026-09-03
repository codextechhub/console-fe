/**
 * The security-critical test in this file is the FIRST one: a viewer without
 * platform.team_overrides.view/.manage must see no trace of the section AND
 * must fire no request. Everything else (read-only vs manage, render states,
 * drawer validation) hangs off that gate.
 */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import rootReducer from "@/redux/features/root-reducer";
import { baseApi } from "@/redux/services/base-api";
import { bindTenantStore } from "@/utils/tenant-context";
import PermissionOverrides, { contextLine, expiryLabel } from "./permission-overrides";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const VIEW_KEY = "platform.team_overrides.view";
const MANAGE_KEY = "platform.team_overrides.manage";

const ROW = {
  id: 7,
  user_id: "42",
  permission: "finance.invoice.create",
  permission_key: "finance.invoice.create",
  permission_description: "Raise an invoice",
  permission_sensitivity: "SENSITIVE",
  mode: "DENY",
  reason: "Under investigation by audit",
  expires_at: null,
  is_expired: false,
  granted_by_role: true,
  created_by_id: "1",
  created_by_name: "Ada Admin",
  created_at: "2026-07-20T10:00:00Z",
  updated_at: "2026-07-20T10:00:00Z",
};

const listPayload = (rows: unknown[]) => ({
  success: true,
  message: "ok",
  pagination: {
    currentPage: 1,
    pageSize: 50,
    totalItems: rows.length,
    totalPages: 1,
    next: null,
    previous: null,
  },
  data: rows,
});

let container: HTMLDivElement;
let root: Root;
let fetchSpy: ReturnType<typeof vi.fn>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function makeStore(permissions: string[]) {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefault) =>
      getDefault({ serializableCheck: false }).concat(baseApi.middleware),
    preloadedState: {
      auth: {
        access: "",
        refresh: "",
        session_id: 0,
        user: null,
        school: null,
        tenant: { slug: "codex", name: "Codex" },
        impersonation: null,
        permissions,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    },
  });
  bindTenantStore(store.getState);
  return store;
}

async function mount(permissions: string[], rows: unknown[] = [ROW]) {
  fetchSpy.mockResolvedValue(
    new Response(JSON.stringify(listPayload(rows)), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
  const store = makeStore(permissions);
  await act(async () => {
    root.render(
      <Provider store={store}>
        <PermissionOverrides userId="42" tenantSlug="codex" userName="Bola Staff" />
      </Provider>,
    );
  });
  return store;
}

/** URLs the component actually asked the network for. */
const requestedUrls = () =>
  fetchSpy.mock.calls.map((call) =>
    typeof call[0] === "string" ? call[0] : String((call[0] as Request)?.url ?? ""),
  );

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("PermissionOverrides visibility gate", () => {
  it("renders nothing and fires no request without the view key", async () => {
    await mount(["platform.team.view", "platform.schools.view"]);

    expect(container.innerHTML).toBe("");
    expect(container.textContent).not.toContain("Permission exceptions");
    // The crux: not merely hidden - never requested. A user looking at their
    // own profile must not be able to learn that exceptions exist from the
    // network tab either.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("renders nothing when the target's tenant slug could not be resolved", async () => {
    const store = makeStore([VIEW_KEY]);
    await act(async () => {
      root.render(
        <Provider store={store}>
          <PermissionOverrides userId="42" tenantSlug="" />
        </Provider>,
      );
    });
    expect(container.innerHTML).toBe("");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("renders the section and requests the target's overrides with the view key", async () => {
    await mount([VIEW_KEY]);

    expect(container.textContent).toContain("Permission exceptions");
    const urls = requestedUrls();
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain("/rbac/tenants/codex/users/42/permission-overrides/");
    expect(urls[0]).toContain("tenant=codex");
  });
});

describe("PermissionOverrides read-only vs manage", () => {
  it("offers no add button and no row actions without the manage key", async () => {
    await mount([VIEW_KEY]);

    expect(container.textContent).toContain("finance.invoice.create");
    expect(container.textContent).not.toContain("Add exception");
    expect(
      container.querySelector('[aria-label^="Lift exception"]'),
    ).toBeNull();
  });

  it("offers the add button and a lift action with the manage key", async () => {
    await mount([VIEW_KEY, MANAGE_KEY]);

    expect(container.textContent).toContain("Add exception");
    expect(
      container.querySelector('[aria-label="Lift exception on finance.invoice.create"]'),
    ).not.toBeNull();
  });
});

describe("PermissionOverrides render states", () => {
  it("shows ghost cards, announced once, while the list loads", async () => {
    // Never-resolving fetch keeps the query in its loading state.
    fetchSpy.mockReturnValue(new Promise(() => {}));
    const store = makeStore([VIEW_KEY]);
    await act(async () => {
      root.render(
        <Provider store={store}>
          <PermissionOverrides userId="42" tenantSlug="codex" />
        </Provider>,
      );
    });

    const ghosts = container.querySelectorAll('div[aria-hidden="true"]');
    expect(ghosts.length).toBe(3);
    const live = container.querySelectorAll('[role="status"]');
    expect(live).toHaveLength(1);
    expect(live[0].textContent).toBe("Loading permission exceptions…");
  });

  it("shows the roles-only empty state for an empty list", async () => {
    await mount([VIEW_KEY], []);
    expect(container.textContent).toContain(
      "No exceptions - access comes entirely from roles.",
    );
  });

  it("renders a populated row with mode badge, reason, setter and context", async () => {
    await mount([VIEW_KEY]);

    const text = container.textContent ?? "";
    expect(text).toContain("Denied");
    expect(text).toContain("Under investigation by audit");
    expect(text).toContain("Ada Admin");
    expect(text).toContain("A role grants this - it is denied for this user.");
    expect(text).toContain("No expiry");
  });

  it("marks an expired override and shows its countdown slot", async () => {
    await mount([VIEW_KEY], [
      { ...ROW, id: 8, expires_at: "2020-01-01T00:00:00Z", is_expired: true },
    ]);
    expect(container.textContent).toContain("Expired");
  });
});

describe("Add exception drawer", () => {
  it("blocks submission until a reason is given", async () => {
    await mount([VIEW_KEY, MANAGE_KEY]);

    const addButton = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Add exception"),
    );
    expect(addButton).toBeDefined();
    await act(async () => {
      addButton!.click();
    });

    // The sheet renders in a portal on document.body.
    const submit = Array.from(document.body.querySelectorAll("button")).find((b) =>
      b.textContent?.trim().startsWith("Apply exception"),
    );
    expect(submit).toBeDefined();

    const callsBefore = fetchSpy.mock.calls.length;
    await act(async () => {
      submit!.click();
    });

    expect(document.body.textContent).toContain("A reason is required.");
    expect(document.body.textContent).toContain("Choose a permission.");
    // Nothing was sent - validation is client-side before the mutation.
    expect(fetchSpy.mock.calls.length).toBe(callsBefore);
  });

  it("defaults the mode toggle to Deny", async () => {
    await mount([VIEW_KEY, MANAGE_KEY]);
    const addButton = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Add exception"),
    );
    await act(async () => {
      addButton!.click();
    });

    const pressed = Array.from(
      document.body.querySelectorAll('button[aria-pressed="true"]'),
    );
    expect(pressed).toHaveLength(1);
    expect(pressed[0].textContent).toContain("Denied");
  });
});

describe("override copy helpers", () => {
  const now = Date.parse("2026-07-26T12:00:00Z");

  it("reads a null expiry as no countdown", () => {
    expect(expiryLabel(null, now)).toBeNull();
  });

  it("counts down in minutes, hours and days", () => {
    expect(expiryLabel("2026-07-26T12:30:00Z", now)).toBe("Expires in 30 min");
    expect(expiryLabel("2026-07-27T12:00:00Z", now)).toBe("Expires in 24 hr");
    expect(expiryLabel("2026-08-05T12:00:00Z", now)).toBe("Expires in 10 days");
  });

  it("reports a past expiry as expired", () => {
    expect(expiryLabel("2026-07-25T12:00:00Z", now)).toBe("Expired");
  });

  it("distinguishes a real carve-out from a pre-emptive deny", () => {
    expect(contextLine({ mode: "DENY", granted_by_role: true })).toContain(
      "A role grants this",
    );
    expect(contextLine({ mode: "DENY", granted_by_role: false })).toContain(
      "pre-emptive",
    );
    expect(contextLine({ mode: "ALLOW", granted_by_role: false })).toContain(
      "only from this exception",
    );
  });
});
