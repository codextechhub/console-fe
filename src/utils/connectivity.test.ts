import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import {
  bindConnectivityReconnect,
  getConnectivityStatus,
  reportGatewayFailure,
  reportRequestSuccess,
  reportTransportFailure,
  resetConnectivityForTests,
  startConnectivityMonitor,
  subscribeToConnectivity,
} from "./connectivity";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// VITE_BACKEND_URL is http://test.local/v1 under vitest (see vitest.config.ts),
// so probe URLs are told apart by host: anything else is the app's own origin.
const API_HOST = "test.local";

type Reachability = { origin: boolean; api: boolean };

const mockProbes = ({ origin, api }: Reachability) => {
  const fetchMock = vi.fn(async (input: string | URL) => {
    const url = String(input);
    const reachable = url.includes(API_HOST) ? api : origin;
    if (!reachable) throw new TypeError("Failed to fetch");
    return new Response(null, { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const setOnLine = (value: boolean) => {
  Object.defineProperty(window.navigator, "onLine", {
    value,
    configurable: true,
  });
};

beforeEach(() => {
  setOnLine(true);
  mockProbes({ origin: true, api: true });
});

afterEach(() => {
  resetConnectivityForTests();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("connectivity classification", () => {
  it("blames the connection when the app's own origin is unreachable", async () => {
    mockProbes({ origin: false, api: false });

    reportTransportFailure();
    await vi.waitFor(() => expect(getConnectivityStatus()).toBe("offline"));
  });

  it("blames the server when the app's origin answers but the API does not", async () => {
    mockProbes({ origin: true, api: false });

    reportTransportFailure();
    await vi.waitFor(() =>
      expect(getConnectivityStatus()).toBe("server-unreachable"),
    );
  });

  it("treats a lone failure with both hosts reachable as a blip, not a state", async () => {
    reportTransportFailure();

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledOnce());
    expect(getConnectivityStatus()).toBe("online");
  });

  it("stays quiet on a blip for callers that own their error UI", async () => {
    const fetchMock = mockProbes({ origin: true, api: true });

    reportTransportFailure({ notifyOnBlip: false });

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(toast.error).not.toHaveBeenCalled();
    expect(getConnectivityStatus()).toBe("online");
  });

  it("trusts navigator.onLine over the probes, so loopback cannot mask an outage", async () => {
    // Local dev: the origin probe hits loopback and answers happily even with
    // the Wi-Fi switched off.
    setOnLine(false);
    const fetchMock = mockProbes({ origin: true, api: true });

    reportTransportFailure();

    await vi.waitFor(() => expect(getConnectivityStatus()).toBe("offline"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("runs one pair of probes for a burst of parallel failures", async () => {
    const fetchMock = mockProbes({ origin: true, api: false });

    reportTransportFailure();
    reportTransportFailure();
    reportTransportFailure();

    await vi.waitFor(() =>
      expect(getConnectivityStatus()).toBe("server-unreachable"),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("connectivity reports from the API layer", () => {
  it("needs no probe to know a gateway status means the server is down", () => {
    reportGatewayFailure();
    expect(getConnectivityStatus()).toBe("server-unreachable");
  });

  it("recovers on the first completed request and refetches what is on screen", () => {
    const reconnect = vi.fn();
    bindConnectivityReconnect(reconnect);
    reportGatewayFailure();

    reportRequestSuccess();

    expect(getConnectivityStatus()).toBe("online");
    expect(reconnect).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledOnce();
  });

  it("does not announce a recovery that never followed an outage", () => {
    reportRequestSuccess();

    expect(getConnectivityStatus()).toBe("online");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("notifies subscribers only when the state actually changes", () => {
    const listener = vi.fn();
    subscribeToConnectivity(listener);

    reportGatewayFailure();
    reportGatewayFailure();

    expect(listener).toHaveBeenCalledOnce();
  });
});

describe("connectivity monitor lifecycle", () => {
  it("goes offline on the browser event without waiting for a probe", () => {
    startConnectivityMonitor();

    window.dispatchEvent(new Event("offline"));

    expect(getConnectivityStatus()).toBe("offline");
  });

  it("verifies the browser's online event instead of trusting it", async () => {
    startConnectivityMonitor();
    window.dispatchEvent(new Event("offline"));
    expect(getConnectivityStatus()).toBe("offline");

    // A captive portal: the link is back, the API still is not.
    mockProbes({ origin: true, api: false });
    window.dispatchEvent(new Event("online"));

    await vi.waitFor(() =>
      expect(getConnectivityStatus()).toBe("server-unreachable"),
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("starts offline when the browser is already offline at boot", () => {
    setOnLine(false);

    startConnectivityMonitor();

    expect(getConnectivityStatus()).toBe("offline");
  });
});
