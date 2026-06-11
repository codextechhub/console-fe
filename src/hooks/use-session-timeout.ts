import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import Cookies from "js-cookie";
import { resetAuth, setToken } from "@/redux/features/auth/authSlice";
import { routesPath } from "@/routes/routesPath";
import { refreshTokenSingleFlight } from "@/utils/tokenRefresh";
import { recordActivity } from "@/utils/sessionActivity";
import { endSession } from "@/utils/endSession";

const BASE_URL = import.meta.env.VITE_BACKEND_URL as string;

// Fire-and-forget: tells the backend to blacklist the current refresh token.
// Accepts explicit tokens so the call still works after cookies have been cleared.
// Intentionally not awaited — client-side logout proceeds regardless of outcome.
function revokeSessionOnBackend(tokens?: { access: string; refresh: string }): void {
  const access = tokens?.access ?? Cookies.get("token") ?? "";
  const refresh = tokens?.refresh ?? Cookies.get("refresh_token") ?? "";
  if (!refresh && !access) return;
  fetch(`${BASE_URL}/user/auth/logout/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access}`,
      accept: "application/json",
    },
    body: JSON.stringify({ refresh }),
  }).catch(() => {});
}

// Exported: the Authenticated gate derives its on-reload staleness window
// (IDLE_MS + WARNING_MS) from these so the two can never drift apart.
export const IDLE_MS = 5 * 60 * 1000;       // 5 minutes idle before warning
export const WARNING_MS = 10 * 60 * 1000;   // 10-minute countdown before expiry

const ACTIVITY_EVENTS = [
  "mousemove",
  "keydown",
  "click",
  "scroll",
  "touchstart",
  "wheel",
  "focus",
  "pointerdown",
] as const;

export function useSessionTimeout() {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_MS / 1000);
  const [isExpired, setIsExpired] = useState(false);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Timestamps tracked on refs so closures always read the latest value.
  // Initialised to 0 (not Date.now() — impure during render); the mount
  // effect's resetIdleTimer() call stamps it before anything reads it.
  const lastActivityRef = useRef<number>(0);
  const warningStartedAtRef = useRef<number | null>(null);
  const isWarningOpenRef = useRef(false);
  // Tokens captured the moment the session expires so goToLogin can still
  // call the backend blacklist even after cookies have been cleared.
  const capturedTokensRef = useRef<{ access: string; refresh: string } | null>(null);

  const clearCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const expireSession = useCallback(() => {
    clearCountdown();
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    // Capture tokens before clearing cookies so goToLogin can retry the
    // backend blacklist call even after the cookies are gone.
    capturedTokensRef.current = {
      access: Cookies.get("token") ?? "",
      refresh: Cookies.get("refresh_token") ?? "",
    };
    revokeSessionOnBackend(capturedTokensRef.current);
    endSession("Your session has expired due to inactivity. Please log in to continue.");
    dispatch(resetAuth());
    setOpen(false);
    setIsExpired(true);
  }, [dispatch]);

  const logout = useCallback(() => {
    clearCountdown();
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    revokeSessionOnBackend();
    endSession();
    dispatch(resetAuth());
    window.location.href = routesPath.AUTH.LOGIN;
  }, [dispatch]);

  // Starts (or resumes) the visible countdown from a given wall-clock start time.
  const startCountdown = useCallback(
    (warningStartedAt: number) => {
      warningStartedAtRef.current = warningStartedAt;
      isWarningOpenRef.current = true;
      setOpen(true);
      clearCountdown();

      // Tick every 500 ms but derive remaining time from the wall clock so
      // background throttling never causes drift.
      countdownRef.current = setInterval(() => {
        const elapsed = Date.now() - (warningStartedAtRef.current ?? Date.now());
        const remaining = Math.max(0, WARNING_MS - elapsed);
        setSecondsLeft(Math.ceil(remaining / 1000));
        if (remaining <= 0) expireSession();
      }, 500);
    },
    [expireSession],
  );

  const resetIdleTimer = useCallback(() => {
    if (isWarningOpenRef.current) return; // don't reset while warning is visible
    lastActivityRef.current = Date.now();
    recordActivity();
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => startCountdown(Date.now()), IDLE_MS);
  }, [startCountdown]);

  // When the tab becomes visible, check the actual wall-clock elapsed time
  // to catch up regardless of how long the tab was hidden.
  const checkOnVisibility = useCallback(() => {
    if (document.hidden) return;

    const now = Date.now();

    if (isWarningOpenRef.current && warningStartedAtRef.current) {
      // Warning was already open — just verify it hasn't expired while hidden.
      const warningElapsed = now - warningStartedAtRef.current;
      if (warningElapsed >= WARNING_MS) {
        expireSession();
      }
      return;
    }

    // Warning not open yet — check if idle threshold was crossed while hidden.
    const idleElapsed = now - lastActivityRef.current;
    if (idleElapsed >= IDLE_MS + WARNING_MS) {
      // Fully expired while away.
      expireSession();
    } else if (idleElapsed >= IDLE_MS) {
      // Crossed idle threshold while away — start countdown at the correct offset.
      const warningStartedAt = lastActivityRef.current + IDLE_MS;
      startCountdown(warningStartedAt);
    } else {
      // Returned before idle threshold — treat tab focus as activity so the
      // remaining carry-over time doesn't silently drain while the user works.
      resetIdleTimer();
    }
  }, [expireSession, startCountdown, resetIdleTimer]);

  // Wire up activity listeners. mousemove/scroll fire continuously, so the
  // timer reset is throttled — clearTimeout/setTimeout per event would churn
  // the event loop for no behavioural gain at this resolution.
  useEffect(() => {
    let lastReset = 0;
    const handleActivity = () => {
      const t = Date.now();
      if (t - lastReset < 1_000) return;
      lastReset = t;
      resetIdleTimer();
    };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, handleActivity));
    resetIdleTimer();
    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handleActivity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      clearCountdown();
    };
  }, [resetIdleTimer]);

  // Catch up when the tab regains focus.
  useEffect(() => {
    document.addEventListener("visibilitychange", checkOnVisibility);
    return () => document.removeEventListener("visibilitychange", checkOnVisibility);
  }, [checkOnVisibility]);

  const onContinue = useCallback(async () => {
    clearCountdown();

    const refreshToken = Cookies.get("refresh_token");
    if (!refreshToken) {
      window.location.href = routesPath.AUTH.LOGIN;
      return;
    }

    // Dismiss the modal immediately — don't wait for the network round-trip.
    warningStartedAtRef.current = null;
    isWarningOpenRef.current = false;
    setOpen(false);
    resetIdleTimer();

    const outcome = await refreshTokenSingleFlight();

    if (outcome.ok) {
      dispatch(setToken(outcome.access));
      return;
    }

    if (outcome.reason === "token_invalid") {
      logout();
      return;
    }
    // transient error — user stays signed in; next 401 will retry the refresh
  }, [dispatch, logout, resetIdleTimer]);

  const goToLogin = useCallback(() => {
    // Explicitly blacklist the session even though expireSession already tried —
    // this covers the case where the first call failed (transient network error).
    if (capturedTokensRef.current) {
      revokeSessionOnBackend(capturedTokensRef.current);
    }
    window.location.href = routesPath.AUTH.LOGIN;
  }, []);

  return { open, secondsLeft, isExpired, onContinue, onLogout: logout, goToLogin };
}
