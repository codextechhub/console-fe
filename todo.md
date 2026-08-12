## Undone (Ask questions for clarity where needed)

1. I want to work on loading options for different components on the screens. (skeleton/spinner/progress bar) Also, components load differently. One loading shouldn't affect another loading.

2. Dashboard action-first rebuild (planned 2026-08-12; slices 1 quick-actions row,
   2a/2b worklist + aging, and c module signals are DONE - signals strip shows
   fiscal runway (worst entity), draft journals, POs awaiting receipt, webhook
   failures 24h, own failed jobs 24h; each gated + omitted when quiet, red
   before amber).
   Slices d (deep links seed filters via useFilterParam; tasks/tickets/
   submissions/notifications) and e (recent-opens store + "Pick up where you
   left off" strip; logged by school/ticket/approval/submission details) are
   DONE.
   Slice f DONE (2026-08-12): signals renamed "Action needed" with big stat
   cards + CTA verbs; all strip headers use the house section-heading style;
   metric grid compacted to one-line tiles and moved below the worklist;
   "Your workspace" is a chip row at the page foot. Dashboard rebuild COMPLETE.

## Done

# 24. Code splitting + tests + CI (2026-06-11) - closed the three structural gaps left open by the deep review. (a) Route-level code splitting: all 85 page imports across the 11 route files converted to `React.lazy()`, single Suspense boundary in `src/routes/lazy-root.tsx` (kept eager along with RouteError/Authenticated so the loading/error shell can never fail to load), plus a `vendor-react` manualChunks split in vite.config.ts. Main bundle: 2,491 kB (gzip 726) → 405 kB entry + 144 kB cacheable vendor (initial gzip ≈ 230 kB incl. layout chunk); each page is a 14–60 kB on-demand chunk; recharts (343 kB) loads only on chart pages; the >500 kB build warning is gone. (b) Tests: Vitest + happy-dom (`vitest.config.ts`, `npm test`); 35 unit tests covering `src/utils/jwt.ts` (base64url decode incl. the atob-crash case, expiry buffer), `tokenRefresh.ts` (single-flight, 401/5xx/network outcome mapping, invalidation discarding in-flight rotations, cookie persistence), `endSession.ts` (full teardown, banner-after-clear ordering, refresh blocking) and `helpers` formatting. (c) CI: `.github/workflows/ci.yml` runs tsc → eslint --max-warnings 0 → vitest → vite build on every push/PR to main. Full sequence verified locally.

# 23. Deep-review fix pass (2026-06-11) - worked through all findings from the XVision FE deep review, cross-checked against the backend repo. Critical: JWT decode now base64url-safe via shared `src/utils/jwt.ts` (SimpleJWT payloads with UUID/full_name claims made the old `atob()` throw, breaking expiry detection + proactive refresh); Redux DevTools disabled in prod (`import.meta.env.DEV` - `NODE_ENV` doesn't exist under Vite); auth cookies now set with `sameSite=strict` + `secure` via single `setAuthCookies()` writer. High: TopProgressBar silent-list fixed to the real `*Bell` endpoint names (notification polls no longer flash the bar; typed selector, CSS-keyframe animation, no setState-in-effect); router-level ErrorBoundary (`src/pages/route-error.tsx`); `src/vite-env.d.ts` typing `VITE_*` env vars. Medium: all session teardown paths consolidated into `src/utils/endSession.ts` (the route-change refresh path previously missed `markSessionInvalidated`); Authenticated gate constants now imported from `use-session-timeout` (the local mirror had drifted: 14+1 vs 5+10); gate evaluation moved to a once-per-mount lazy initialiser; header sticky/relative conflict removed; activity listeners throttled to 1/s; members/invites search page-reset now happens in-render (no stale-page fetch). Overview: "Active School Users" relabelled "CX Team Members" (it counts console staff), fabricated trend chips removed from real cards, hard-coded figures/charts marked with a "Sample" chip. Cleanup: eslint 88→0 problems (purity via new `useNow()` 30s-tick clock hook, render-phase adjustment pattern replacing setState-in-effect, typed authSlice payloads, removed `as any` Badge casts); deleted dead `use-inactivity.ts` and 13 unused helpers; removed phantom `end_reason` read (not in `ImpersonationSessionSerializer`); stripped 17 `"use client"` directives; header avatar shows initials instead of one shared stock photo; greeting uses `first_name`; Impersonations + Change Requests nav items enabled (pages and `vs_admin_console`/RBAC endpoints are live; PERMISSIONS_AUDIT.md updated). `tsc`, `eslint` (0/0) and `vite build` all pass. Still open (structural, not bugs): route-level code-splitting (2.49 MB bundle), tests, CI.

# 22. "New Import" upload wizard - VERIFIED ALREADY BUILT (this todo note was stale). `src/components/custom/import-wizard.tsx` is a complete 7-step flow (template pick → file upload via `useCreateImportBatchMutation` POST `/import/batches/` → header review → validation → issue review → confirm → import progress → done). Reachable from the Batches list "New Import" button (`batches/index.tsx`, gated by `P.UPLOAD_IMPORT_BATCH`) → `batches/new.tsx` → `<ImportWizard>`. The button is NOT disabled. Nothing to build; left as-is.

# 21. vs_workflow stage rejection behaviour exposed - added `on_rejection` (+ `advance_rule`, `quorum_count`) to `WorkflowStageInstanceReadSerializer` (sourced from the related stage; detail queryset already prefetches `stage_instances__stage`, no N+1). FE `WorkflowStageInstance` type gained the fields; `workflow/approvals/approval-detail.tsx` now reads `activeStage.on_rejection` directly and the second `GET /workflow/templates/?page_size=200` fetch was removed. Reject-confirmation copy + inline hint now reflect real terminal-vs-return behaviour with no extra request.

# 20. Data Imports overhaul - replaced all dummy data with live `importApi` slice (22 endpoints from `vs_import_data`). Dropped fake "Template Columns" flat directory. Templates list now shows real backend data with create flow gated to CX_STAFF, real download links (CSV/XLSX), and a read-only detail sheet. Batches list shows real backend data with status filter mapped to full 14-value enum, in-flight polling indicator, and gated delete action. Batch detail page wires up the full lifecycle: pipeline timeline aligned to backend enum, Validate / Start Import / Delete actions with `PromptModal` confirms, validation summary, 5 tabs (Issues with resolve + CSV export, Jobs with progress bars + rollback dialog, Row Results from `ImportJobRowResult`, per-batch Audit, per-batch Notifications), and 5s auto-poll while in-flight. Added `import.*` permission constants (`P.CREATE_IMPORT_TEMPLATE`, `P.RUN_IMPORT_VALIDATION`, `P.EXECUTE_IMPORT_BATCH`, `P.DELETE_IMPORT_BATCH`, `P.RESOLVE_IMPORT_ISSUE`, `P.RUN_IMPORT_ROLLBACK`, etc.). Dataset enum restricted to backend's real choices (schools, branches). PERMISSIONS_AUDIT.md updated.

# 19. Explain "Your session could not be restored. Log in again." error - this toast fires only when the access token expires (401), the silent refresh attempt hits a 5xx server error on `/user/auth/token/refresh/`, and the backend is too broken to confirm the session is restorable. Other 401 outcomes: successful refresh = silent re-auth; invalid refresh token = silent force-logout (no toast); network error = silent return (component surfaces its own error). Code path: `baseApi.ts` `baseQueryInterceptor` → `refreshed.reason === "server_error"` branch.

# 1. Remove Admin Role field from Add Branch (branch admin section) - role is prebuilt internally, field removed from UI, interface, validation schema, and API payload.
# 2. Remove Admin Role field from Create School Admin step - same reason, removed from UI, interface, validation schema, and API payload.
# 3. Add formatEnum utility - converts raw DB enum keys (e.g. FAITH_BASED, 3_TERMS) to human-readable labels across school management pages.
# 4. Add activated_at to branch details view - shows formatted date or "Not Activated" when null.
# 5. Check former school design (commit e970f0ee) vs current - old design had Edit button in a separate row, no Status column, "Add New Branch" button, raw enum values. Current design is the correct improved version; nothing to revert.
# 6. Add global loading cursor - replaced with top progress bar (`TopProgressBar`) in `DashboardLayout` header; detects all RTK Query activity via `state.baseApi` selector. No per-page setup needed.
# 7. Prefill create school visible on all wizard steps - "Fill test data" button at the top of create-school wrapper, visible when `VITE_SHOW_PREFILL=true` (set in `.env` for staging).
# 8. Good morning/afternoon/evening greeting - replaces "Welcome back!!" in the dashboard header using the logged-in user's first name. Uses Montserrat font in sentence case.
# 9. Hide session countdown timer - timer still counts internally (reduced to 1 min) but is no longer shown to the user in the modal.
# 10. Fix activate account "authentication failed" error - added "activate" to `authUrls` in `baseApi.ts` so 401s on the activation endpoint show a proper error toast instead of force-logging out.
# 11. Fix login error messages - extracted actual backend error message (`res?.data?.message` / `res?.data?.error?.detail`) instead of always showing "Authentication failed." Also fixed wrong placeholder on the password field.
# 12. Paginate all tables - Schools index (server-side, page resets on search/filter), Members tab (onPageChange wired), Invites tab (onPageChange wired), view-school branches (client-side, 10 per page with search reset).
# 13. Responsive views - sidebar hamburger trigger for mobile, toolbars stack vertically on small screens, header user section collapses on mobile, view pages use flex-wrap on header rows.
# 14. Collapsible sidebar - collapse toggle button on the left border of the sticky header; logo always shows icon-only centered; chevron flips direction on state change; persists across all pages.
# 15. Functional filter system in team management - server-side filters on both Members and Invites tabs. Members: Role, Status, Date Created (from/to), Invited By. Invites: Role, Date Created (from/to), Invited By. Filter sheet opens from a "Filters" button with an active-count badge. Draft/applied two-state pattern so changes only take effect on "Apply".
# 16. Login error for unactivated users - backend ACCOUNT_NOT_ACTIVATED message updated to include "or contact your administrator". Interceptor no longer fires a redundant toast for 403 on auth routes; login page shows it inline only.
# 17. Invites tab - added "Email Sent" (SENT/PENDING/FAILED badge) and "Days Left" columns. Backend: UserListSerializer now exposes invitation_email_status and invitation_expires_at; queryset select_related extended to include invitation.
# 18. Sort bar on all 4 tables - compact icon+label bar above each table (Members, Invites, Schools, Branches). Column and direction are one state (always in sync); clicking cycles none→asc→desc→none. Backend: Users view gained ordering param (first_name/email/role/status/created_at); Schools and Branches views gained status/-status. Branches in view-school sort client-side.
<!-- Keyword: design-review

  In any future session, say something like:
  - "design-review - check the export wizard against Audit_Security_standalone.html"
  - "run design-review on the sessions page"
  - "design-review: compare the compliance rules form with the prototype"
  
  Claude will automatically:
  1. Extract and decompress the prototype blobs to find the right component
  2. Read the current implementation + related types/hooks
  3. Post a numbered gap list (prototype vs code) - nothing is touched yet
  4. Wait for your confirmation on scope
  5. Implement, type-check, and summarise per file 
-->
