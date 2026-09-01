import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Specific package paths first: alias resolution is order-sensitive in
    // array form, and "@" would otherwise swallow them.
    alias: [
      { find: "@/pages/protected/workflow/components", replacement: path.resolve(__dirname, "./packages/xvs-finance/src/components/workflow") },
      { find: "@/pages/protected/procurement", replacement: path.resolve(__dirname, "./packages/xvs-finance/src/pages/procurement") },
      { find: "@/pages/protected/finance", replacement: path.resolve(__dirname, "./packages/xvs-finance/src/pages/finance") },
      { find: "@/components/finance-ui", replacement: path.resolve(__dirname, "./packages/xvs-finance/src/components/finance-ui") },
      { find: "@/redux/services/finance", replacement: path.resolve(__dirname, "./packages/xvs-finance/src/redux/services/finance") },
      { find: "@/redux/services/procurement", replacement: path.resolve(__dirname, "./packages/xvs-finance/src/redux/services/procurement") },
      { find: "@/redux/features/finance", replacement: path.resolve(__dirname, "./packages/xvs-finance/src/redux/features/finance") },
      { find: "@/utils/money", replacement: path.resolve(__dirname, "./packages/xvs-finance/src/utils/money.ts") },
      { find: "@/utils/posting-window", replacement: path.resolve(__dirname, "./packages/xvs-finance/src/utils/posting-window.ts") },
      { find: "@/utils/quantity", replacement: path.resolve(__dirname, "./packages/xvs-finance/src/utils/quantity.ts") },
      { find: "@/utils/fls", replacement: path.resolve(__dirname, "./packages/xvs-finance/src/utils/fls.ts") },
      { find: "@/utils/finance-export", replacement: path.resolve(__dirname, "./packages/xvs-finance/src/utils/finance-export.ts") },
      { find: "@/utils/finance-documents", replacement: path.resolve(__dirname, "./packages/xvs-finance/src/utils/finance-documents.ts") },
      { find: "@/utils/chart-of-accounts", replacement: path.resolve(__dirname, "./packages/xvs-finance/src/utils/chart-of-accounts.ts") },
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
  },
  test: {
    // happy-dom provides document.cookie / sessionStorage / localStorage for
    // the auth-session utilities under test.
    environment: "happy-dom",
    include: [
      "src/**/*.test.{ts,tsx}",
      // The package's own tests. Without this line the finance suites are
      // silently not discovered, which reads as a smaller passing run.
      "packages/xvs-finance/src/**/*.test.{ts,tsx}",
    ],
    env: {
      VITE_BACKEND_URL: "http://test.local/v1",
    },
  },
});
