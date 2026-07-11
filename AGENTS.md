# AGENTS.md — console-fe

## Study the prototype FIRST — before every design rebuild (required)

The finance/procurement consoles are rebuilt **screen-by-screen to match the
Codex Design prototype** `Vision-Finance-Board.html` (repo root, gitignored), in
our **house theme** (never the prototype's palette). Before rebuilding ANY screen:

1. **Render it — do not grep it.** The prototype is a *rendered app*; a raw
   `grep`/`rg` of the HTML returns **zero** hits for screen labels and will make
   you wrongly conclude "no design exists." Open it in a headless browser
   (Playwright, system Chrome — the `verify-design` skill's setup works):
   `file://<repo>/Vision-Finance-Board.html`, click the nav item for the screen,
   and screenshot.
2. **Study it exhaustively — every state, not just the landing view.** Capture and
   look at: the list/table + its **filters, tabs, KPIs, empty state**; the **detail
   drawer and EACH of its tabs**; every **create/edit modal or drawer** (open them
   in the prototype); **footer/row actions**; and any **multi-step flow**. Note
   exact labels, columns, field order, and button wording.
3. **Plan, then confirm.** Present the screen's structure as a short plan and get
   sign-off before building. Call out **honest adaptations** where our generic
   model lacks a prototype field (e.g. school-specific "Guardian type"/student
   sub-name) — adapt, don't fake.
4. Only then build (house theme) → `/verify-design` → scrub → commit in batches to
   `main`.

Honesty rules carry over: never fake an action (email-type actions are present but
disabled-with-tooltip until a service exists); "posting" panels recap the **real**
journal, never imply a second one. See `docs/FINANCE_BUILD_NOTES.md` for the full
workflow, conventions, theme structure, progress/roadmap and endpoint map.

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
