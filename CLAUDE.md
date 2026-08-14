# CLAUDE.md - console-fe

## How-to guide alignment

`docs/HOW_TO_GUIDE_MASTER_PLAN.md` is the canonical plan and coverage contract for
the Console how-to system. For every product change, inspect whether it changes a
route, label, permission, prerequisite, field, action, status, validation rule,
confirmation, result, error recovery, workflow order, screenshot, contextual-help
mapping, search alias, support handoff, walkthrough target, or walkthrough branch.

When guide impact exists, update the affected guide registry record, article,
screenshots, contextual mappings, search metadata, walkthrough definition or stable
`data-guide` targets, tests, review date, and coverage ledger in the same change as
applicable. New user-visible workflows require a discoverable guide. Complex or
high-risk workflows require an interactive walkthrough unless the coverage ledger
records why one would be unsafe or unhelpful.

Walkthroughs may explain and highlight consequential actions, but must never
auto-submit financial postings, approvals, payments, imports, invitations,
permission changes, proxy sessions, or destructive actions. They must not bypass
authorization, validation, confirmation, or tenant scoping.

If a completed product change has no guide impact, say `Guide impact: none` with a
brief reason in the final summary. Documentation-only and Git-only requests do not
require this statement.

## Pre-ship review (`ship-check`)

When I say **`ship-check`** (or "run the ship-check") on a change, answer these
four questions about the code you just wrote - honestly and specifically, not as
a rubber stamp. Point at real files/lines, name concrete risks, and if the answer
to 1 or 2 is "no", say so and propose the fix. Don't claim "secure/efficient"
without naming *what* makes it so.

1. **Did you build this in the most secure way?**
   - Authz on every new endpoint/screen (RBAC key gates the *backend* view, not
     just the FE nav). Entity/tenant scoping - can a user read/write another
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
   - Backend: the security-critical cases first - permission-denied (403),
     cross-tenant isolation, then the happy path + each filter/edge.
   - Frontend: empty `{}` / populated / error / forbidden render states; any new
     mutation flow. State whether the screen was actually driven with **real
     data** (`/verify-design`) or only type-checked - empty-state screenshots do
     NOT prove populated rendering.

Finish with a one-line **verdict**: ship / fix-first, and the single most
important thing to do before shipping.

## Wrapping up: report in plain words

When you finish a task - a build, an investigation, a document, a round of
decisions - close with a plain-language breakdown rather than a wall of prose.
Short numbered lines, one point each, ordinary words. Assume I am reading it tired.

Use **only** the sections that actually apply, and **skip the ones that don't** -
an empty heading is worse than no heading, and never pad a section to fill it out.

- **What you now have** - the finished things, one line each. Only if something was
  produced.
- **What you decided** - decisions taken and locked, one line each. Only if
  decisions were actually made.
- **What we found wrong in the code** - real defects and gaps, grouped under short
  themes once there are more than about four. **Only if there are findings** - if
  nothing is wrong, leave this out entirely rather than writing "nothing found".
- **Where to go next** - the order of the next steps, and which of them are
  unblocked right now.

How to write it:

- Plain words beat precise jargon. "Purchases can approve themselves" lands;
  "`skip_if_no_approvers` permits terminal auto-approval" does not.
- Size things honestly in both directions - say when something feared turns out to
  be a one-line fix, and say when something small turns out to be load-bearing.
- Put the worst finding where it cannot be missed, even if that breaks the order.
- Never place resolved problems under a heading that suggests they remain broken.
  When all reported defects were fixed, say so plainly and omit any unresolved-
  findings section.
- Keep file/line references out of the breakdown; they belong in `todo.md` and in
  the detail above it.
- Don't re-explain what I already know from the conversation.

## Verifying screens
After building or changing any screen, run `/verify-design` (project skill) to
drive it in the real running app and **look at the screenshots** - build-green ≠
works. It scrubs its own test-login rows afterward.

## Responsive views - every screen must work on phone AND desktop

Every screen you build or change must render well at desktop **and** small
widths - a user switching from PC to phone must never get a broken view.
Horizontal page overflow is a bug, full stop.

Build to the house conventions (full list: `docs/FINANCE_BUILD_NOTES.md`
§Responsive - they apply app-wide, not just finance):
- Never remove `grid grid-cols-1 min-w-0` from DashboardLayout's children
  wrapper - it stops nowrap tables stretching pages past the viewport.
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
screenshots** in `/tmp/verify-design/shots-responsive/` - zero overflow with a
crushed side-by-side layout is still a fail. Desktop remains the design source
of truth; phone adapts (stack, wrap, cards) - never hide or truncate data away.

**Depth policy - phones are view + simple actions, not full parity.** Phone
users browse, read details, approve, and fill simple forms - those flows must
be genuinely good. Complex multi-line creation/editing (journal entry, invoice
lines, receipt allocation, bulk editors) stays desktop-first: on a phone it
must be *usable* (no overflow, nothing broken or unreachable), but don't spend
effort optimizing it or redesigning it phone-first, and never degrade the
desktop experience to make it fit.

## Fixing problems: root cause, not symptom

When I ask you to fix a problem, treat the reported issue as one *instance* of
a potentially wider defect - fix it holistically:

1. **Trace it to its source.** Ask why the bug exists - a wrong assumption, a
   missing invariant, a fragile pattern - not just where it surfaced.
2. **Fix the class, not the case.** If the same root cause can bite elsewhere
   (other screens, endpoints, callers of the same helper), fix it at the choke
   point they all share, or sweep the other occurrences in the same change.
3. **Name the root.** In the summary/commit, state the underlying cause and
   where else it applied, so the fix is reviewable as a class-fix, not a patch.

A fix that only silences the reported symptom while the source remains is not
done - that includes suppressing errors, special-casing one caller, or adding
a guard where the real problem is upstream. The goal is that future problems
from the same source never happen.

## Writing punctuation

Do not use em dashes (Unicode U+2014) anywhere in source code, comments,
documentation, tests, or user-facing copy. Use a comma, colon, parentheses, or
an ordinary hyphen (`-`), whichever reads most naturally.
