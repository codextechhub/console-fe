import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppSidebar } from "../app-sidebar";
import { ChevronLeft, ChevronRight, ChevronDown, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useNavigate } from "react-router";
import { useAppSelector } from "@/redux/store";
import { returnInitial } from "@/utils/helpers";
import { useTokenRefresh } from "@/hooks/use-token-refresh";
import { useSessionTimeout } from "@/hooks/use-session-timeout";
import { SessionTimeoutModal } from "@/components/session-timeout-modal";
import { TopProgressBar } from "@/components/custom/top-progress-bar";
import { NotificationsBell } from "@/components/custom/notifications-bell";
import { useLogout } from "@/hooks/use-logout";
import useToggleModal from "@/hooks/use-toggle";
import PromptModal from "@/components/modal/prompt-modal";
import { routesPath } from "@/routes/routesPath";

// Self-hosted Google Noto animated emojis (public/emoji/*.webp). The artwork
// itself moves — the clap claps, the wave waves — because the WebP is an
// animated, looping image.
const GREETING_EMOJIS = [
  "wave",
  "clap",
  "party",
  "raising-hands",
  "sparkles",
  "star",
  "hug",
  "smile",
  "fire",
] as const;

// Picked once per login session and persisted, so it stays put on refresh but
// shuffles to a new one the next time the user signs in (a fresh session has no
// stored key yet).
function pickSessionEmoji() {
  try {
    const stored = sessionStorage.getItem("_greeting_emoji");
    if (stored !== null) {
      const i = Number(stored);
      if (Number.isInteger(i) && i >= 0 && i < GREETING_EMOJIS.length) {
        return GREETING_EMOJIS[i];
      }
    }
    const i = Math.floor(Math.random() * GREETING_EMOJIS.length);
    sessionStorage.setItem("_greeting_emoji", String(i));
    return GREETING_EMOJIS[i];
  } catch {
    return GREETING_EMOJIS[0];
  }
}

// True only on the first dashboard view of a login session, so the greeting
// auto-plays once right after sign-in (not on every refresh/navigation).
function consumeLoginAutoPlay() {
  try {
    if (sessionStorage.getItem("_greeting_played")) return false;
    sessionStorage.setItem("_greeting_played", "1");
    return true;
  } catch {
    return false;
  }
}

function GreetingEmoji() {
  const [emoji] = useState(pickSessionEmoji);
  const [hovered, setHovered] = useState(false);
  const [autoPlay, setAutoPlay] = useState(consumeLoginAutoPlay);

  // Auto-play for 5s after login, then freeze back to the still poster.
  useEffect(() => {
    if (!autoPlay) return;
    const id = setTimeout(() => setAutoPlay(false), 5000);
    return () => clearTimeout(id);
  }, [autoPlay]);

  // Static PNG poster at rest; animated WebP while auto-playing or hovered.
  const animated = autoPlay || hovered;
  return (
    <img
      src={`/emoji/${emoji}.${animated ? "webp" : "png"}`}
      alt=""
      aria-hidden="true"
      className="inline-block size-6 select-none align-text-bottom"
      draggable={false}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    />
  );
}

