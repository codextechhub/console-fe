import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import Cookies from "js-cookie";
import { resetAuth, setToken } from "@/redux/features/auth/authSlice";
import { clearStorageItem } from "./use-session-storage";
import { routesPath } from "@/routes/routesPath";

const IDLE_MS = 15 * 60 * 1000;      // 15 minutes idle before warning
const WARNING_MS = 1 * 60 * 1000;    // 1-minute countdown before expiry

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
  // Timestamps tracked on refs so closures always read the latest value.
  const lastActivityRef = useRef<number>(Date.now());
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
    Cookies.remove("token");
    Cookies.remove("refresh_token");
    clearStorageItem();
    dispatch(resetAuth());
    setOpen(false);
    setIsExpired(true);
  }, [dispatch]);

  const logout = useCallback(() => {
    clearCountdown();
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    Cookies.remove("token");
    Cookies.remove("refresh_token");
    clearStorageItem();
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
    }
  }, [expireSession, startCountdown]);

  // Wire up activity listeners.
  useEffect(() => {
    const handleActivity = () => resetIdleTimer();
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
