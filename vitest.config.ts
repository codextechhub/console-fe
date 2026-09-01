import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // The package's .tsx files live under node_modules now, where esbuild does
  // not pick up tsconfig's `jsx: react-jsx`. Without this they are transformed
  // with the classic runtime and every component throws "React is not defined"
  // at render - 51 tests, all of them previously passing.
  esbuild: { jsx: "automatic" },
  resolve: {
    // See tsconfig: the package is a symlinked sibling checkout.
    preserveSymlinks: true,
    // Specific package paths first: alias resolution is order-sensitive in
    // array form, and "@" would otherwise swallow them.
    alias: [
      { find: "@xvs/finance", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src") },
      { find: "@xvs-host", replacement: path.resolve(__dirname, "./src/xvs-host.ts") },
      { find: "@/redux/services/payments", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/redux/services/payments") },
      { find: "@/redux/services/tenants-api", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/redux/services/tenants-api.ts") },
      { find: "@/lib/source-document-route", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/lib/source-document-route.ts") },
      { find: "@/hooks/use-action-param", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/hooks/use-action-param.ts") },
      { find: "@/pages/protected/workflow/components", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/components/workflow") },
      { find: "@/pages/protected/procurement", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/pages/procurement") },
      { find: "@/pages/protected/finance", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/pages/finance") },
      { find: "@/components/finance-ui", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/components/finance-ui") },
      { find: "@/redux/services/finance", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/redux/services/finance") },
      { find: "@/redux/services/procurement", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/redux/services/procurement") },
      { find: "@/redux/features/finance", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/redux/features/finance") },
      { find: "@/utils/money", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/utils/money.ts") },
      { find: "@/utils/posting-window", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/utils/posting-window.ts") },
      { find: "@/utils/quantity", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/utils/quantity.ts") },
      { find: "@/utils/fls", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/utils/fls.ts") },
      { find: "@/utils/finance-export", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/utils/finance-export.ts") },
      { find: "@/utils/finance-documents", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/utils/finance-documents.ts") },
      { find: "@/utils/chart-of-accounts", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/utils/chart-of-accounts.ts") },
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
  },
  test: {
    // happy-dom provides document.cookie / sessionStorage / localStorage for
    // the auth-session utilities under test.
    environment: "happy-dom",
    // Vitest excludes node_modules from discovery by default, and the
    // package now lives there. Without overriding it the suite silently
    // shrinks by 34 files, which reads as a smaller passing run.
    exclude: ["**/dist/**", "**/node_modules/**/node_modules/**"],
    include: [
      "src/**/*.test.{ts,tsx}",
      // The package's own tests. Without this line the finance suites are
      // silently not discovered, which reads as a smaller passing run.
      "node_modules/@xvs/finance/src/**/*.test.{ts,tsx}",
    ],
    env: {
      VITE_BACKEND_URL: "http://test.local/v1",
    },
  },
});
