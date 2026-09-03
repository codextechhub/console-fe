/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Django backend, e.g. https://api.staging.example.com/v1 */
  readonly VITE_BACKEND_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
