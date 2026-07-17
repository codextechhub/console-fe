# AGENTS.md — console-fe

## Holistic problem solving

When the user asks for a problem to be fixed, trace it to its root cause and
fix the shared source of the failure where practical. Review adjacent flows,
callers, and equivalent modules for the same failure mode; do not stop at a
one-off patch that only hides the reported symptom. Keep the work within the
requested scope, preserve established behaviour, and add regression coverage
at the lowest shared boundary so future instances are prevented.

## Pre-ship review (`ship-check`)

When I say **`ship-check`** (or "run the ship-check") on a change, answer these
four questions about the code you just wrote — honestly and specifically, not as
a rubber stamp. Point at real files/lines, name concrete risks, and if the answer
to 1 or 2 is "no", say so and propose the fix. Don't claim "secure/efficient"
without naming *what* makes it so.

1. **Did you build this in the most secure way?**
   - Authz on every new endpoint/screen (RBAC key gates the *backend* view, not
     just the FE nav). Entity/tenant scoping — can a user read/write another
     tenant's rows by changing an id or `?entity=`?
   - What does the serializer/response expose? Flag raw `JSONField`/metadata,
     PII, secrets, internal ids that didn't need to leave the server.
   - Input validation and injection surface; never trust FE-only gating.

2. **Did you build this in the most efficient way?**
   - Query cost: N+1 (`select_related`/`prefetch_related`), missing indexes,
     unbounded result sets, pagination present where lists can grow.
   - Frontend: no request-per-keystroke (debounce search), no unnecessary
     re-renders/broad selectors/polling, no added latency on the hot path.
   - Is there a simpler implementation that does the same job?

3. **What regressions could this introduce?**
   - Permission/nav gating changes (who *loses* visibility?), shared-component
     edits, tag-invalidation changes, contract/shape assumptions, migrations.
   - List the blast radius explicitly; "none" needs justifying.

4. **What tests do we need before we ship it?**
   - Backend: the security-critical cases first — permission-denied (403),
     cross-tenant isolation, then the happy path + each filter/edge.
   - Frontend: empty `{}` / populated / error / forbidden render states; any new
     mutation flow. State whether the screen was actually driven with **real
     data** (`/verify-design`) or only type-checked — empty-state screenshots do
     NOT prove populated rendering.

Finish with a one-line **verdict**: ship / fix-first, and the single most
important thing to do before shipping.

## Verifying screens
After building or changing any screen, run `/verify-design` (project skill) to
drive it in the real running app and **look at the screenshots** — build-green ≠
works. It scrubs its own test-login rows afterward.

## Responsive views — every screen must work on phone AND desktop

Every screen you build or change must render well at desktop **and** small
widths — a user switching from PC to phone must never get a broken view.
Horizontal page overflow is a bug, full stop.

Build to the house conventions (full list: `docs/FINANCE_BUILD_NOTES.md`
§Responsive — they apply app-wide, not just finance):
- Never remove `grid grid-cols-1 min-w-0` from DashboardLayout's children
  wrapper — it stops nowrap tables stretching pages past the viewport.
- Lists: `DataTable`/`CustomTable` already render phone cards below `md`;
  dense report tables opt out per-table with `mobile="scroll"`.
- Toolbars/action rows get `flex-wrap`; tab strips `max-w-full
  overflow-x-auto` with `whitespace-nowrap` buttons; form grids
  `grid-cols-1 sm:grid-cols-N`; count-KPI strips `grid-cols-2 … lg:grid-cols-4`
  (money KPIs stay 1-col on phones); drawers `w-full sm:max-w-[…]`; fixed side
  rails/sidebars stack below `md` (`grid-cols-1 md:grid-cols-[260px_1fr]`).
- In a flex row, a `flex-1` wrapper needs `min-w-0` or descendant `truncate`
  silently stops working.

**Verify, don't assume.** After any screen work, alongside `/verify-design` run
the overflow probe:
`cd .claude/skills/verify-design && BASE_URL=<vite-url> ROUTES="/your/routes" node ./_mobile_audit.mjs`
It drives each route logged-in at 390px (phone) and 820px (tablet), screenshots
both, and reports page-level horizontal overflow with the offending elements
(`_net_probe.mjs` does the same for failing network calls). **Look at the phone
screenshots** in `/tmp/verify-design/shots-responsive/` — zero overflow with a
crushed side-by-side layout is still a fail. Desktop remains the design source
of truth; phone adapts (stack, wrap, cards) — never hide or truncate data away.
