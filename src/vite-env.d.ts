/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Django backend, e.g. https://api.staging.example.com/v1 */
  readonly VITE_BACKEND_URL: string;
  /** "true" to show the create-school "Fill test data" button (staging only). */
  readonly VITE_SHOW_PREFILL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
