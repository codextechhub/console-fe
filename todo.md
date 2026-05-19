## Undone (Ask questions for clarity where needed)

## Done

# 19. Explain "Your session could not be restored. Log in again." error — this toast fires only when the access token expires (401), the silent refresh attempt hits a 5xx server error on `/user/auth/token/refresh/`, and the backend is too broken to confirm the session is restorable. Other 401 outcomes: successful refresh = silent re-auth; invalid refresh token = silent force-logout (no toast); network error = silent return (component surfaces its own error). Code path: `baseApi.ts` `baseQueryInterceptor` → `refreshed.reason === "server_error"` branch.

# 1. Remove Admin Role field from Add Branch (branch admin section) — role is prebuilt internally, field removed from UI, interface, validation schema, and API payload.
# 2. Remove Admin Role field from Create School Admin step — same reason, removed from UI, interface, validation schema, and API payload.
# 3. Add formatEnum utility — converts raw DB enum keys (e.g. FAITH_BASED, 3_TERMS) to human-readable labels across school management pages.
# 4. Add activated_at to branch details view — shows formatted date or "Not Activated" when null.
# 5. Check former school design (commit e970f0ee) vs current — old design had Edit button in a separate row, no Status column, "Add New Branch" button, raw enum values. Current design is the correct improved version; nothing to revert.
# 6. Add global loading cursor — replaced with top progress bar (`TopProgressBar`) in `DashboardLayout` header; detects all RTK Query activity via `state.baseApi` selector. No per-page setup needed.
# 7. Prefill create school visible on all wizard steps — "Fill test data" button at the top of create-school wrapper, visible when `VITE_SHOW_PREFILL=true` (set in `.env` for staging).
# 8. Good morning/afternoon/evening greeting — replaces "Welcome back!!" in the dashboard header using the logged-in user's first name. Uses Montserrat font in sentence case.
# 9. Hide session countdown timer — timer still counts internally (reduced to 1 min) but is no longer shown to the user in the modal.
# 10. Fix activate account "authentication failed" error — added "activate" to `authUrls` in `baseApi.ts` so 401s on the activation endpoint show a proper error toast instead of force-logging out.
# 11. Fix login error messages — extracted actual backend error message (`res?.data?.message` / `res?.data?.error?.detail`) instead of always showing "Authentication failed." Also fixed wrong placeholder on the password field.
# 12. Paginate all tables — Schools index (server-side, page resets on search/filter), Members tab (onPageChange wired), Invites tab (onPageChange wired), view-school branches (client-side, 10 per page with search reset).
# 13. Responsive views — sidebar hamburger trigger for mobile, toolbars stack vertically on small screens, header user section collapses on mobile, view pages use flex-wrap on header rows.
# 14. Collapsible sidebar — collapse toggle button on the left border of the sticky header; logo always shows icon-only centered; chevron flips direction on state change; persists across all pages.
# 15. Functional filter system in team management — server-side filters on both Members and Invites tabs. Members: Role, Status, Date Created (from/to), Invited By. Invites: Role, Date Created (from/to), Invited By. Filter sheet opens from a "Filters" button with an active-count badge. Draft/applied two-state pattern so changes only take effect on "Apply".
# 16. Login error for unactivated users — backend ACCOUNT_NOT_ACTIVATED message updated to include "or contact your administrator". Interceptor no longer fires a redundant toast for 403 on auth routes; login page shows it inline only.
# 17. Invites tab — added "Email Sent" (SENT/PENDING/FAILED badge) and "Days Left" columns. Backend: UserListSerializer now exposes invitation_email_status and invitation_expires_at; queryset select_related extended to include invitation.
# 18. Sort bar on all 4 tables — compact icon+label bar above each table (Members, Invites, Schools, Branches). Column and direction are one state (always in sync); clicking cycles none→asc→desc→none. Backend: Users view gained ordering param (first_name/email/role/status/created_at); Schools and Branches views gained status/-status. Branches in view-school sort client-side.
<!-- Keyword: design-review

  In any future session, say something like:
  - "design-review — check the export wizard against Audit_Security_standalone.html"
  - "run design-review on the sessions page"
  - "design-review: compare the compliance rules form with the prototype"
  
  Claude will automatically:
  1. Extract and decompress the prototype blobs to find the right component
  2. Read the current implementation + related types/hooks
  3. Post a numbered gap list (prototype vs code) — nothing is touched yet
  4. Wait for your confirmation on scope
  5. Implement, type-check, and summarise per file 
-->
