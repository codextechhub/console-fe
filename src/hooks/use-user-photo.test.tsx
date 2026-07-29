import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { skipToken } from "@reduxjs/toolkit/query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mediaMocks = vi.hoisted(() => ({
  useGetStaffPhotosQuery: vi.fn(),
  useFetchAuthMediaQuery: vi.fn(),
}));

vi.mock("@/redux/services/media-api", () => mediaMocks);

import { useUserPhoto } from "./use-user-photo";

let container: HTMLDivElement;
let root: Root;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function PhotoProbe({ userId }: { userId: number }) {
  const photo = useUserPhoto(userId);
  return <span data-testid="photo">{photo ?? "initials"}</span>;
}

async function render(userId: number) {
  await act(async () => {
    root.render(<PhotoProbe userId={userId} />);
  });
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  mediaMocks.useGetStaffPhotosQuery.mockReturnValue({
    currentData: {
      "1": "https://test.local/media/actor.jpg",
      "2": "https://test.local/media/target.jpg",
    },
  });
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.clearAllMocks();
});

describe("useUserPhoto identity changes", () => {
  it("does not reuse the prior user's blob while the next photo loads", async () => {
    mediaMocks.useFetchAuthMediaQuery.mockImplementation((photoUrl) => {
      if (photoUrl === "https://test.local/media/actor.jpg") {
        return { data: "blob:actor", currentData: "blob:actor" };
      }
      return {
        // RTK Query's `data` retains the last successful arg here. The hook
        // must ignore it until this URL has its own result.
        data: "blob:actor",
        currentData: undefined,
      };
    });

    await render(1);
    expect(container.textContent).toBe("blob:actor");

    await render(2);
    expect(container.textContent).toBe("initials");
    expect(mediaMocks.useFetchAuthMediaQuery).toHaveBeenLastCalledWith(
      "https://test.local/media/target.jpg",
    );
  });

  it("falls back to initials when the next user has no photo", async () => {
    mediaMocks.useFetchAuthMediaQuery.mockImplementation((photoUrl) => {
      if (photoUrl === "https://test.local/media/actor.jpg") {
        return { data: "blob:actor", currentData: "blob:actor" };
      }
      return { data: "blob:actor", currentData: undefined };
    });

    await render(1);
    expect(container.textContent).toBe("blob:actor");

    await render(3);
    expect(container.textContent).toBe("initials");
    expect(mediaMocks.useFetchAuthMediaQuery).toHaveBeenLastCalledWith(skipToken);
  });

  it("renders the next user's blob once that URL resolves", async () => {
    mediaMocks.useFetchAuthMediaQuery.mockImplementation((photoUrl) => ({
      data: photoUrl === "https://test.local/media/target.jpg"
        ? "blob:target"
        : "blob:actor",
      currentData: photoUrl === "https://test.local/media/target.jpg"
        ? "blob:target"
        : "blob:actor",
    }));

    await render(2);
    expect(container.textContent).toBe("blob:target");
  });
});
