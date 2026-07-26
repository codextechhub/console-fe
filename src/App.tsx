import { RouterProvider } from "react-router";
import { router } from "./routes";
import { TooltipProvider } from "./components/ui/tooltip.tsx";
import AppProvider from "./redux/provider.tsx";

function App() {
  return (
    <>
      <AppProvider>
        <TooltipProvider>
          <RouterProvider router={router} />
        </TooltipProvider>
      </AppProvider>
    </>
  );
}

export default App;
