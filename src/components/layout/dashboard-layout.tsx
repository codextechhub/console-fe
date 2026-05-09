import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { AppSidebar } from "../app-sidebar";
import { svgIcons } from "@/assets/svg";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { useAppSelector } from "@/redux/store";
import { returnInitial } from "@/utils/helpers";
import { useTokenRefresh } from "@/hooks/use-token-refresh";
import { useSessionTimeout } from "@/hooks/use-session-timeout";
import { SessionTimeoutModal } from "@/components/session-timeout-modal";

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
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
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
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-white-05">
          <header className="flex justify-between h-15 px-3 lg:px-10 shrink-0 sticky top-0 z-10 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-white border border-l-0 border-white-02">
            <div className="inline-flex items-center gap-2">
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

              <h6 className="text-base uppercase font-semibold text-black-01">
                {title || "Welcome back!!"}
              </h6>
            </div>
            <div className="gap-x-3 inline-flex items-center">
              <button
                type="button"
                className="size-8.5 rounded-full relative bg-gray-04 grid place-content-center"
              >
                {svgIcons.notificationBell}
              </button>

              <Separator
                orientation="vertical"
                className=" data-[orientation=vertical]:h-7"
              />

              <figure className="inline-flex items-center gap-x-3 pl-2.5 py-1 ">
                <Avatar>
                  <AvatarImage src={"/image/avatar2.png"} />
                  <AvatarFallback>
                    {returnInitial(user?.full_name ?? "O")}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user?.full_name || ""}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user?.email || ""}
                  </span>
                </div>
              </figure>
            </div>
          </header>
          <div className="grid pt-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
