import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { AppSidebar } from "../app-sidebar";
import { svgIcons } from "@/assets/svg";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import { useAppSelector } from "@/redux/store";
import { returnInitial } from "@/utils/helpers";
import { useTokenRefresh } from "@/hooks/use-token-refresh";
import { useSessionTimeout } from "@/hooks/use-session-timeout";
import { SessionTimeoutModal } from "@/components/session-timeout-modal";
import { TopProgressBar } from "@/components/custom/top-progress-bar";

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
                onBack ? onBack() : navigate(-1);
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
          <h6 className="font-mont text-lg font-medium text-black-01">
            {(() => {
              const h = new Date().getHours();
              const period = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
              const first = user?.full_name?.split(" ")[0];
              return `Good ${period}${first ? `, ${first}!` : "!"}`;
            })()}
          </h6>
        )}
      </div>
      <TopProgressBar />
      <div className="gap-x-3 inline-flex items-center">
        <button
          type="button"
          className="size-8.5 rounded-full relative bg-gray-04 grid place-content-center"
        >
          {svgIcons.notificationBell}
        </button>

        <Separator
          orientation="vertical"
          className="hidden sm:block data-[orientation=vertical]:h-7"
        />

        <figure className="hidden sm:inline-flex items-center gap-x-3 pl-2.5 py-1">
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
        </figure>
      </div>
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
        <SidebarInset className="bg-white-05">
          <DashboardHeader hasBack={hasBack} onBack={onBack} title={title} />
          <div className="grid min-w-0 pt-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