function DashboardHeader({
  hasBack,
  onBack,
  title,
}: {
  hasBack: boolean;
  onBack?: () => void;
  title?: string;
}) {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const { state, toggleSidebar } = useSidebar();
  const { handleLogout, isLoggingOut } = useLogout();
  const { isOpen: openLogout, toggleClick: toggleLogout } = useToggleModal(false);

  return (
    <header className="flex justify-between h-15 px-3 lg:px-10 shrink-0 sticky top-0 z-10 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-white border border-l-0 border-white-02 relative">
      {/* Sidebar collapse toggle — on the left border, vertically centered in the header */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 size-6 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-01 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
      >
        {state === "collapsed" ? (
          <ChevronRight className="size-3" />
        ) : (
          <ChevronLeft className="size-3" />
        )}
      </button>

      <div className="inline-flex items-center gap-2">
        <SidebarTrigger className="md:hidden size-8" />

        {hasBack && (
          <>
            <figure
              onClick={() => {
                if (onBack) onBack();
                else navigate(-1);
              }}
              className="uppercase font-light text-gray-01 text-sm inline-flex items-center cursor-pointer"
            >
              <ChevronLeft className="text-inherit size-5 mr-1" />
              Back
            </figure>
            <Separator
              orientation="vertical"
              className="rotate-10 w-[1.2px] bg-black-01 data-[orientation=vertical]:h-7"
            />
          </>
        )}

        {title ? (
          <h6 className="text-base uppercase font-semibold text-black-01">{title}</h6>
        ) : (
          <h6
            className="text-lg font-medium text-black-01 inline-flex items-center gap-1.5"
            style={{ fontFamily: '"Trebuchet MS", "Segoe UI", Tahoma, sans-serif' }}
          >
            {(() => {
              const h = new Date().getHours();
              const period = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
              const first = user?.full_name?.split(" ")[0];
              return `Good ${period}${first ? `, ${first}` : ""}`;
            })()}
            <GreetingEmoji />
          </h6>
        )}
      </div>
      <TopProgressBar />
      <div className="gap-x-3 inline-flex items-center">
        <NotificationsBell />

        <Separator
          orientation="vertical"
          className="hidden sm:block data-[orientation=vertical]:h-7"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="hidden sm:inline-flex items-center gap-x-3 pl-2.5 py-1 rounded-lg hover:bg-white-02/60 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Avatar>
                <AvatarImage src={"/image/avatar2.png"} />
                <AvatarFallback>
                  {returnInitial(user?.full_name ?? "O")}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.full_name || ""}</span>
                <span className="text-muted-foreground truncate text-xs">{user?.email || ""}</span>
              </div>
              <ChevronDown className="hidden md:block size-4 text-gray-01" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span className="truncate font-medium text-black-01">{user?.full_name || ""}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">{user?.email || ""}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(routesPath.PROTECTED.ME_PROFILE.INDEX)}>
              <UserRound className="size-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(routesPath.PROTECTED.ME_SECURITY.OVERVIEW)}>
              <ShieldCheck className="size-4" />
              My Security
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={toggleLogout}
            >
              <LogOut className="size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <PromptModal
        isOpen={openLogout}
        onClose={toggleLogout}
        onConfirm={handleLogout}
        title="Log Out?"
        description="Are you sure you want to log out of your account?"
        containerClass="min-h-[320px] lg:w-[390px]"
        srcClass="size-25"
        src="/image/caution.png"
        onConfirmText="Log Out"
        canCancel
        loading={isLoggingOut}
        onConfirmClass="bg-error-01 text-white shadow-xs hover:bg-error-01/90 focus-visible:ring-error-01/20"
      />
    </header>
  );
}

function getSidebarDefaultOpen(): boolean {
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("sidebar_state="));
  if (!cookie) return true;
  return cookie.split("=")[1] !== "false";
}

export default function DashboardLayout({
  children,
  hasBack = false,
  onBack,
  title,
}: {
  children: React.ReactNode;
  hasBack?: boolean;
  title?: string;
  onBack?: () => void;
}) {
  useTokenRefresh();
  const { open, secondsLeft, isExpired, onContinue, onLogout, goToLogin } = useSessionTimeout();

  return (
    <>
      <SessionTimeoutModal
        open={open}
        secondsLeft={secondsLeft}
        isExpired={isExpired}
        onContinue={onContinue}
        onLogout={onLogout}
        goToLogin={goToLogin}
      />
      <SidebarProvider defaultOpen={getSidebarDefaultOpen()}>
        <AppSidebar />
        <SidebarInset className="bg-white-05 min-w-0 w-auto">
          <DashboardHeader hasBack={hasBack} onBack={onBack} title={title} />
          <div className="grid min-w-0 pt-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
