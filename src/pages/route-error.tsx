import { Link, isRouteErrorResponse, useRouteError } from "react-router";
import { Button } from "@/components/ui/button";
import { routesPath } from "@/routes/routesPath";

// Router-level error boundary. Without one, any uncaught render error unmounts
// the entire app into react-router's default stack-trace screen — including in
// production. Registered as ErrorBoundary on the root routes in routes/index.
export default function RouteError() {
  const error = useRouteError();

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "An unexpected error occurred.";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white-05 px-6 text-center">
      <img src="/image/caution.png" alt="" className="size-20" />
      <h1 className="text-xl font-semibold text-black-01">Something went wrong</h1>
      <p className="max-w-md text-sm text-gray-01">
        The page hit an unexpected error. You can try reloading, or head back to
        the dashboard — if it keeps happening, report it with the message below.
      </p>
      <p className="max-w-md rounded-md bg-white px-3 py-2 font-mono text-xs text-error-01 border border-gray-200 break-all">
        {message}
      </p>
      <div className="flex gap-2">
        <Button variant="white" onClick={() => window.location.reload()}>
          Reload page
        </Button>
        <Button asChild>
          <Link to={routesPath.PROTECTED.OVERVIEW.INDEX}>Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
