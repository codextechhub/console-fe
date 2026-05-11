import { useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";

export function TopProgressBar() {
  const isActive = useSelector((state: any) => {
    const api = state.baseApi;
    if (!api) return false;
    return (
      Object.values(api.queries ?? {}).some((q: any) => q?.status === "pending") ||
      Object.values(api.mutations ?? {}).some((m: any) => m?.status === "pending")
    );
  });

  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const after = (ms: number, fn: () => void) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
  };

  useEffect(() => {
    if (isActive) {
      clear();
      setOpacity(1);
      setWidth(0);
      setVisible(true);
      // tiny delay so the 0% renders before the transition fires
      after(10, () => setWidth(85));
    } else if (visible) {
      clear();
      setWidth(100);
      after(300, () => setOpacity(0));
      after(700, () => { setVisible(false); setWidth(0); setOpacity(1); });
    }

    return clear;
  }, [isActive]);

  if (!visible) return null;

  const transition =
    width === 0   ? "none"
    : width === 100 ? "width 0.25s ease, opacity 0.35s ease"
    : "width 8s cubic-bezier(0.05, 0.5, 0.1, 1)";

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[3px]">
      <div
        style={{
          height: "100%",
          width: `${width}%`,
          opacity,
          backgroundColor: "var(--color-primary)",
          borderRadius: "0 2px 2px 0",
          transition,
        }}
      />
    </div>
  );
}
