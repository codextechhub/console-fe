import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import Cookies from "js-cookie";
import { resetAuth, setToken } from "@/redux/features/auth/authSlice";
import { clearStorageItem } from "./use-session-storage";
import { routesPath } from "@/routes/routesPath";

const IDLE_MS    = 13 * 60 * 1000; // 13 min idle before warning
const WARNING_MS =  2 * 60 * 1000; // 2 min countdown before expiry

// sessionStorage keys — survive page refreshes within the same tab
const SK_ACTIVITY = "_sta"; // last user activity timestamp (ms)
const SK_WARNING  = "_stw"; // warning countdown start timestamp (ms)
const SK_EXPIRED  = "_stx"; // set by useTokenRefresh when refresh token is also dead

const ACTIVITY_EVENTS = [
  "mousemove",
  "keydown",
  "click",
  "scroll",
  "touchstart",
  "wheel",
] as const;

export function useSessionTimeout() {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_MS / 1000);
  const [isExpired, setIsExpired] = useState(false);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialise from sessionStorage so a page refresh picks up where we left off.
  const lastActivityRef = useRef<number>(
    Number(sessionStorage.getItem(SK_ACTIVITY)) || Date.now(),
  );
  const warningStartedAtRef = useRef<number | null>(null);
  const isWarningOpenRef = useRef(false);

  const baseUrl = import.meta.env.VITE_BACKEND_URL;

  const clearCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const expireSession = useCallback(() => {
    clearCountdown();
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    // clearStorageItem wipes all sessionStorage including SK_* keys
    clearStorageItem();
    Cookies.remove("token");
    Cookies.remove("refresh_token");
    dispatch(resetAuth());
    setOpen(false);
    setIsExpired(true);
  }, [dispatch]);

  const startCountdown = useCallback(
    (warningStartedAt: number) => {
      warningStartedAtRef.current = warningStartedAt;
      isWarningOpenRef.current = true;
      // Persist so a refresh during the countdown can resume, not restart.
      sessionStorage.setItem(SK_WARNING, String(warningStartedAt));
      setOpen(true);
      clearCountdown();

      // Derive remaining time from the wall clock every 500 ms to avoid drift.
      countdownRef.current = setInterval(() => {
        const elapsed = Date.now() - (warningStartedAtRef.current ?? Date.now());
        const remaining = Math.max(0, WARNING_MS - elapsed);
        setSecondsLeft(Math.ceil(remaining / 1000));
        if (remaining <= 0) expireSession();
      }, 500);
    },
    [expireSession],
  );

  // Evaluates how long the user has been idle and takes the right action.
  // Used on mount (for recovery) and on tab-visibility change (to catch up).
  const scheduleIdleCheck = useCallback(() => {
    // Warning already showing — just check if it expired while the tab was hidden.
    if (isWarningOpenRef.current) {
      const warningElapsed = Date.now() - (warningStartedAtRef.current ?? Date.now());
      if (warningElapsed >= WARNING_MS) expireSession();
      return;
    }

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    const elapsed = Date.now() - lastActivityRef.current;
    if (elapsed >= IDLE_MS + WARNING_MS) {
      // Fully expired while away.
      expireSession();
    } else if (elapsed >= IDLE_MS) {
      // Crossed the idle threshold — start countdown at the correct wall-clock offset.
      startCountdown(lastActivityRef.current + IDLE_MS);
    } else {
      // Still within idle window — schedule for the remaining time.
      const remaining = IDLE_MS - elapsed;
      idleTimerRef.current = setTimeout(() => startCountdown(Date.now()), remaining);
    }
  }, [expireSession, startCountdown]);

  const resetIdleTimer = useCallback(() => {
    if (isWarningOpenRef.current) return; // never reset while the warning is visible
    const now = Date.now();
    lastActivityRef.current = now;
    sessionStorage.setItem(SK_ACTIVITY, String(now));
    scheduleIdleCheck();
  }, [scheduleIdleCheck]);

  const logout = useCallback(() => {
    clearCountdown();
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    clearStorageItem();
    Cookies.remove("token");
    Cookies.remove("refresh_token");
    dispatch(resetAuth());
    window.location.href = routesPath.AUTH.LOGIN;
  }, [dispatch]);

  // Wire up activity listeners.
  // NOTE: initial scheduling is handled by the mount-recovery effect below —
  // do not call resetIdleTimer() here or it overwrites the recovered timestamp.
  useEffect(() => {
    const handleActivity = () => resetIdleTimer();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, handleActivity));
    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handleActivity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      clearCountdown();
    };
  }, [resetIdleTimer]);

  // Catch up when the tab regains visibility.
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) scheduleIdleCheck();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [scheduleIdleCheck]);

  // Mount recovery — restore session state from sessionStorage.
  // This is what prevents an abrupt logout when the user refreshes the page.
  useEffect(() => {
    // useTokenRefresh sets SK_EXPIRED when the refresh token itself has died.
    if (sessionStorage.getItem(SK_EXPIRED)) {
      expireSession();
      return;
    }

    const rawWarning = sessionStorage.getItem(SK_WARNING);
    if (rawWarning) {
      // The warning dialog was open when the page was refreshed — resume it.
      const warningStartedAt = Number(rawWarning);
      const warningElapsed = Date.now() - warningStartedAt;
      if (warningElapsed >= WARNING_MS) {
        expireSession();
      } else {
        startCountdown(warningStartedAt);
      }
      return;
    }

    // No stored warning — schedule based on the recovered (or fresh) lastActivityRef.
    scheduleIdleCheck();
  }, [expireSession, startCountdown, scheduleIdleCheck]);

  const onContinue = useCallback(async () => {
    const refreshToken = Cookies.get("refresh_token");
    if (!refreshToken) {
      logout();
      return;
    }

    try {
      const res = await fetch(`${baseUrl}/user/auth/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const newAccess = data?.data?.access;
      if (!newAccess) throw new Error();
      Cookies.set("token", newAccess);
      dispatch(setToken(newAccess));
    } catch {
      logout();
      return;
    }

    clearCountdown();
    sessionStorage.removeItem(SK_WARNING);
    warningStartedAtRef.current = null;
    isWarningOpenRef.current = false;
    setOpen(false);
    resetIdleTimer();
  }, [baseUrl, dispatch, logout, resetIdleTimer]);

  const goToLogin = useCallback(() => {
    window.location.href = routesPath.AUTH.LOGIN;
  }, []);

  return { open, secondsLeft, isExpired, onContinue, onLogout: logout, goToLogin };
}
