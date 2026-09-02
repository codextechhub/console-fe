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
  optimizeDeps: { exclude: ["@xvs/finance"] },
  resolve: {
    // See tsconfig: the package is a symlinked sibling checkout.
    preserveSymlinks: true,
    alias: [
      { find: "@xvs/finance", replacement: financeSrc(command) },
      { find: "@xvs-host", replacement: path.resolve(__dirname, "./src/xvs-host.ts") },
      { find: "@/redux/services/payments", replacement: path.resolve(financeSrc(command), "redux/services/payments") },
      { find: "@/redux/services/tenants-api", replacement: path.resolve(financeSrc(command), "redux/services/tenants-api.ts") },
      { find: "@/lib/source-document-route", replacement: path.resolve(financeSrc(command), "lib/source-document-route.ts") },
      { find: "@/hooks/use-action-param", replacement: path.resolve(financeSrc(command), "hooks/use-action-param.ts") },
      { find: "@/pages/protected/workflow/components", replacement: path.resolve(financeSrc(command), "components/workflow") },
      { find: "@/pages/protected/procurement", replacement: path.resolve(financeSrc(command), "pages/procurement") },
      { find: "@/pages/protected/finance", replacement: path.resolve(financeSrc(command), "pages/finance") },
      { find: "@/components/finance-ui", replacement: path.resolve(financeSrc(command), "components/finance-ui") },
      { find: "@/redux/services/finance", replacement: path.resolve(financeSrc(command), "redux/services/finance") },
      { find: "@/redux/services/procurement", replacement: path.resolve(financeSrc(command), "redux/services/procurement") },
      { find: "@/redux/features/finance", replacement: path.resolve(financeSrc(command), "redux/features/finance") },
      { find: "@/utils/money", replacement: path.resolve(financeSrc(command), "utils/money.ts") },
      { find: "@/utils/posting-window", replacement: path.resolve(financeSrc(command), "utils/posting-window.ts") },
      { find: "@/utils/quantity", replacement: path.resolve(financeSrc(command), "utils/quantity.ts") },
      { find: "@/utils/fls", replacement: path.resolve(financeSrc(command), "utils/fls.ts") },
      { find: "@/utils/finance-export", replacement: path.resolve(financeSrc(command), "utils/finance-export.ts") },
      { find: "@/utils/finance-documents", replacement: path.resolve(financeSrc(command), "utils/finance-documents.ts") },
      { find: "@/utils/chart-of-accounts", replacement: path.resolve(financeSrc(command), "utils/chart-of-accounts.ts") },
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
