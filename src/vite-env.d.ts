/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Django backend, e.g. https://api.staging.example.com/v1 */
  readonly VITE_BACKEND_URL: string;
  /** Name of the CSRF cookie this deployment's backend sets; defaults to csrftoken. */
  readonly VITE_CSRF_COOKIE_NAME?: string;
  /** Sentry project address; error reporting is off when empty. */
  readonly VITE_SENTRY_DSN?: string;
  /** Deployment name Sentry files reports under, e.g. production or staging. */
  readonly VITE_SENTRY_ENVIRONMENT?: string;
  /** Build identifier (the git commit) Sentry files reports under. */
  readonly VITE_SENTRY_RELEASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
