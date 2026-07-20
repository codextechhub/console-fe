import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // shadcn-style component files co-export their cva variants and small
    // helpers; losing fast-refresh for these vendored files is acceptable.
    // The health `primitives` module is the same co-export pattern (shared
    // building blocks + HEALTH_POLL / statusStyle helpers) by choice.
    files: ['src/components/**/*.{ts,tsx}', 'src/pages/protected/health/primitives.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
