# AGENTS.md — console-fe

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
