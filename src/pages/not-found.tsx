import { Button } from "@/components/ui/button";
import { useActionSearch } from "@/hooks/use-action-search";
import { routesPath } from "@/routes/routes-path";
import { SUPPORT_MAIL } from "@/utils/static";
import { isPrimaryShortcut } from "@/utils/keyboard-shortcuts";
import { ArrowLeft, Home, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

export default function NotFound() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [resultsOpen, setResultsOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const shortcutLabel = useMemo(
    () => (/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "⌘ E" : "Ctrl E"),
    [],
  );
  const { results, onLaunch } = useActionSearch(search);
  const navigableResults = results
    .filter((result) => "to" in result.action.run)
    .slice(0, 4);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (!isPrimaryShortcut(event, "KeyE")) return;
      event.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
    };

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const launchResult = (result: (typeof navigableResults)[number]) => {
    onLaunch(result.action, search);
    setSearch("");
    setResultsOpen(false);
    if ("to" in result.action.run) navigate(result.action.run.to);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 py-3 px-4 sm:px-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <img
            src="/image/logo.png"
            alt="XVS logo"
            className="h-12 w-auto"
          />
        </div>

        <div className="relative ml-auto min-w-0 w-full max-w-[430px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setResultsOpen(true);
            }}
            onFocus={() => setResultsOpen(true)}
            onBlur={() => setResultsOpen(false)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setResultsOpen(false);
              if (event.key === "Enter" && navigableResults[0]) {
                event.preventDefault();
                launchResult(navigableResults[0]);
              }
            }}
            role="combobox"
            aria-label="Search the workspace"
            aria-expanded={resultsOpen && Boolean(search.trim())}
            aria-controls="not-found-search-results"
            aria-keyshortcuts="Control+E Meta+E"
            placeholder="Search the workspace"
            className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50/70 pl-9 pr-17 text-sm outline-none transition placeholder:text-gray-400 focus:border-primary/35 focus:bg-white focus:ring-3 focus:ring-primary/8"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold tracking-wide text-gray-400 shadow-sm sm:block">
            {shortcutLabel}
          </kbd>
          {resultsOpen && search.trim() && (
            <div
              id="not-found-search-results"
              role="listbox"
              aria-label="Workspace search results"
              className="absolute left-0 top-11 z-50 w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl"
            >
              {navigableResults.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-gray-400">
                  No accessible pages found.
                </p>
              ) : (
                navigableResults.map((result) => (
                  <button
                    key={result.action.id}
                    type="button"
                    role="option"
                    aria-selected="false"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => launchResult(result)}
                    className="flex w-full items-center rounded-lg px-3 py-2 text-left hover:bg-gray-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-black-01">
                        {result.action.label}
                      </span>
                      <span className="block truncate text-[11px] text-gray-400">
                        {result.action.console === "Main"
                          ? result.action.group
                          : `${result.action.console} · ${result.action.group}`}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="relative">
            <div className="text-[150px] font-bold text-gray-200 leading-none">
              404
            </div>
            <div className="absolute top-[56%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400 text-4xl">?</span>
            </div>
          </div>

          <h2 className="mt-6 text-2xl font-semibold text-gray-800">
            Page not found
          </h2>
          <p className="mt-3 text-gray-600">
            We couldn't find the page you're looking for. It might have been
            moved, deleted, or never existed.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={routesPath.AUTH.LOGIN}>
              <Button className="">
                <Home />
                Go to Home
              </Button>
            </Link>
            <Button onClick={() => navigate(-1)} variant="outline" className="">
              <ArrowLeft />
              <span>Go Back</span>
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help?{" "}
              <a
                href={`mailto:${SUPPORT_MAIL}`}
                className="text-primary hover:underline"
              >
                Contact our support team
              </a>
            </p>
          </div>
        </div>
      </div>

      <footer className="bg-white border-t border-gray-200 py-4 px-6 text-center text-sm text-gray-500">
        <p>
          &copy; {new Date().getFullYear()} CodeX Limited. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
