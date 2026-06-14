// User-agent / device-label parsing for the Live Sessions page. Pure helpers,
// extracted so sessions.tsx stays focused on the page itself.
import { Laptop, Smartphone, Tablet } from "lucide-react";
import type { LoginSession } from "@/redux/services/dashboard/security-types";

export type DeviceType = "mobile" | "tablet" | "desktop";

export function parseUA(ua: string): { type: DeviceType; browser: string; os: string } {
  const type: DeviceType = /tablet|ipad/i.test(ua)
    ? "tablet"
    : /mobile|android.*mobile|iphone/i.test(ua)
    ? "mobile"
    : "desktop";

  const browser = /edg\//i.test(ua)
    ? "Edge"
    : /opr\//i.test(ua)
    ? "Opera"
    : /chrome\/[\d]+/i.test(ua)
    ? "Chrome"
    : /firefox\/[\d]+/i.test(ua)
    ? "Firefox"
    : /safari\/[\d]+/i.test(ua)
    ? "Safari"
    : "Browser";

  const os = /windows nt/i.test(ua)
    ? "Windows"
    : /mac os x/i.test(ua)
    ? "Mac OS"
    : /android/i.test(ua)
    ? "Android"
    : /iphone os|ios/i.test(ua)
    ? "iOS"
    : /linux/i.test(ua)
    ? "Linux"
    : "Unknown";

  return { type, browser, os };
}

export const DEVICE_ICONS: Record<DeviceType, React.ElementType> = {
  desktop: Laptop,
  mobile: Smartphone,
  tablet: Tablet,
};

export function formatAge(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h`;
}

export function deviceParts(s: LoginSession): { name: string; browser: string; deviceClass: DeviceType } {
  const label = s.device_label || "";

  // New backend format: "Browser: Chrome · OS: Mac OS · Class: desktop"
  const structured = label.match(/Browser:\s*([^·]+)\s*·\s*OS:\s*([^·]+)\s*·\s*Class:\s*(\w+)/i);
  if (structured) {
    const [, browser, rawOs, cls] = structured.map((v) => v.trim());
    const os = rawOs === "Mac OS" ? "Mac OS" : rawOs;
    const deviceClass: DeviceType =
      cls === "mobile" ? "mobile" : cls === "tablet" ? "tablet" : "desktop";
    return { name: os, browser, deviceClass };
  }

  // Legacy format: "Device · Browser"
  const sep = label.indexOf(" · ");
  if (sep >= 0) {
    const ua = parseUA(s.user_agent);
    return { name: label.slice(0, sep), browser: label.slice(sep + 3), deviceClass: ua.type };
  }

  // Fallback to raw UA
  const ua = parseUA(s.user_agent);
  return { name: label || "Unknown", browser: ua.browser, deviceClass: ua.type };
}
