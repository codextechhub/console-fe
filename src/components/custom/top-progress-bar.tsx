import { useSelector } from "react-redux";
import { useEffect, useState } from "react";

export function TopProgressBar() {
  const isActive = useSelector((state: any) => {
    const api = state.baseApi;
    if (!api) return false;
    const pendingQuery = Object.values(api.queries ?? {}).some((q: any) => q?.status === "pending");
    const pendingMutation = Object.values(api.mutations ?? {}).some((m: any) => m?.status === "pending");
    return pendingQuery || pendingMutation;
  });

  const [visible, setVisible] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (isActive) {
      setVisible(true);
      setCompleting(false);
    } else if (visible) {
      setCompleting(true);
      const t = setTimeout(() => {
        setVisible(false);
        setCompleting(false);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [isActive]);

  if (!visible) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[3px] overflow-hidden">
      <div className={completing ? "progress-complete" : "progress-indeterminate"} />
    </div>
  );
}
