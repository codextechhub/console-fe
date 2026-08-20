## Undone (Ask questions for clarity where needed)

# Item 9's refusal path has no surface yet (found 2026-08-20).
The branch lifecycle 409s (`MAIN_BRANCH_CANNOT_LEAVE_SERVICE`,
`LAST_BRANCH_CANNOT_LEAVE_SERVICE`) can only be reached by closing, suspending or
deactivating a branch, and this console has no branch status-transition screen at all -
`transitionBranch` is defined in `school-mgt-api.ts` and called by nothing. The
promotion flow that makes those refusals followable now exists (branch detail →
Make Main Branch); the transitions themselves are still unbuilt product surface.

## Done

# 47. **An export run whose worker never came back is now reconciled (2026-08-16).**
`execute_run` already always left the row terminal, so no in-process path could strand
one - but a Celery worker killed mid-run never reaches that code at all, and the row it
was holding stayed RUNNING for good. THE PART THAT MADE IT WORSE THAN A SPINNER: a
non-terminal run counts against `CONCURRENT_RUN_LIMIT`, so three stranded runs stop the
whole tenant exporting, permanently, with nothing on any screen to cancel or retry.
`vs_exports.sweep_abandoned_runs` closes them on a half-hourly beat: RUNNING past
`ABANDONED_RUNNING_HOURS` (2), QUEUED past `ABANDONED_QUEUED_HOURS` (6) - the longer
window because a queued run waiting behind others is a queue working, not a broken one.
TWO DECISIONS WORTH KNOWING: a run the user had asked to cancel ends CANCELLED and
silently, because a failure notice for something they stopped themselves is noise;
everything else ends FAILED with `INFRASTRUCTURE`, which is retryable and notifies. And
a file the dead worker had already stored is PURGED rather than handed over - the bytes
are whole, but the run never recorded what is in them (no row count of its own, no
omission list), and offering a file this app cannot describe is the exact silence the
Export Centre exists to prevent. Eight tests, including the slot-exhaustion case and the
"a slow run is not a dead run" guarantee.

# 46. THE NOTIFICATION-SEED CAUSE IS NOW MOOT: the state-dependence is gone at the
source (backend `90e8867`, 2026-08-16). The loose end below was that the original 15
errors were never reproduced, so removing the state-dependence was only the most
PLAUSIBLE fix. That fix has now been done properly, which makes the question academic:
`NotificationEventType` rows arrive with the database via new migration
`vs_notifications/0008`, rather than each test class remembering to seed them.
WHY THAT WAS THE REAL FIX: the per-test seeding had spread to EIGHT call sites, and any
test that created a user and dispatched had the same silent hole whether anyone had
noticed or not - dispatch could not resolve the event key, `finalize_invitation` caught
and logged it, and the test passed while the invitation path never ran. It is the same
pattern named twice more this session: a rule each caller must remember is a rule the
next caller forgets. All eight hand-seeding sites were removed, so the suite passing is
itself the proof the migration works. TWO THINGS WORTH KNOWING IF YOU TOUCH IT: the
migration IMPORTS the registry rather than snapshotting it (the "never import live code"
rule is about the MODEL moving on, and that is handled by writing rows through
`apps.get_model` against a pinned field list); and its reverse deliberately deletes
NOTHING, because `NotificationSetting.event_type` is CASCADE and would silently take
every tenant's per-channel toggle with it, while the other two FKs are PROTECT and would
raise mid-rollback. Ten suites verified one app at a time: vs_notifications 85, vs_user
105, vs_exports 150, vs_payments 139, vs_finance 532, vs_admin_console 130, core 46,
vs_todo 21, vs_workflow 253, vs_procurement 485, all OK, and zero dispatch-resolution
tracebacks remain. THE ORIGINAL CAVEAT STANDS AS HISTORY, not as work: if those 15 errors
ever recur, capture the FULL output rather than just the `ERROR:` lines - the error
bodies are still what was missing. ORIGINAL ENTRY: **The notification-seed fix has an unproven cause (2026-08-15, from Done #41).** The
   original 15 errors were never reproduced: five-plus full runs of the same command have
   been green since, including two controlled A/B runs. Removing the state-dependence is
   the most plausible fix and is a real improvement either way, but it is not proven to be
   *that* failure's cause. If it recurs, capture the full output (not just the `ERROR:`
   lines) - the error bodies are what is missing.

# 45. **Unreadable in-app notifications, and monitoring copies in the clear (2026-08-16).**
   Two email defects found while building customer document email, both fixed at the
   choke point every caller shares rather than per-caller.

   **(a) In-app rows nobody could read.** Five billing events declare both IN_APP and
   EMAIL while only ever being sent to payers with no console account, so every
   invoice, receipt, credit note and overdue notice also created an in-app
   Notification with `recipient_user = NULL`. Fixed in `vs_notifications` dispatch,
   not by editing the five events: an `UnregisteredRecipient` is an email address and
   nothing else, so in-app is skipped for one. Registered recipients are untouched,
   which keeps every event ready for a customer portal without changing its channels.
   Skipped rather than recorded FAILED - nobody intended a message, and a FAILED row
   would be exactly as unreadable as the SENT one it replaced. 2 tests.

   **(b) CC -> BCC everywhere.** Every CC list on the platform is an internal
   monitoring mailbox. Copying it visibly put internal addresses in front of customers
   and vendors, told each recipient their mail is watched, and made reply-all a route
   into an internal inbox. `core.mail.send_email` now takes `bcc`, the notification
   task reads `metadata["bcc"]`, and finance and procurement both store and send a
   `bcc` list. Settings renamed (`EMAIL_BCC`, `PROCUREMENT_VENDOR_EMAIL_BCC`,
   `FINANCE_CUSTOMER_EMAIL_BCC`), each falling back to its old CC environment variable
   so a deployment that has not renamed its variables keeps the addresses it had.
   `PurchaseOrderVendorDelivery.cc` renamed to `bcc` (migration 0031) rather than left
   asserting the opposite of what it does. Verified in the real app: `cc=[]`,
   `bcc=['backend-test@codexng.com']`, one notification instead of two.


