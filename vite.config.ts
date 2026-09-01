import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: [
      { find: "@/redux/services/payments", replacement: path.resolve(__dirname, "./packages/xvs-finance/src/redux/services/payments") },
      { find: "@/redux/services/tenants-api", replacement: path.resolve(__dirname, "./packages/xvs-finance/src/redux/services/tenants-api.ts") },
      { find: "@/lib/source-document-route", replacement: path.resolve(__dirname, "./packages/xvs-finance/src/lib/source-document-route.ts") },
      { find: "@/hooks/use-action-param", replacement: path.resolve(__dirname, "./packages/xvs-finance/src/hooks/use-action-param.ts") },
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
})
