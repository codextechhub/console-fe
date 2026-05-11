## Undone

# 1. Deploy backend change: `activated_at` added to BranchDetailSerializer — needs to be pushed to staging/production so the branch detail API returns it.
# 2. Paginate all the tables in the site

## Done

# 1. Remove Admin Role field from Add Branch (branch admin section) — role is prebuilt internally, field removed from UI, interface, validation schema, and API payload.
# 2. Remove Admin Role field from Create School Admin step — same reason, removed from UI, interface, validation schema, and API payload.
# 3. Add formatEnum utility — converts raw DB enum keys (e.g. FAITH_BASED, 3_TERMS) to human-readable labels across school management pages.
# 4. Add activated_at to branch details view — shows formatted date or "Not Activated" when null.
# 5. Check former school design (commit e970f0ee) vs current — old design had Edit button in a separate row, no Status column, "Add New Branch" button, raw enum values. Current design is the correct improved version; nothing to revert.
# 6. Add global loading cursor — `useLoadingCursor(isLoading)` hook in `src/hooks/use-loading-cursor.ts`. Applied to all 10 pages that fetch or submit: school-mgt index/view/edit/branch pages, team-mgt tabs and admin pages, package-setup.
# 7. Prefill create school visible on all wizard steps — "Fill test data" button now lives at the top of the create-school wrapper (always visible in DEV mode regardless of current step); clicking it fills all steps and navigates to step 1.
 