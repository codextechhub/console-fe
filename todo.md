## Undone (Ask questions for clarity where needed)

# 2. Paginate all the tables in the site, you can use a generic function for this if possible.
# 3. The activate account is showung authentication failed when someone new tries to get authenticated. Check what's the problem. Also when someone wants to log in, show error based of what happened, eith credentials failed or network or anything else
# 4. When a user logs in, I want the welcome back at the top to be Good morning, John or Good afternoon, John.
# 5. I want to work on the view structure for phone, tabs. That's for other viewing platform. Only the desktop view is okay now.
# 6. Remove the timer from the continnue session status card. The timer should still count but not visible to the user. Aslo, reduce the timer to 1 min.
# 7. I need the prefill create school to be also available on the tsaged versioin on render. I see it in dev mode but not when I am acccessing it from the cloud server. Tell/show  me why and fix

## Done

# 1. Remove Admin Role field from Add Branch (branch admin section) — role is prebuilt internally, field removed from UI, interface, validation schema, and API payload.
# 2. Remove Admin Role field from Create School Admin step — same reason, removed from UI, interface, validation schema, and API payload.
# 3. Add formatEnum utility — converts raw DB enum keys (e.g. FAITH_BASED, 3_TERMS) to human-readable labels across school management pages.
# 4. Add activated_at to branch details view — shows formatted date or "Not Activated" when null.
# 5. Check former school design (commit e970f0ee) vs current — old design had Edit button in a separate row, no Status column, "Add New Branch" button, raw enum values. Current design is the correct improved version; nothing to revert.
# 6. Add global loading cursor — `useLoadingCursor(isLoading)` hook in `src/hooks/use-loading-cursor.ts`. Applied to all 10 pages that fetch or submit: school-mgt index/view/edit/branch pages, team-mgt tabs and admin pages, package-setup.
# 7. Prefill create school visible on all wizard steps — "Fill test data" button now lives at the top of the create-school wrapper (always visible in DEV mode regardless of current step); clicking it fills all steps and navigates to step 1.
 