# 44. THE STOCK REORDER LABEL NEEDED NO FIX - THE SCREEN IT LIVED ON NO LONGER EXISTS
(closed 2026-08-16 by looking, after the backend fixed its half). The workaround was an
"On hand (entity)" column label plus an explanatory line, carried because a store-scoped
reorder report narrowed which rows appeared while still reporting entity-wide quantities.
Commit `25647c3` ("drop the two stock reports, put the store on the list") had already
DELETED both the reorder and valuation report screens, and `a9218e0` cleaned up the route
that outlived them. The behaviour now lives on the inventory list, which passes
`location` and lets each row report that store's own on-hand, unit cost, value and
reorder status; `inventory.tsx:112` says exactly that, and names the deleted screens as
the reason. So the label went out with the screens that carried it: there is no such
label, no such screens and no reorder-report endpoint in the app today.
NOTE ON HOW THIS ENTRY CAME TO EXIST, because it is the fourth stale note this pass:
it was written the same day, from Done #28, which describes screens a later commit
deleted. The item was written as "confirm, then remove" rather than "remove", which is
the only reason it cost a search instead of a broken screen. Verify the file exists
before writing a task about editing it. ORIGINAL ENTRY: 1. **The stock reorder report's entity-wide quantity workaround looks stale (raised
   2026-08-14 with the backend, re-checked 2026-08-16 and it appears FIXED their side).**
   The screen carries an "On hand (entity)" column label plus an explanatory line,
   because a store-scoped reorder report used to narrow which rows appeared while still
   reporting entity-wide quantities. `apps/vs_procurement/views/stock.py` now reports
   **that store's** quantity, value, unit cost and reorder state under `?location=`, and
   its docstring names the exact contradiction we raised. The old `reorder_row` /
   `valuation_row` helpers no longer exist under those names, so it was restructured
   rather than patched. Confirm which endpoint the screen actually calls and what it
   returns per store, then take the label and its explanatory line back out. Do not
   remove them on the strength of this note alone.

# 43. DECIDED 2026-08-16 by the user, so this is not work: an export that expires before
anybody downloads it is FINE, and needs no notice. The panel counts only files that are
still collectable, so an uncollected file ages out of its availability window and quietly
drops off. That was left open on 2026-08-14 as a known gap, on the reasoning that the
person who asked for the file is never told they missed it. The user's call is that this
is correct behaviour: a file nobody collected is not an event worth interrupting anybody
about, and a second notice ("an export expired before you collected it") would be noise.
Do not build that notice without a new decision. ORIGINAL ENTRY: 1. An export that expires before you collect it now says nothing (2026-08-14, left
   open knowingly when the "uncollected exports" fix landed in Done #34). "Exports
   ready to download" counts only files that are still collectable, so a file that
   ages out of its availability window simply drops off the panel: the person who
   asked for it is never told they missed it. That is right for THIS notice, which
   cannot honestly point at a file that is gone, but the gap is real. Closing it
   means a different notice ("an export expired before you collected it"), which is
   a new signal rather than a change to this one. Nobody has asked for it yet.

# 38. Two of the three remaining tables from the quick-export work are now done
   (2026-08-15): **Expense claims** got a real `finance.expense_claims` dataset +
   binding, and the **Transactions Log** now exports whichever direction is
   selected. **Settlement** turned out not to be the page-only defect at all -
   its endpoint returns the whole snapshot unpaginated, so its old CSV was
   complete; it gained server-rendered csv/xlsx/pdf (`?export=&view=`) for parity
   with the other finance reports rather than a dataset, which it cannot have
   (a computed reconciliation is not a queryset).

# 39. **Fixed in passing (2026-08-15), worth knowing about:** every finance report
   export button - Trial Balance, Income Statement, Balance Sheet, Cash Flow,
   Changes in Equity, Cost & Dimension Analysis, 18 buttons in all - had been
   returning a 400 and silently toasting "Export failed". `downloadReportExport`
   is a raw fetch, so it never got the `?tenant=` that RTK Query's baseQuery
   stamps on every other request. Confirmed in the browser before and after. The
   fix is in the one helper they all share. Anything else that downloads via raw
   fetch rather than the API layer needs the same treatment.

# 40. Three of the five removed "Export" buttons are now real (2026-08-15):
   **Invites** needed no dataset at all (an invite is a user row awaiting
   activation, so the existing `admin.users` binding covers it) and
   **School Management** got a new `platform.schools` dataset. Still without an
   export, by decision rather than oversight: **Roles**, **Permissions** and
   **Permission groups** - these are configuration, not records, so they belong
   in the config snapshot export (`config.export.create`) if anywhere.

   `platform.schools` carries a documented exception worth re-reading before
   anyone touches school permissions: its base queryset is `School.objects.all()`,
   NOT tenant-fenced, so the `platform.schools.view` key is the only boundary.
   That mirrors the existing SchoolListView and was chosen deliberately so the
   file matches the screen. Keep that key a platform-actor grant.

# 41. **Notification-seed dependency in vs_user tests - fixed 2026-08-15, with one
   loose end.** `UserBranchAssignmentTests` and `UserBranchTenantGuardTests`
   created users on a test database whose `NotificationEventType` registry is
   empty (no migration creates those rows - only `seed_notification_event_types`,
   which `build.sh` runs on every real deploy, so environments were never at
   risk). Dispatch could not resolve the invitation event key,
   `finalize_invitation` caught and logged it, and the tests passed anyway - so
   the invitation path was never actually exercised, and every user-creating test
   printed error-level tracebacks. Those tracebacks are what made the run that
   reported 15 errors unreadable, and what I initially misread as the failure
   itself. Both classes now seed the registry, and so does `_ExportFixture` in
   vs_exports - a completing export run notifies its owner
   (`export.run_completed` / `export.run_failed`, plus `task.completed` from the
   BackgroundJob), so the export suite had the same hole in the same shape.
   Measured: 264 tracebacks across `vs_exports vs_schools vs_user` -> 0, with all
   317 tests still passing.

   **Loose end, stated honestly:** the original 15 errors were never reproduced -
   five-plus full runs of the same command have been green since, including two
   controlled A/B runs. Removing the state-dependence is the most plausible fix
   and is a real improvement either way, but it is not proven to be *that*
   failure's cause. If it recurs, capture the full output (not just the
   `ERROR:` lines) - the error bodies are what is missing.

