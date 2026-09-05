import path from "path"
import { realpathSync } from "node:fs"

// The package is consumed as SOURCE. Resolve it to its REAL location before
// aliasing: with `npm link` that is the sibling checkout, outside node_modules,
// which is what stops Vite's dependency optimizer pre-bundling it.
//
// This is not cosmetic. Our imports reach the package through @/ aliases that
// point INSIDE node_modules, so optimizeDeps.exclude - which matches a package
// NAME - never saw them. Vite pre-bundled 26 chunks of it, giving the store one
// copy of the finance entity slice and the screens another. The finance and
// procurement areas then rendered their shell and nothing else: no error, and
// no network request, because the query hooks were bound to a duplicate api
// whose middleware the store had never registered.

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The package is consumed as SOURCE, and the two commands need it resolved
// differently. Neither path works for both, which is why this is conditional:
//
//   serve  - resolve to the REAL location (the linked checkout, outside
//            node_modules). Vite's dependency optimizer pre-bundles anything it
//            resolves inside node_modules, and optimizeDeps.exclude matches a
//            package NAME, so it never saw these @/ aliases. That duplicated 12
//            modules: the store got one copy of the finance entity slice and the
//            screens another, and the finance area rendered its shell and
//            nothing else - no error, no network request.
//
//   build  - resolve THROUGH node_modules. Rollup resolves a module's imports
//            from where that module sits, and the linked checkout has no
//            node_modules of its own, so `react/jsx-runtime` cannot be found
//            from there.
const financeSrc = (command: string) =>
  command === "serve"
    ? realpathSync(path.resolve(__dirname, "./node_modules/@xvs/finance/src"))
    : path.resolve(__dirname, "./node_modules/@xvs/finance/src")

// Every specifier this app redirects into the package, paired with its path
// inside the package. One list feeds two settings that MUST agree: the alias
// table and optimizeDeps.exclude.
const PACKAGE_SPECIFIERS: [find: string, target: string][] = [
  ["@xvs/finance", ""],
  ["@/redux/services/payments", "redux/services/payments"],
  ["@/redux/services/tenants-api", "redux/services/tenants-api.ts"],
  ["@/lib/source-document-route", "lib/source-document-route.ts"],
  ["@/hooks/use-action-param", "hooks/use-action-param.ts"],
  ["@/pages/protected/workflow/components", "components/workflow"],
  ["@/pages/protected/workflow/approvals", "pages/workflow/approvals"],
  ["@/pages/protected/workflow/my-submissions", "pages/workflow/my-submissions"],
  ["@/pages/protected/workflow/instances", "pages/workflow/instances"],
  ["@/pages/protected/workflow/approver-groups", "pages/workflow/approver-groups"],
  ["@/pages/protected/workflow/templates", "pages/workflow/templates"],
  ["@/redux/services/workflow", "redux/services/workflow"],
  ["@/pages/protected/workflow/delegations", "pages/workflow/delegations"],
  ["@/pages/protected/procurement", "pages/procurement"],
  ["@/pages/protected/finance", "pages/finance"],
  ["@/components/finance-ui", "components/finance-ui"],
  ["@/redux/services/finance", "redux/services/finance"],
  ["@/redux/services/procurement", "redux/services/procurement"],
  ["@/redux/features/finance", "redux/features/finance"],
  ["@/utils/relative-date", "utils/relative-date.ts"],
  ["@/utils/money", "utils/money.ts"],
  ["@/utils/posting-window", "utils/posting-window.ts"],
  ["@/utils/quantity", "utils/quantity.ts"],
  ["@/utils/fls", "utils/fls.ts"],
  ["@/utils/finance-export", "utils/finance-export.ts"],
  ["@/utils/finance-documents", "utils/finance-documents.ts"],
  ["@/utils/chart-of-accounts", "utils/chart-of-accounts.ts"],
]

const packageAlias = (command: string) =>
  PACKAGE_SPECIFIERS.map(([find, target]) => ({
    find,
    replacement: target
      ? path.resolve(financeSrc(command), target)
      : financeSrc(command),
  }))

// Excluding the package NAME is not enough, and the realpath trick above only
// helps while the package is npm-linked. On a plain `npm ci` the alias targets
// sit inside node_modules again, Vite's scanner calls them dependencies, and a
// pre-bundled chunk inlines its own copy of `@/redux/services/base-api`. The
// finance endpoints then inject into a second RTK Query instance the store
// never registered, so every finance hook returns `{ data: undefined }` and
// issues no request. Excluding the specifiers themselves closes that off in
// both setups.
const EXCLUDE_FROM_PREBUNDLE = PACKAGE_SPECIFIERS.map(([find]) => find)

// Runtime dependencies the shared package imports and this app's own source
// never does. Vite decides what to pre-bundle by scanning THIS app's imports, so
// a package-only dependency is never bundled, and with `preserveSymlinks` a bare
// import from an npm-linked package resolves upward from the sibling checkout,
// which carries no node_modules of its own. The screen then dies on load with
// "failed to resolve import" while the installed setup, where the package sits
// inside node_modules, works perfectly. Naming them here pre-bundles them out of
// this app's own node_modules, where they are installed, so both setups resolve.
const PACKAGE_ONLY_DEPS = ["date-fns"]

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Fixed port so the two apps can run side by side: 5173 is the Console (Codex staff).
  // Without this both default to 5173 and whichever starts second silently
  // moves to the next free port, which breaks any link built against it.
  // strictPort makes that failure loud instead of silent.
  server: { port: 5173, strictPort: true },
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
  ],
  // Consumed as TypeScript source, not as a built dependency: it resolves
  // @/* against THIS app, so Vite must process it rather than pre-bundle it.
  optimizeDeps: { exclude: EXCLUDE_FROM_PREBUNDLE, include: PACKAGE_ONLY_DEPS },
  resolve: {
    // See tsconfig: the package is a symlinked sibling checkout.
    preserveSymlinks: true,
    alias: [
      { find: "@xvs-host", replacement: path.resolve(__dirname, "./src/xvs-host.ts") },
      ...packageAlias(command),
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
  },
  build: {
    rollupOptions: {
      output: {
        // The framework stack changes only on dependency bumps - splitting it
        // out of the app entry lets browsers keep it cached across deploys.
        manualChunks: {
          "vendor-react": [
            "react",
            "react-dom",
            "react-router",
            "@reduxjs/toolkit",
            "react-redux",
            "redux-persist",
          ],
        },
      },
    },
  },
}))
