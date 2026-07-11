---
name: verify-design
description: Launch the app, log in as the seeded admin, drive screens in a headless browser, screenshot each, report console/page errors, and scrub the test-login rows from the dev DB. Use after implementing or changing ANY screen/design (any area of the app — finance, school management, organogram, roles, workflow, etc.) to verify it actually renders against the real backend, not just that it type-checks.
---

# verify-design — drive any screen in the real running app

Build-green ≠ works. This app's screens sit behind auth + a live backend, and
classes of bug only surface against real responses (empty-list `{}`, money
object shapes, missing fields, render-time crashes). This skill launches the
app, logs in, drives the screens you point it at, screenshots them, and reports
runtime errors — then leaves the dev DB exactly as it found it.

It is **not** tied to any one feature. Drive whatever you just built.

**Look at the screenshots.** A blank frame or the app's "Something went wrong"
error boundary is a failure, even if the run "succeeded".

## Inputs

`$ARGUMENTS` = optional space/comma-separated route paths to drive. If omitted,
the skill targets the screens you just changed (from the git diff). Examples:
- `/verify-design` → verify the screens in your current working changes
- `/verify-design /team-management /organogram` → verify those two
- `/verify-design HEAD~1` → verify the screens changed in the last commit

Env overrides (rarely needed): `BACKEND` (default `http://localhost:8000/v1`),
`EMAIL`/`PASSWORD` (default seeded super-admin), `DB` (default `cx_db`).

## Steps — follow in order

### 1. Preflight: backend must be running
The dev server can't be started for you (long-running + needs env). Check it:
```bash
curl -s -o /dev/null -w "%{http_code}" --max-time 5 -X POST \
  "${BACKEND:-http://localhost:8000/v1}/user/auth/login/" \
  -H "Content-Type: application/json" -d '{}'
```
- `400` → backend is up (it rejected the empty body). Continue.
- otherwise → STOP. Tell the user to start it:
  `! cd ~/Documents/Dev-Projects/GitHub/backend/apps && ../cx/bin/python manage.py runserver --settings=apps.settings.local`

### 2. Decide which routes to drive
- If the user passed route paths in `$ARGUMENTS`, use those.
- If they passed a git ref (e.g. `HEAD~1`), or passed nothing, find the changed
  screens and map them to routes:
  ```bash
  bash .Codex/skills/verify-design/changed-pages.sh ${ARG_REF:-}   # changed page/route files
  bash .Codex/skills/verify-design/list-routes.sh                  # the full route menu (reference)
  ```
  Map each changed `src/pages/...` file to its URL by cross-referencing
  `src/routes/routes-path.ts` (folder names ≠ URL segments, e.g. `school-mgt`
  → `/school-management`). Drive the parameterised detail routes only if you can
  supply a real id from the list views.
- If nothing changed and no routes were given, ask the user which screen(s) to
  verify (don't guess the whole app).

Hold the chosen paths as a space-separated string for step 6 (`ROUTES`).

### 3. Capture the DB baseline FIRST (before any login)
So every login below (preflight + the drive) sits above the baseline and gets
scrubbed in step 7.
```bash
bash .Codex/skills/verify-design/capture-baseline.sh
```

### 4. Confirm the login works
```bash
bash .Codex/skills/verify-design/preflight.sh
```
Logs in and (for finance-scoped screens) prints the ledger entities. Fails
loudly if creds are missing — then the user needs to seed the DB
(`backend/./reseed-dev.sh`).

### 5. Ensure the frontend dev server is running
```bash
grep -qE "Local:\s+http" /tmp/verify-design/vite.log 2>/dev/null && \
  echo "vite up: $(grep -oE 'http://localhost:[0-9]+' /tmp/verify-design/vite.log | head -1)" || \
  { mkdir -p /tmp/verify-design; (npm run dev > /tmp/verify-design/vite.log 2>&1 &); sleep 3; \
    grep -oE 'http://localhost:[0-9]+' /tmp/verify-design/vite.log | head -1; }
```

### 6. Ensure Playwright + drive the routes
Playwright lives inside this skill's own folder (under gitignored `.Codex/`),
so the project's `package.json` stays clean:
```bash
[ -d .Codex/skills/verify-design/node_modules/playwright ] || \
  ( cd .Codex/skills/verify-design && npm init -y >/dev/null 2>&1 && npm i playwright )

BASE_URL="$(grep -oE 'http://localhost:[0-9]+' /tmp/verify-design/vite.log | head -1)" \
ROUTES="<the paths from step 2>" \
node .Codex/skills/verify-design/drive.mjs
```
It logs in, screenshots each route to `/tmp/verify-design/shots/`, and lists
console/page errors. **Then Read each screenshot and judge it** — confirm the
screen rendered, not the error boundary.

### 7. Scrub the test-login rows from the dev DB
Logging in writes `vs_user_loginsession` / `vs_user_authattempt` /
`vs_audit_auditevent (LOGIN_SUCCESS)` and bumps `user.last_login`. Restore:
```bash
bash .Codex/skills/verify-design/scrub.sh
```
Deletes exactly the rows created since the baseline and resets `last_login`.
The drive is read-only, so business tables are never written.

### 8. Report
Which screens rendered cleanly, any console errors (quote them), any screen
showing the error boundary — with the screenshot as evidence. If a fix is
needed, the console-error text + the offending endpoint's real shape
(`curl …?entity=CODEX` with the bearer token) is the fastest way in.

## Notes
- **Read-only**: navigates + screenshots only; never submits a form, so no
  business rows are created — only the auth-login trail, which step 7 removes.
- Works for every area: pass any route, or let step 2 target your changes.
- Some screens are entity-scoped (finance/procurement) and need a ledger entity
  to show data; `preflight.sh` reports whether any exist.
