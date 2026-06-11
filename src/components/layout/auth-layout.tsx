import { Outlet } from "react-router";
import { ScrollArea } from "../ui/scroll-area";

export default function AuthLayout() {
  return (
    <ScrollArea className="w-screen h-screen grid place-content-center bg-[#0b1f4a] bg-[radial-gradient(120%_120%_at_50%_28%,#11264f_0%,#0b1f4a_45%,#081530_100%)] relative py-6">
      <div className="bg-[url(/image/authBg.png)] bg-fixed absolute inset-0 size-full bg-cover bg-center z-0" />
      <div className="relative z-1 grid size-full md:w-130 space-y-5 px-3">
        <img
          src="/image/logo.png"
          alt="XVS logo"
          className="mx-auto h-16 w-auto"
        />
        <div className="rounded-lg bg-white w-[93vw] md:w-full min-h-90 px-5 md:px-7 py-14 overflow-x-hidden">
          <Outlet />
        </div>
      </div>
    </ScrollArea>
  );
}