# 42. Backend brief 2026-08-14 - **CLOSED.** All nine items done on our side, and both
   findings we raised back are now fixed on the backend too (`8966ff2`): the reorder
   report reports the store you asked about, and publishing an adjustment ladder now
   registers and grants the submit key that ladder makes load-bearing. The reply doc
   (`backend/docs/frontend/2026-08-14-frontend-reply-approval-gate.md`) has nothing
   outstanding in it and **is safe to delete**.
   - **Items 1, 2, 4 - DONE** (see Done #30).
   - **Item 7 - DONE** (see Done #29).
   - **Item 5 - DONE** (see Done #29).
   - **Item 6 - stock reports. DONE** (see Done #28), except one thing left with the
     backend: `reorder_row` reads the stock master, so a store-scoped reorder report
     narrows which rows appear but still reports entity-wide quantities, unlike
     `valuation_row` which reads the balance. Labelled honestly for now; if they fix it,
     the "On hand (entity)" column label and its explanatory line come back out.
   - **Item 8 - DONE** (see Done #32).


# 37. One formatBytes for the whole app (2026-08-15) - there were four copies in three mutually incompatible variants, and nothing pinned any of them, which is exactly how they drifted. They disagreed on two things: **zero** (`export/format.ts` said "0 KB", the other three said "0 B") and **whether a round value keeps a decimal** (the import wizard alone printed "12.0 KB"/"50.0 MB" where every other screen printed "12 KB"/"50 MB", because its copy had dropped the `n < 10` guard the others carry). So the same file could be described two ways on two screens. Canonical version now lives in `src/utils/format-bytes.ts` with the `export/format.ts` behaviour, and all 8 consumers import it from there. **Deliberately not re-exported from `export/format.ts`** - leaving a second import path for the same function is the thing being removed; `format.ts` keeps its four date/duration helpers and says where formatBytes went. **Output actually changes on three screens**, all of them toward the majority format: Import Batches list, Batch detail and the import wizard now print "0 KB" rather than "0 B" for a zero-byte file, and the wizard drops the spurious decimal on anything at or above 10 of a unit (its 50 MB upload-limit error message included). 7 new tests pin every case the old copies disagreed on, so the next edit has to change a test on purpose rather than change a screen by accident - the absence of those tests is the actual root cause here, not the copy-paste. Driven in the real app: attached a 12,276-byte file to the wizard and it renders "12 KB" (was "12.0 KB"); batches list and batch detail still read "154 B" against the seeded batch. Nothing submitted, no import batch created, dev DB restored to its exact pre-run state. 526 FE tests + build green.

# 36. Documents - a requirements library the team can read without cloning the repo (2026-08-15) - the 42 .docx files in `backend/docs/frd/` (the cross-module MRD and 11 module FRDs) were reachable only by cloning the backend, so nobody outside engineering could read a spec. New CX-only screen at `/documents`: search, KPI strip, one row per document with its current version, and a drawer holding the full version history. Everything downloads and nothing previews, which is what was asked for and also free - .docx cannot render in a tab, and the endpoint sends `Content-Disposition: attachment`.

**Served from git, not the database.** The repo is checked out whole on the server, so the registry reads the deployed working tree (`documents.py`) and derives every document from the filename convention the generator already writes. No import step to drift, no 62 MB of blobs in Postgres, and publishing a new document is a commit. Stated trade-off: nothing is uploadable at runtime, so a non-engineer cannot publish a PDF without a PR - that would be a different feature (model + upload endpoint + DB storage), not an extension of this one.

**One row per document, not per file** - 42 files collapse to 12 rows. Version sorting compares integer components, because string ordering puts v2.9 above v2.15 and the tree contains exactly that case (plus v2.9.1, v2.6.0). The one pre-convention filename (`01_School_and_Branch_Management_FRD_v1.0.docx`) is folded into M01's history by a second regex rather than dropped; a version that exists but is invisible is worse than an oddly named one. No "last updated" column on purpose: the only date on disk is the checkout time, identical for all 42 files on a deployed server, so a version label is the honest recency signal.

**The security finding, which the tests caught rather than the design.** "CX staff only" was first implemented as `platform.documents.view` alone, on the reasoning that platform-module keys are seeded only to codex-tenant roles. That reasoning is wrong: `HasRBACPermission` matches the key *string* against roles on the caller's own tenant and never checks which tenant that is, so a school-tenant role carrying the key passed - the test asserting a school admin gets 403 failed with 200. This is a known-real scenario in this codebase, not a hypothetical (`vs_rbac/views.py:1052` already defends the override keys against "a school role that somehow carried a platform key"). For most `platform.*` endpoints the gap is covered downstream because their rows are tenant-scoped and a school actor sees nothing; it is **not** covered here, because the library serves global CX-internal specs describing every customer's system. Fixed with `IsPlatformActor` in `vs_admin_console/permissions.py`, reading the actor's **home** tenant kind, never the asserted `?tenant=` - written as a reusable class, not an inline check, since the same gap will exist for any future non-tenant-scoped platform surface. Also deliberately **not** gated on `user_type == CX_STAFF`: the model documents that field as an inert marker that must never drive authorization.

25 backend tests (authorization first, then the parser against a temporary docs tree so they stay green when a document is added or revised), 130 green across vs_admin_console. FE 519 tests + build green. Driven in the real app: downloaded the current MRD (1,398,630 bytes, `PK` magic - a genuine docx, not an error page), opened the drawer to all 16 versions, downloaded v2.9.1 through `?version=` and got a different file, search filtered to 1 row, zero console errors. **Responsive fix found by looking rather than by the probe**: the overflow audit passed at 820px because DataTable scrolls internally, but the Download action was clipped off the right edge - `cardBreakpoint="lg"` now gives tablet the phone cards. Guide impact handled in the same change: new published article `platform.requirements-library`, route added to the guide catalog, action-palette entry `view-requirements-documents` registered (the guide validator rejected the actionId until it existed), coverage ledger row added with the walkthrough marked not-required and why. PERMISSIONS_AUDIT.md updated with the nav row and a §2 section spelling out why the key alone is not the boundary.

# 35. Dashboard action-first rebuild (2026-08-12, recorded here 2026-08-14) - this had been sitting under Undone marked COMPLETE since the day it shipped, with no Done entry, so it was the only record of the work and it was in the wrong place. What it delivered: a quick-actions row; the worklist and aging treatment; module signals (fiscal runway for the worst entity, draft journals, POs awaiting receipt, webhook failures in 24h, and the caller's own failed jobs), each permission-gated and omitted entirely when quiet, red before amber; deep links that seed a destination screen's filters through `useFilterParam` (tasks, tickets, submissions, notifications); a local recent-opens store behind "Pick up where you left off", written by the school, ticket, approval and submission detail screens; and the final pass that renamed the signals strip to "Action needed" with stat cards and CTA verbs, moved every strip header onto the house section-heading style, compacted the metric grid to one-line tiles below the worklist, and dropped "Your workspace" to a chip row at the page foot. This is the foundation everything since has stood on: the ownership split (#31), the ranking and self-opening panel (#34), and the counter fixes (#30) are all corrections to rules this rebuild established rather than to its structure.

# 34. The last three Today's focus items, built by three parallel agents and merged here (2026-08-14) - all three serve one rule from different ends: **doing the work clears the row, and the loudest thing on screen should be the thing that is actually late.** **(a) Ranking.** The four queue boxes rendered in a hard-coded order, so a 9-day-old approval sat under a task due next week. `rankQueues` scores each box by the "lateness" of its most pressing item - milliseconds past the moment it became actionable - on one scale shared across kinds, so a 9-day wait and a 9-day-overdue task read as equally pressing while anything merely due soon scores negative and sinks. Empty boxes drop out, ties keep the declared order, and a missing timestamp scores -Infinity so an undated item can never win by accident. Honest limit, stated in the code: a box shows 3 items while its count can be larger, so the ranking judges only what the reader can see. 7 tests. **(b) Opening itself.** The panel started collapsed and opened only on hover or a tap, so on a phone an open incident could sit entirely unseen. It now opens when a red row is present, through a pure reducer (`panel-open-state.ts`, 7 tests) rather than inline state, because the interesting part is an edge case: the payload lands AFTER the first render (a useState initializer can never see it) and the screen refetches on focus and polls every 2 minutes (a naive effect would keep springing the panel open in the reader's face). It opens on the RISING EDGE of red only - the frame where red first appears - so a poll returning the same red row is a no-op and a Minimize stands, while a red row that cleared and came back is genuinely new and opens it again. **(c) Exports you can clear.** "Exports ready to download" counted `BackgroundJob` rows SUCCEEDED in 24h, so downloading the file changed nothing and the row sat there for a day regardless. The job-to-output link runs the other way (`ExportRun.background_job`, `related_name="+"`, so there is no reverse accessor); attribution now goes through `ExportRun.requested_by`, always set and indexed. The signal counts export files still collectable and not yet collected (`download_count=0`, not purged, inside the availability window) - one COUNT over a two-table join on the landing path. The 24-hour window is gone deliberately: it cleared the counter for the wrong reason, the same defect in slower form. Scoped to exports because they are the only job kind that produces a downloadable artefact, which is what the copy promises. **Renamed `jobs_succeeded_24h` -> `exports_uncollected`** rather than quietly changing what a key means (same call as `open` -> `active` in #30); row copy now reads "Exports you have not downloaded yet". **What the merge turned up**: all three agent worktrees were branched from an OLD commit (pre-split), so every diff had to be ported by hand - two of them had rewritten regions that no longer exist. Also removed a pre-existing copy-paste duplicate of `APPROVAL_ITEMS_LIMIT`/`RETURNED_ITEMS_LIMIT` in `overview.py` (harmless, same values, but it sat in the file being edited). The preamble line "What is yours to clear, then what to keep an eye on" is gone at the user's request - the group headings already say it, so it only pushed the first row down; the all-Watch case keeps its own sentence because no heading conveys "nothing here is yours". Guide updated in the same change: two sentences claimed the panel opens only on hover or Maximize, and the counts line now names downloading an export. Driven in the real app - seeded a failed job, the panel auto-opened with no hover and the red row landed in "Yours to act on", Minimize then held, and the exports row renders against 4 genuinely uncollected files in the dev DB. FE 506 tests + build green; backend 185 tests green (vs_admin_console + vs_exports). **Left open deliberately**: an export that expires uncollected now goes silent, because a "ready to download" notice cannot point at a file that is gone; telling someone they missed it is a different notice (noted under Undone #4).

# 33. The help button opens a ticket, not a reading list (2026-08-14) - the headset icon in the header opened a guidance sheet, and raising a ticket was a button at the bottom of it. That is backwards for what people press it for: someone stuck wants to tell us, and being handed articles first reads as being deflected. The icon now opens the ticket form directly; the page's guides sit in the panel's bottom-left as a quiet secondary option carrying its own count ("1 guide for this page"), because a number is a reason to look and a bare link is not. Coming back from the sheet, its primary button is now "Back to your ticket" rather than "Create support ticket" - the draft is still there. Dropped a "Before raising a ticket" caption I had first put beside the link: it re-asserted the old priority as a nudge, which is the thing being removed. **Guide impact handled in the same change** (per the coverage contract): the console-basics walkthrough step said "Open page-matched guides, available walkthroughs, troubleshooting, or a support ticket from here" and would have been describing the old product; both it and the article's Get help card now lead with the ticket. Walkthrough version deliberately **not** bumped - the step's wording changed but no step was added or reordered, and re-running the whole walkthrough for everyone over one sentence is not worth it. Driven at desktop and 390px: the form is what opens, the guides link is reachable in both, no overflow.

# 32. Ticket context cannot produce a payload the API refuses (2026-08-14) - closes brief item 8. The context we attach to a support ticket raised inside the console (guide, route pattern, product area, app version) was sent as the page computed it, but the endpoint validates all four **strictly and rejects an unknown value by failing the whole create** - so a bad field would lose the ticket, on a screen the user came to for help. `routeProductArea` emits `"Account access"` for the four auth routes, which is not among the API's 19 accepted values ("Account" is). Not reachable today (the composer lives only in the signed-in layout, those routes are signed-out), which is exactly why it was worth fixing before someone adds a support link to the login page. Fixed at the **boundary rather than in the map**: `buildSafeTicketContext` now validates every field against the API's own rules and drops or translates rather than sending - `"Account access"` → `"Account"` via an alias table (the friendly label is also shown on screen as "Guidance matched to ...", so flattening it at the source would have made the UI read worse), route patterns rejected if they carry a digit/query/fragment, guide ids and version strings checked against the same regexes the serializer uses. That fixes the class: any future mapping mistake costs a missing field instead of a rejected ticket. 4 new tests, including a sweep that runs **every catalogued route** through the builder and asserts the result is always acceptable. The old test named "uses backend-approved product-area labels" was asserting the bug; renamed and split so it now checks the display label and the wire value separately.

# 31. Today's focus reads in two groups, and the guide says so (2026-08-14) - the panel promised "everything waiting on you" and then listed eleven things that were not: draft journals, roleless users, open RFQs, unpaid vendor bills, expiring contracts, platform incidents. On the seeded admin the one task actually assigned to them sat *below* five org conditions. Every row and card now carries an `ownership` (`mine` | `watch`) decided where it is built, not guessed in the view: your own jobs are yours because the backend already scopes them to you, incidents are watch even though they are the loudest red on the page. **Yours to act on** leads with the queue boxes (approvals, delegate cover, returned, tasks - they carry real items, so they answer "what do I open now" in a way a counted row cannot), then your counted rows; **Watch** follows. Severity order is preserved inside each group, so a red row is still first among its own kind while a platform-wide incident no longer outranks the approval actually waiting on the reader. The header summary changed from "N signals · M work queues" (shape) to "3 for you · 5 to watch" (ownership), and with nothing personal the intro says so plainly rather than claiming work: "Nothing is waiting on you personally. Here is what is going on around you." 3 new model tests incl. one that nothing is lost in the split. **Guide updated in the same change** (the point of the coverage contract): new `todays-focus` section in `get-started-with-console` covering both groups, what the counts do and do not include, the colour vocabulary, self-refresh, and the dismiss rule - "you can put information down, but not problems". Registered in the guide's section list and search aliases; the console-basics **walkthrough gained a step** on `overview.action-center` (new stable `data-guide` target, version 1 -> 2), branching around the panel because it renders nothing on a clear day. Two engine tests updated for the new step order and the version bump, and one of them was rewritten to bump relative to the real version so the next bump does not silently stop testing anything. Driven in the real app at both widths with the groups populated and with only Watch present; walkthrough launched and stepped through to the new step; guide article and its on-this-page nav confirmed. 488 FE tests, build green, phone clean at 390px.

# 30. Ticket counters that clearing your queue actually clears (2026-08-14) - reported as "I cleared my assigned tickets and Today's focus still shows them". Not a caching problem: `_tickets()` counted `Q(assignee=user)` with **no status filter**, so every ticket ever assigned to you kept counting, resolved and closed included - the row could only be cleared by un-assigning yourself, while its copy claimed they were "waiting on your reply". Same defect one line up in the other direction: `open` counted `status=OPEN` only, so picking a ticket up dropped it out of the workload. **Same query shape, same bug, in the Support screen's own "Assigned to me" KPI** (`TicketDashboardView`) - fixed as one class: `ACTIVE_TICKET_STATUSES` (OPEN/ASSIGNED/IN_PROGRESS) in `vs_tickets/constants.py` is now the single definition every person-scoped workload number filters by (`assigned_to_me`, `requested_by_me`, the overview's renamed `active`), while `total` and the by_status/by_priority breakdowns stay whole-population. The list gained the matching `?state=active` and `?assignee=me` so a card lands on exactly the rows it counted, both surfaced as real controls ("Unresolved", "Assigned to me") rather than invisible URL state. **Freshness, separately**: the overview query only refetched on this tab's own mutations - no `refetchOnFocus`, no poll - so anything changed by someone else, another tab or Django admin stayed stale until reload; now focus-refetch plus a 2-minute poll skipped while unfocused. **Blue notices are dismissible** (`notice-dismissals.ts`, 7 tests): local per user, and deliberately narrow - one row, at one figure, for the rest of the local day, so a changed number brings it back and "dismiss" can never become "never tell me again". Red and amber rows have no dismiss. **Bug found while building**: `useFilterParam` stripped its key from the render's params snapshot, so two deep-link params on one screen fought - each write put the other's key back and the first one lost (`?status=ACTIVE&assignee=me` left `?status=ACTIVE` in the bar). Fixed at the hook for all 5 call sites by stripping every key consumed in the commit. The action-centre toggle also had **no accessible name below `sm`**, where its label text is hidden. Backend: 70 tests pass incl. 5 new (finished work excluded from both counters, list filters matching the counters, `assignee=me` unable to read another user's queue). FE: 485 tests, build green. Driven in the real app against the dev DB's actual case - a RESOLVED ticket assigned to admin, which is exactly what was stuck on the dashboard: card reads 0, no row; flipped live it reappears and the deep link lands on that one ticket with both filters shown. Phone clean at 390px, zero overflow. Guide impact: none - no article documents the ticket-list filters, and console-basics only describes hovering/maximizing Today's focus, which is unchanged.

# 29. Close-checklist severities + shared-template reach (2026-08-14) - brief items 5 and 7. **(a) Item 5**: a *failed* non-blocking row rendered identically to a failed blocker, so month-end would have stopped for a GR/IR balance that is legitimate by design. Three states now read apart - passed (green check), blocks the close (red X, red card, "Blocks the close"), warning only (amber triangle, amber card, "Warning only" plus the line "This does not stop the close. It is here so the figure is seen first"). Added a banner naming how many blockers must pass, and **fixed a dead branch**: the post-close toast keyed off `checklist.passed`, which ignores non-blocking rows *and* is always true on a success (a failed blocker raises server-side rather than returning), so "closed with checklist warnings" could never fire - it now keys off the failed warnings and carries the single warning's own detail. Check names get real labels (`grir_explained` rendered as "Grir explained", `ap_reconciled` as "Ap reconciled"). 9 unit tests on the pure severity/message rules. Verified against real CODEX data, which already has the exact mixed case: AP reconciles at 257,000,000 both sides while GR/IR carries 168,000,000. **(b) Item 7**: the adoption panel and compare drill-down were already built (`c174478`) but sat on the template *detail* page; the brief asks for the count on the **editor**, "where they cannot miss it before they hit save". Added `TemplateReachChip` beside the Update button and `TemplateReachNotice` in the form, both reusing the existing adoption query and both rendering nothing on a refusal. Copy handles the real edges honestly (0 following / 1 adjusted / 1 customer reads "No school picks this up right now. The only school on the platform runs its own version, so this edit reaches nobody today", not "0 of the 1 schools"). **Tooling gotcha found**: `tsconfig.json` is a solution-style config with `"files": []`, so **`npx tsc --noEmit` compiles nothing and always passes** - it silently missed both an invalid prop and an undefined identifier that crashed the page. Use `npx tsc -b` or `npm run build`.

# 28. Stock reorder + valuation report screens (2026-08-14) - both endpoints had been wired into the API slice for months with **no screen consuming them**, so the brief's "add a location filter to both reports" had nothing to filter. They exist now as two Analytics sections (`stock-reorder`, `stock-valuation`) behind `procurement.report.view`, with an optional store that hides itself unless the entity has more than one active store. **The existing types were wrong and would have rendered `[object Object]`**: these two reports carry money as the reports' `{kobo, naira}` pair rather than the bare integer the transactional endpoints use, and both paginate their rows while keeping the report object in `data` - a third envelope shape neither `ApiEnvelope` nor `PaginatedEnvelope` describes (now `PaginatedReportEnvelope`). Valuation uses the server's `total_value`, computed across every row, rather than summing the page. Two honesty calls: a reorder report with nothing priced says "Not yet known" rather than ₦0.00 (which reads as *free*), and an unpriced row shows a dash rather than a zero that would understate the total. **Backend inconsistency found**: `reorder_row` reads the stock master while `valuation_row` reads the balance, so a store-scoped reorder report narrows *which* rows appear but still reports entity-wide quantities - LTO-9 at ANNEX correctly lists as short while showing "On hand 25" against a reorder point of 20. Labelled "On hand (entity)" with an explanatory line and raised with the backend rather than papering over it with a second copy of their selection logic. Driven in the real app: valuation reconciles against the API entity-wide (₦3,817,500) and at ANNEX (₦200,000, at that store's own ₦20,000 average vs the ₦18,500 roll-up); phone clean, zero overflow. Note `npx tsc --noEmit` alone did **not** catch an invalid `EmptyState` prop - only `npm run build` did, so run the build before shipping.

# 27. Non-PO match fix + stock held per location (2026-08-14) - first two unblocked pieces of the backend brief. **(a) `NON_PO_BLOCKED`**: `isBlockingInvoiceVariance` listed only `UNDER_RECEIVED`/`OVER_BILLED`, so with `allow_non_po_invoices` now defaulting off every non-PO bill rendered as a passed match with a plain Post button that 409s. Widened to the backend's `MATCH_BLOCKING` set, added `blockingMatchReason` copy per state, gave `PRICE_VARIANCE` its own amber non-blocking treatment (it does **not** need an override - GR/IR clears at the receipt basis and the difference lands in 5160), stopped `MatchPanel` short-circuiting non-PO bills before the blocked banner, and disabled the vendor-bill form's "Direct invoice" tab when the entity's setting is off (fails open when the caller cannot read procurement settings, since the server gates the post either way; an existing direct draft stays editable). The backend's own `seed_procurement_demo` is broken on main for the same reason - it posts a non-PO bill and dies on `NON_PO_BLOCKED`. **(b) Stock locations**: new `stock-locations` / `stock-balances` endpoints + types, `useStockLocations` as the single choke point for the platform rule that a school with **zero or one** active location sees none of this (no picker, no column, no chip, no empty state), a Locations admin screen (create/edit, make-default as an action not a checkbox, deactivate with the "still holds stock" refusal opening that store's balances, the migration prompt when only `MAIN` exists), a per-location breakdown under the item's headline roll-up totals, a required store picker on issue/adjust pre-filled with the default, and a store column + filter + "Bal. at store" relabel on the ledger. No Transfer button - there is no transfer document. **Bugs found and fixed while building**: `LocationBalancesDrawer` read `location!.id` in its query args, which RTK Query evaluates even when skipped, crashing the page on first paint (now `skipToken`); and `shortDate` appended `T00:00:00` unconditionally, so any full ISO timestamp became an Invalid Date and the `RangeError` took the whole procurement page to the error boundary - fixed at the helper (all 54 callers) to accept both shapes and return "-" rather than throw, with 5 tests. Driven in the real app against seeded data at one store and at two: roll-up 25 @ ₦19,100 = ANNEX 10 @ ₦20,000 + MAIN 15 @ ₦18,500, differing unit costs correct and explained; over-issue names where the stock actually is; phone clean, zero overflow. Guide registered (`procurement.stock-locations`, draft - the whole procurement guide category is unwritten); PERMISSIONS_AUDIT.md updated (no new keys).

# 26. Editing a rule ladder from the Dynamic Role tab (2026-08-13) - "Edit rules" opens the builder's ladder editor in a sheet and republishes the template on save. There is no patch-one-stage endpoint, so the save re-reads the template first and resends the rest verbatim; `templates/components/template-payload.ts` owns that mapping (`stageToPayload` / `templateToPublishPayload` / `isCentralTemplate`) with 7 unit tests covering per-source fields, quorum + inclusion-condition round-trip, rule renumbering and the unknown-stage no-op. Central templates stay read-only in the tab: publish upserts on the caller's tenant, so republishing a shared template would fork a tenant copy that wins the cascade - the override is the sanctioned path, and the guard is re-checked against a fresh read at save time. Rule validation and read->form conversion moved into `stage-form.ts` (`validateRules`, `rulesToForm`), so builder and tab check the same things. **Bug found and fixed while building**: the FE `WorkflowTemplate` type called the owner field `school`, but the serializer returns `tenant` - every reader got `undefined`, so the templates list and detail labelled every tenant template "Platform" scope and the Dynamic Role tab treated *every* ladder as central. Verified in the real app: ladder edited (threshold changed, rule inserted, reordered), sibling stage kept QUORUM/3 + RETURN_TO_REQUESTER + skip=false + its inclusion condition, both routes intact, still exactly one template with that key (no fork); central ladder shows no edit affordance; phone clean.

# 25. Workflow approver rebuild (2026-08-13) - the FE caught up with the engine's new approver model. `vs_workflow` had replaced `RBAC_PERMISSION`/`approver_permission_key` with `ROLE` (`approver_role_key`) and added `WORKFLOW_GROUP`, `DYNAMIC_ROLE`; the builder was still publishing the dead field, so every publish 400'd. Now: (a) **Approver Groups screen** (`workflow/approver-groups/groups-tab.tsx`) - rail, member rows resolved live via `GET /approver-groups/{id}/resolve/`, effective-approver panel, one add-member sheet across people/roles/positions, deactivate/delete with the 409 IN_USE path; keys `workflow.group.view/manage` (600401/600408). (b) **Template builder** on the new contract - role picker, approver-group picker, organogram unchanged, and a dynamic-rule ladder editor (ordered rules, "Otherwise" fallback with in-form checks mirroring the publish validator, JSON escape hatch for conditions the simple editor cannot express) plus a live tester through `POST /templates/preview-approvers/`. (c) **Dynamic Role tab** - every DYNAMIC_ROLE stage across templates with its ladder, holder counts, no-fallback warning, "Try a request" evaluator, and the central-template override (`/workflow/stage-approvers/`, create + remove). Backend fix: migration `0006` was non-appliable on Postgres (data pass + `RemoveField` in one transaction) - now `atomic = False`. All driven in the real app incl. a real publish/edit round-trip; phone + tablet clean.

# 24. Code splitting + tests + CI (2026-06-11) - closed the three structural gaps left open by the deep review. (a) Route-level code splitting: all 85 page imports across the 11 route files converted to `React.lazy()`, single Suspense boundary in `src/routes/lazy-root.tsx` (kept eager along with RouteError/Authenticated so the loading/error shell can never fail to load), plus a `vendor-react` manualChunks split in vite.config.ts. Main bundle: 2,491 kB (gzip 726) → 405 kB entry + 144 kB cacheable vendor (initial gzip ≈ 230 kB incl. layout chunk); each page is a 14–60 kB on-demand chunk; recharts (343 kB) loads only on chart pages; the >500 kB build warning is gone. (b) Tests: Vitest + happy-dom (`vitest.config.ts`, `npm test`); 35 unit tests covering `src/utils/jwt.ts` (base64url decode incl. the atob-crash case, expiry buffer), `tokenRefresh.ts` (single-flight, 401/5xx/network outcome mapping, invalidation discarding in-flight rotations, cookie persistence), `endSession.ts` (full teardown, banner-after-clear ordering, refresh blocking) and `helpers` formatting. (c) CI: `.github/workflows/ci.yml` runs tsc → eslint --max-warnings 0 → vitest → vite build on every push/PR to main. Full sequence verified locally.

# 23. Deep-review fix pass (2026-06-11) - worked through all findings from the XVision FE deep review, cross-checked against the backend repo. Critical: JWT decode now base64url-safe via shared `src/utils/jwt.ts` (SimpleJWT payloads with UUID/full_name claims made the old `atob()` throw, breaking expiry detection + proactive refresh); Redux DevTools disabled in prod (`import.meta.env.DEV` - `NODE_ENV` doesn't exist under Vite); auth cookies now set with `sameSite=strict` + `secure` via single `setAuthCookies()` writer. High: TopProgressBar silent-list fixed to the real `*Bell` endpoint names (notification polls no longer flash the bar; typed selector, CSS-keyframe animation, no setState-in-effect); router-level ErrorBoundary (`src/pages/route-error.tsx`); `src/vite-env.d.ts` typing `VITE_*` env vars. Medium: all session teardown paths consolidated into `src/utils/endSession.ts` (the route-change refresh path previously missed `markSessionInvalidated`); Authenticated gate constants now imported from `use-session-timeout` (the local mirror had drifted: 14+1 vs 5+10); gate evaluation moved to a once-per-mount lazy initialiser; header sticky/relative conflict removed; activity listeners throttled to 1/s; members/invites search page-reset now happens in-render (no stale-page fetch). Overview: "Active School Users" relabelled "CX Team Members" (it counts console staff), fabricated trend chips removed from real cards, hard-coded figures/charts marked with a "Sample" chip. Cleanup: eslint 88→0 problems (purity via new `useNow()` 30s-tick clock hook, render-phase adjustment pattern replacing setState-in-effect, typed authSlice payloads, removed `as any` Badge casts); deleted dead `use-inactivity.ts` and 13 unused helpers; removed phantom `end_reason` read (not in `ImpersonationSessionSerializer`); stripped 17 `"use client"` directives; header avatar shows initials instead of one shared stock photo; greeting uses `first_name`; Impersonations + Change Requests nav items enabled (pages and `vs_admin_console`/RBAC endpoints are live; PERMISSIONS_AUDIT.md updated). `tsc`, `eslint` (0/0) and `vite build` all pass. Still open (structural, not bugs): route-level code-splitting (2.49 MB bundle), tests, CI.

# 22. "New Import" upload wizard - VERIFIED ALREADY BUILT (this todo note was stale). `src/components/custom/import-wizard.tsx` is a complete 7-step flow (template pick → file upload via `useCreateImportBatchMutation` POST `/import/batches/` → header review → validation → issue review → confirm → import progress → done). Reachable from the Batches list "New Import" button (`batches/index.tsx`, gated by `P.UPLOAD_IMPORT_BATCH`) → `batches/new.tsx` → `<ImportWizard>`. The button is NOT disabled. Nothing to build; left as-is.

# 21. vs_workflow stage rejection behaviour exposed - added `on_rejection` (+ `advance_rule`, `quorum_count`) to `WorkflowStageInstanceReadSerializer` (sourced from the related stage; detail queryset already prefetches `stage_instances__stage`, no N+1). FE `WorkflowStageInstance` type gained the fields; `workflow/approvals/approval-detail.tsx` now reads `activeStage.on_rejection` directly and the second `GET /workflow/templates/?page_size=200` fetch was removed. Reject-confirmation copy + inline hint now reflect real terminal-vs-return behaviour with no extra request.

# 22b. Connectivity monitor - `src/utils/connectivity.ts` owns all "can we reach the backend" messaging; `ConnectivityBanner` (mounted in `App.tsx`) renders it. Three states: offline (navigator.onLine false, or the app's own origin unreachable), server-unreachable (own origin answers but the API host does not, or a 502/503/504 came back), online. Discrimination is a control probe: HEAD on our own origin vs a `mode: "no-cors"` GET on VITE_BACKEND_URL. The interceptor no longer toasts per failed request (`base-api.ts` FETCH_ERROR/TIMEOUT_ERROR branches) - it reports to the monitor, which shows one banner or one collapsed blip toast. `refetchOnReconnect: true` set api-wide, and store.ts uses setupListeners' custom handler to expose `onOnline` so the monitor can announce a server-side recovery (which fires no browser event).
  OPEN, deliberately deferred: the fourth state, "slow". A pending-but-not-failed request cannot be attributed from the browser without Resource Timing sub-timings, and those are zeroed cross-origin unless the backend sends `Timing-Allow-Origin: <frontend origin>`. Backend ask if we ever want "the server is responding slowly" rather than a neutral "taking longer than usual". The escalation would hang off `top-progress-bar.tsx`, which already tracks pending queries but is dev-only in production builds.

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
