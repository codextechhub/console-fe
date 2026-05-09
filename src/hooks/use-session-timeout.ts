import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import Cookies from "js-cookie";
import { resetAuth, setToken } from "@/redux/features/auth/authSlice";
import { clearStorageItem } from "./use-session-storage";
import { routesPath } from "@/routes/routesPath";

const IDLE_MS = 15 * 60 * 1000; // 15 minutes of inactivity
const WARNING_SECONDS = 5 * 60; // 5-minute countdown before auto-logout

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
  const [secondsLeft, setSecondsLeft] = useState(WARNING_SECONDS);
  const [isExpired, setIsExpired] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const openRef = useRef(false); // mirrors `open` without triggering effect re-runs
  const baseUrl = import.meta.env.VITE_BACKEND_URL;

  const clearCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  // Clears auth state but stays on the page — user must click to go to login.
  const expireSession = useCallback(() => {
    clearCountdown();
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    Cookies.remove("token");
    Cookies.remove("refresh_token");
    clearStorageItem();
    dispatch(resetAuth());
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

  // Starts the idle timeout. When it fires, opens the modal and begins the countdown.
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      openRef.current = true;
      setOpen(true);
      setSecondsLeft(WARNING_SECONDS);
      clearCountdown();
      countdownRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            expireSession();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }, IDLE_MS);
  }, [logout]);

  // Wire up activity listeners once on mount. Only reset idle timer when modal is hidden.
  useEffect(() => {
    const handleActivity = () => {
      if (!openRef.current) resetIdleTimer();
    };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, handleActivity));
    resetIdleTimer();
    return () => {
      ACTIVITY_EVENTS.forEach((e) =>
        window.removeEventListener(e, handleActivity),
      );
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      clearCountdown();
    };
  }, [resetIdleTimer]);

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
    openRef.current = false;
    setOpen(false);
    resetIdleTimer();
  }, [baseUrl, dispatch, logout, resetIdleTimer]);

  const goToLogin = useCallback(() => {
    window.location.href = routesPath.AUTH.LOGIN;
  }, []);

  return { open, secondsLeft, isExpired, onContinue, onLogout: logout, goToLogin };
}
