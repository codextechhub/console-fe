import { RouterProvider } from "react-router";
import { router } from "./routes";
import { TooltipProvider } from "./components/ui/tooltip.tsx";
import AppProvider from "./redux/provider.tsx";
import { ConnectivityBanner } from "./components/custom/connectivity-banner.tsx";

function App() {
  return (
    <>
      <AppProvider>
        <TooltipProvider>
          <RouterProvider router={router} />
          {/* Outside the router so it survives route errors and covers the
              auth and public screens too. */}
          <ConnectivityBanner />
        </TooltipProvider>
      </AppProvider>
    </>
  );
}

export default App;
