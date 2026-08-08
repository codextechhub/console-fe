# VS Export / Export Centre - Build Notes & Handoff

How we build the Export Centre in `console-fe`, against **"VS Export - Spec and
Handoff v3"** (normative) and **"VS Export - Prototype v2"** (structure, copy,
state coverage). Where the two disagree on anything visual, the repo wins.

Sibling to `docs/FINANCE_BUILD_NOTES.md` and `docs/PROCUREMENT_BUILD_NOTES.md`
- the **conventions, typography, responsive rules and honesty rules there apply
here unchanged**. Companion to `CLAUDE.md` and `PERMISSIONS_AUDIT.md`.

---

## Slice 0 - the reconciliation (DONE)

The spec's Slice 0 is one job: *"Reconcile with BackgroundJob and the Queues
page. Agree one status vocabulary and whether a run wraps a job."* Done means
*"one word for one outcome across both surfaces, written down."* This section is
that writing-down.

### The finding that changes the plan: the backend already exists

`apps/vs_exports` shipped in backend commit `2203906` ("feat(exports): add the
Export Centre") - ~6,000 lines: models, catalogue, engine, services, writers,
serializers, views, tasks, audit, analytics, tests, RBAC seeds. It was built
from the same handoff document.

**So this is a frontend build against a real contract, not a design exercise.**
Nothing below is invented; every shape is read from the backend source. Do not
design an API for this feature - read `apps/vs_exports/serializers.py`.

### Answer 1 - a run **wraps** a job

`ExportRun.background_job` is a nullable FK to `core.BackgroundJob`
(`vs_exports/models.py`). `services.enqueue()` queues the Celery task through
the platform's `TrackedTask` base with `_job_kind="export"` and
`_job_label="Export: <name>"`, then links the resulting job row back onto the
run.

The two surfaces are therefore **two questions about the same work**, not two
job monitors:

| Surface | Reads | Answers |
| --- | --- | --- |
| Export → View Queues (`pages/protected/export/queues`) | `core.BackgroundJob` via `/v1/user/me/tasks/` | *Did the worker finish?* Every async task - imports, exports, emails, system runs. |
| Export Centre → Files (Slice 1) | `vs_exports.ExportRun` + `ExportFile` via `/v1/exports/runs/` and `/v1/exports/files/` | *What came out?* Rows, columns, size, omissions, expiry, who downloaded it. |

**Rule: do not build a second job monitor, and do not widen Queues into a
domain view.** Queues stays generic. Files is export-aware and reads the run
records. The FK is the join when a screen genuinely needs to cross over.

Corollary the run detail depends on: `ExportRun.frozen_config` is mandatory and
never back-filled. The run detail describes *that* file, not what the definition
has since become; `drift` on the detail serializer is how "why does last month
differ?" gets answered.

### Answer 2 - the one word is **Completed**

Three vocabularies exist in the codebase today:

| Vocabulary | Source | Terminal-success token |
| --- | --- | --- |
| Background jobs | `core.BackgroundJob.Status` | `SUCCEEDED` |
| Export runs | `vs_exports.constants.RunStatus` | `COMPLETED` |
| Audit-log exports | `audit-types.ts` `ExportJobStatus` | `COMPLETED` |

**Decision: the word a person reads is "Completed", on every surface.** Two of
the three vocabularies already say it, and `SUCCEEDED`/`COMPLETED` for one
outcome is exactly the confusion this product exists to remove.

**We change the display word, never the wire token.** `SUCCEEDED` stays
`SUCCEEDED` in `/v1/user/me/tasks/` params, filters and API payloads - renaming
the job status would ripple through imports, emails and system runs for a
cosmetic reason, and `SUCCEEDED` is not wrong *for a job*. The translation lives
in exactly one place: `runStatusWord()` in
`src/components/custom/run-status-pill.tsx`.

`SUCCEEDED` is **not** relabelled inside the shared `StatusPill`, because it
means something else in Payments (`CollectionStatus.SUCCEEDED` - a payment that
went through, rendered as "Paid"). The one-word rule is scoped to asynchronous
*work*, which is what `RunStatusPill` covers.

### The closed status set, mapped onto existing Badge variants

`VARIANT_BY_STATUS` in `finance-ui/status-pill.tsx` is extended, not forked.
Only one status was genuinely new.

| Status | Where it comes from | Badge variant | Word | Glyph |
| --- | --- | --- | --- | --- |
| `QUEUED` | run + job | `pending` | Queued | `◔` |
| `RUNNING` | run + job | *raw `--primary`/10* | Running | pinging dot |
| `COMPLETED` | run | `success` | Completed | `✓` |
| `SUCCEEDED` | job only | `success` | **Completed** | `✓` |
| `COMPLETED_WITH_OMISSIONS` | run - **NEW** | `pending` | **Partly complete** | `!` |
| `FAILED` | run + job | `rejected` | Failed | `✕` |
| `CANCELLED` | run + job | `inactive` | Cancelled | `⊗` |
| `EXPIRED` | **file**, derived | `inactive` | Expired | `⊘` |

- `COMPLETED_WITH_OMISSIONS` is amber, not green: a file exists, but the
  omission is the point. It is always rendered with its reason beside it -
  `ExportRun.omissions` is a structured `[{code, scope, detail, items[]}]` list
  (`OmissionCode`: `FIELD_FORBIDDEN`, `FIELD_WITHDRAWN`, `ROW_CAP_HIT`), so the
  UI renders it and never infers it.
- `EXPIRED` is **not a run status** - the backend is explicit about this. It is
  derived from `ExportFile.available_until` at read time
  (`is_expired`/`is_purged`/`is_downloadable` on the serializer). The run stays
  `COMPLETED` forever. Never overwrite history to represent expiry.
- `CANCELLED` was previously orange (`suspended`) on the Queues page and grey
  (`inactive`) in `StatusPill`. It is now grey on both - neutral-terminal, the
  same treatment as `EXPIRED`.
- Schedule states (`Active` / `Paused`) are deliberately **absent** from
  `RunStatusPill`. **Schedules are out of the MVP** (decided 2026-07-29), so the
  seven statuses above are the whole closed set for v1. Nothing renders a
  schedule state, so nothing should be able to.

### What Slice 0 changed in the repo

1. **`src/index.css`** - four darkened `-text` tokens, for status and validation
   text only. Measured on the composited tint over white:

   | Token | Hex | On its own 10% tint | Raw sibling was |
   | --- | --- | --- | --- |
   | `--color-green-01-text` | `#0F6B32` | 5.94:1 | 2.96:1 ✗ |
   | `--color-yellow-01-text` | `#8A5A08` | 5.48:1 | 1.99:1 ✗ |
   | `--color-error-text` | `#A81E1E` | 6.15:1 | 4.01:1 ✗ |
   | `--color-gray-06-text` | `#5C5D5C` | 6.01:1 | 2.89:1 ✗ |

   `--primary` needs no sibling: 5.05:1 on `primary/10` unmodified. No other
   colours were added.

2. **`src/components/ui/badge.tsx`** - the tint variants now pair the 10%
   background with the darkened label hue. This is the choke point every status
   label in the app flows through, so it is a class-fix rather than a per-screen
   patch: **every** badge in Finance, Procurement, RBAC, Audit and Health gets a
   legible label, same hue, no geometry change.

3. **`finance-ui/status-pill.tsx`** - added `COMPLETED_WITH_OMISSIONS`, plus
   `statusVariant()` and `statusLabel()` exports so a surface that needs a glyph
   can add one without forking the map.

4. **`src/components/custom/run-status-pill.tsx`** (new) - the shared renderer.
   Colour from `statusVariant`, a leading glyph on every status, the pinging dot
   on Running, and `runStatusWord()` doing the one-word translation.

5. **`pages/protected/export/queues`** - deleted its local `StatusChip` and
   adopted `RunStatusPill`. Filter labels and the KPI card now read through
   `runStatusWord()`, so the filter, the cards and the rows cannot drift apart.

### The fifth variant, fixed without a fifth colour

`Badge` variant `suspended` was `text-orange-500` on `bg-orange-500/10` -
2.53:1, the same class of failure, and once everything around it was darkened it
was the only pale label left on screen. It is not in the export status
vocabulary, but it is used widely (RBAC sensitivity `CRITICAL`, pending change
requests, failed invites, `TERMINATED`, `OVER_TOLERANCE`), so leaving it was
shipping half a fix.

It keeps its orange tint and borrows `--color-yellow-01-text` for the label -
**5.35:1**, its nearest neighbour in the token set. Orange has no token of its
own in `index.css`, and adding a colour to fix one label is worse than reusing
the amber. The spec's "four is the whole set" is about the nine export statuses;
no colour was added.

Every tint variant in `badge.tsx` now passes AA for small text.

---

## The backend contract (read this before Slice 1)

Mounted at `/v1/exports/` (`apps/apps/urls.py`). Platform conventions
throughout: `{success, message, data}` envelope, `XVSPagination` at 25/page,
`?entity=<id|code>` where an entity is meaningful, RBAC-gated per route.

| Screen | Endpoint | Serializer / shape |
| --- | --- | --- |
| Builder steps 1–2 | `GET /catalogue/`, `GET /catalogue/<key>/` | `{modules: [{name, datasets[], available}]}`; dataset carries `fields[]`, `filters[]`, `default_columns`, `required_filters`, `supported_formats`, `format_options`, `max_date_span_days`, `row_cap`, `scope`, `requires_entity` |
| Disable-with-reason everywhere | `GET /capabilities/` | `{can_create, can_run, can_share, can_export_sensitive, can_view_activity, allowed_entities[], row_cap, concurrent_run_limit, in_flight, retention_days}` |
| Summary rail estimate + preview | `POST /preview/?entity=` | `{matching_rows, rows_bucket, estimated_bytes, confidence, warnings[], sample: {headers, rows}, reads_as}` |
| Exports list / builder save | `GET·POST /definitions/`, `GET·PATCH·DELETE /definitions/<pk>/` | `ExportDefinitionList/Detail/WriteSerializer` |
| Duplicate at step 5 | `POST /definitions/<pk>/duplicate/` | returns the copy, named `"<name> (copy)"`, always private |
| Share | `POST /definitions/<pk>/share/` | replaces the share list (`{user_ids: []}`) |
| Run now | `POST /definitions/<pk>/run/` | `{client_key}`; **201 created / 200 = the in-flight run** - this is the concurrency notice, not an error |
| Quick export | `POST /quick/?entity=` | preview payload + `name`, `format_options`, `client_key` |
| Files list / run detail | `GET /runs/`, `GET /runs/<pk>/` | detail adds `omissions`, `failure{code,message,recommended_action,reference,retryable}`, `configuration` (frozen, as labels), `drift{count,fields}`, `deliveries[]` |
| Cancel · retry | `POST /runs/<pk>/cancel/`, `POST /runs/<pk>/retry/` | cooperative cancel, no partial file |
| File cards | `GET /files/?available=true` | `{name, format, size_bytes, row_count, columns_produced, available_until, purged_at, download_count, is_expired, is_purged, is_downloadable}` |
| Download + log | `GET /files/<pk>/download/`, `GET /files/<pk>/downloads/` | download returns **bytes** (not the envelope); the log lists allowed *and* refused attempts |
| Revoke a link | `POST /deliveries/<pk>/revoke/` | |
| Admin activity | `GET /activity/` | filters `actor`, `dataset`, `status`, `external_only`, `since`; reading it is itself audited |
| Builder funnel | `POST /analytics/`, `GET /analytics/summary/` | client may only post names in `analytics.CLIENT_EVENTS`; properties are schema-filtered server-side |

**Progress** on a non-terminal run: `{phase, phase_label, rows_done, rows_total,
queue_position}`; `null` once terminal. A null `rows_total` means indeterminate
- expected, not an error. `queue_position` is what lets a >30s wait explain
itself instead of going quiet.

**Failures** carry a `FailureCode` plus a user-safe message and
`recommended_action` from `FAILURE_GUIDANCE`. The UI shows the message and the
action and maps nothing itself; `retryable` is on the payload. Never a
traceback, never a code shown raw.

### Permission keys (backend, `ExportPermission`)

`exports.catalogue.view` · `exports.definition.view|create|update|delete|share`
· `exports.run.view|create|cancel` · `exports.file.download` ·
`exports.sensitive_field.export` · `exports.activity.view`.

The last two are **not** granted by default (`seed_exports_permissions`):
sensitive-field export is a separate decision from being allowed to export, and
activity-view is an administrator's power whose *read* is audited.

These need codes in `src/permissions/index.ts` + a `PERMISSIONS_AUDIT.md` entry
- **Slice 1**, when they first gate something. `MM` for exports is unassigned;
pick the next free module group.

### Platform limits worth putting in the UI

30-day file retention · 500,000-row hard cap · 250,000-row *warning* threshold ·
3 concurrent runs per tenant · 60s idempotency window · 10 preview rows ·
exact counts stop at 100,000 rows and become bucketed (the honest fallback the
spec asks for - never a spinner where a number should be).

---

## Scope decision - sharing is OUT of the MVP (2026-07-29)

An export belongs to the person who made it. There is no sharing an export with
other people, no "Shared · N" badge, no share drawer or user picker, and no
"shared with me" filter.

The backend keeps `ExportDefinitionShare`, `ExportDefinition.sharing`,
`POST /definitions/<pk>/share/` and `exports.definition.share` - nothing was
deleted server-side - but **no UI calls any of it**. `sharing`, `shared_with`
and `can_share` still arrive on the wire and stay on the TypeScript types,
because a type that lies about the API is worse than an unused field; they are
simply never rendered.

Two consequences worth keeping straight:

- The review step's promise is now only about the owner: *"This export runs as
  you, so it shows the data your access allows."* The old wording explained what
  people you shared with would see, which is a promise about a feature that does
  not exist.
- Visibility is still wider than "your own" for an administrator holding
  `exports.activity.view`, so the Owner filter (Anyone / Owned by me) keeps its
  meaning.

`P.SHARE_EXPORT` stays registered and is recorded as cut in
`PERMISSIONS_AUDIT.md`, so nobody wires it by accident.

## Scope decision - schedules are OUT of the MVP (2026-07-29)

The backend has no `ExportSchedule` model and no `/schedules/` route, and the
product decision is **not to build one for v1**. Everything scheduling implies is
therefore out, not deferred-with-a-placeholder:

- No Schedules tab, no schedules list, no schedule editor, no recurrence
  sentence, no timezone/DST handling, no auto-pause-after-3-failures, no paused
  banner, no owner reassignment queue.
- No `Active` / `Paused` status pills - the closed set is the seven above.
- Builder step 4 loses its timing cards. It asks **where the file goes**, not
  when: run now, or save the recipe without running it. "Run once later" is a
  schedule with one occurrence and goes with the rest.
- Nav is **Overview · Exports · Files · View queues** - four items, not
  five.

What survives from the spec's Slice 4 is *delivery*, which is backed today
(`ExportDelivery`, `DeliveryRevokeView`, `ExportDefinition.email_recipients`):
secure links, recipients, test delivery, revocation, and per-recipient delivery
state separate from run state.

Prototype v2 shows a Schedules tab and a paused-schedule banner. **Ignore both.**
This is a scope cut, not a visual disagreement.

## Slice 1 - Files, run detail, download, expiry (DONE)

Screens: `pages/protected/export/files.tsx`, `run-detail.tsx`, `file-card.tsx`.
API: `redux/services/dashboard/exports-api.ts` + `exports-types.ts`.

**Files is one row per RUN, not per file.** A run that produced no file is still
something a person has to see and act on; hiding failures behind "Files" is how
an export silently stops working.

**Downloading goes through the API layer, never an `<a href>`.** The endpoint
re-authorises the *downloader* (not whoever ran the export) against the run's
frozen entity and dataset plus the file's expiry, and logs the attempt either
way. An anchor would arrive unauthenticated and be refused. Two consequences
worth keeping:

- The response handler returns **bytes on success, parsed JSON on failure** - a
  blanket `.blob()` hands the error path a Blob and loses the refusal sentence,
  which is the most useful text in the feature.
- `transformResponse` converts to an object URL so the file never lands in the
  Redux store. Caching a Blob there holds the whole export in memory and trips
  the serializability check. Same pattern as the other download endpoints.

**Expiry is never inferred in the UI.** `is_expired` / `is_purged` /
`is_downloadable` are derived server-side at read time, and the file card reads
them. The run stays `COMPLETED` forever.

Permission keys are registered under **MM=92** in `src/permissions/index.ts`
(the action vocabulary gained `45=share` and `46=download`), and the gating is
recorded in `PERMISSIONS_AUDIT.md`. Run `seed_exports_permissions` on any
database that has not had it - a fresh dev DB has zero `exports.*` keys.

### Backend gap found and fixed during this slice

`vs_exports.services._notify` emits `export.run_completed` and
`export.run_failed`, but neither was registered in
`vs_notifications.constants.EVENT_TYPES` and neither had a template. Every
export notification raised `UnknownEventTypeError`, which `_notify` caught and
logged - so **no export notification had ever been delivered**, silently, while
the spec requires in-product notification on completion, failure and omissions.
Both event types are now registered and active with in-app templates (plus email
on failure only - a manual success does not earn an email, the user is looking
at the screen). `_notify` now passes `export_run_id` in the metadata and
`notification_action_url` deep-links to `/export/runs/<id>`, because a failure
notice is only useful next to the thing that failed.

## Slice 2 - the builder (DONE)

Screens: `pages/protected/export/saved.tsx` and `pages/protected/export/builder/`
(`index.tsx`, `field-picker.tsx`, `summary-rail.tsx`, `filter-editor.tsx`,
`format-options.tsx`, `choice-card.tsx`, `use-builder-state.ts`, `helpers.ts`).

**FOUR steps, not the spec's five.** The original step 4 asked *"when should this
run, and where should the file go?"*. Schedules are cut, so the "when" half no
longer exists, and the "where" half is delivery, which arrives with slice 4.
Rather than ship a step that only says "Export Centre", timing folds into the
review step's two actions - *Save without running* and *Save and run*. The
delivery step comes back when there is something to put in it.

**Everything in steps 1–3 is catalogue-driven.** Fields, groups, locked and
sensitive flags, filters and their kinds, supported formats and the format
option schema all come off `/exports/catalogue/<key>/`. Nothing is hardcoded, so
a dataset the backend publishes tomorrow works without a frontend change.

Details worth keeping:

- **Filter value keys are the backend's**: `date_range → {start, end}`,
  `choice → {values}`, `text`/`boolean` → `{value}`, `number_range → {min, max}`.
  Getting one wrong does not fail loudly - the filter is dropped when the
  queryset is compiled and the export quietly returns the wrong rows. The
  mapping lives in one place, `filter-editor.tsx`.
- **The estimate never toasts.** A half-built configuration is the *normal*
  state of `/exports/preview/`, so the endpoint carries
  `extraOptions: { silent: true }` and the summary rail renders the same
  sentence inline, next to the number it is about.
- **Stale-while-recalculating**: the previous figures stay at 60% opacity with
  `aria-busy` while the next request is in flight; responses are sequence-checked
  so a slow early request can never overwrite a fast later one. Debounced 400ms.
- **Error markers stay off until the user tries to save.** A form nobody has
  filled in is not "wrong", and a step bar that is red on arrival teaches people
  to ignore it.
- **The builder is loaded, then mounted** - the saved export is in hand before
  the form renders, so state seeds from props rather than being copied in by an
  effect. `key={definitionId}` means state can never leak between definitions.
- `StepProgressBar` gained `labels`, `onStepClick` and `errorsByStep` (all
  optional; it had no callers, so nothing moved).

### Deliberate deviation from the spec

The spec says the builder is **not offered on phones** ("exports are built on a
larger screen"). We offer it. `CLAUDE.md`'s depth policy is explicit that phone
must be *usable* and that we "never hide or truncate data away", and the built
screen genuinely is usable - the two picker panes stack, the rail becomes the
summary bar, no overflow at 390px. Hiding a working screen behind a "use a
bigger screen" panel would be worse than what is there. Desktop remains the
design source of truth and no phone-first optimisation was spent on it.

## Slice 3 - failure and omission handling (DONE)

The run detail already had a body per outcome from slice 1. Slice 3 made the
unhappy ones *actionable*, and fixed the two places where the backend's stated
rules were not the rules it actually applied.

### The retry rule was prose, not code

`retry_run`'s docstring has always said "only genuinely retryable failures are
offered a retry - re-running a permission or filter failure would fail again in
exactly the same way". `RETRYABLE_FAILURE_CODES` was declared for it. **Neither
was used anywhere.** `retry_run` checked only "is it FAILED and does it have a
definition", and the serializer reported `retryable` from `definition_id is not
None`, so the UI offered a Retry button on a filter failure that would queue a
run and fail identically - a second wait and a second notification for nothing.

Now enforced in both places, and the refusal quotes the code's own guidance
rather than a generic "cannot retry".

### The UI leads with the fix, not the retry

`failure-actions.ts` maps each `FailureCode` to the one thing worth offering:

| Codes | Offer |
| --- | --- |
| `FILTER_INVALID` · `REQUIRED_FILTER_MISSING` · `NO_COLUMNS` · `ROW_CAP_EXCEEDED` · `DATE_SPAN_EXCEEDED` · `DATASET_WITHDRAWN` | **Edit the export** - the fix is a configuration change |
| `INFRASTRUCTURE` · `UNKNOWN` | **Retry now** - the only case where running it again can change anything |
| `DATASET_FORBIDDEN` · `ENTITY_FORBIDDEN` · `OWNER_INACTIVE` | **Nothing** - says so plainly; the fix is a person or a permission elsewhere |

A run whose definition has been deleted says that too, rather than showing a
button that goes nowhere.

### Omissions render structurally

`ExportRun.omissions` is `[{code, scope, detail, items[]}]`. The banner now
renders a heading per code, the detail sentence, and the affected field ids in
mono - so the omission is *rendered*, never parsed out of prose by the reader.
`FIELD_WITHDRAWN` and `ROW_CAP_HIT` offer an edit link; `FIELD_FORBIDDEN` does
not, because editing the export is not how you get access back.

### Drift became a real diff

`config_drift` always returned `{field, then, now}`, but the serializer
published only `{count, fields}` - so the UI could say "2 places" and nothing
more. It now publishes `changes[]` rendered **as sentences**: column ids become
labels, filter specs become the review step's own wording, an options object
becomes a count. That keeps the module's rule that no raw JSONField reaches the
wire, while letting the run detail actually answer "why does last month differ?".

`definition_id` is now on the run serializer - the UI needs it to offer "Edit
the export", and the definition is already visible to that caller.

## The date span is advice, not a ceiling (2026-07-29)

`Dataset.max_date_span_days` used to **fail the run**: asking for six months of
GL postings produced `DATE_SPAN_EXCEEDED` and no file. That refused an ordinary
request - a finance user wanting a quarter or a year of postings is not doing
anything unreasonable - and it contradicted the spec's own posture, which warns
above 250k rows rather than blocking.

It is now advisory:

- **`WIDE_DATE_RANGE`** is a warning on the estimate, so the builder says so
  before anyone runs it. The summary rail already renders non-cap warnings in
  amber, so nothing had to change there.
- **The row cap stays hard.** It is measured on the actual result rather than
  guessed at from the calendar, which is why it is the right place for the real
  ceiling.
- **A required date filter still needs both ends.** That is a different
  question - "is the filter set" rather than "how wide is it" - and it now fails
  as `REQUIRED_FILTER_MISSING`, which is what it always meant. The old message
  conflated the two, which is how a filter with the wrong keys came back as
  "needs both a start and an end date, no more than 31 days apart".
- `FailureCode.DATE_SPAN_EXCEEDED` is **kept**, marked historical. Runs recorded
  before this change still carry it and their detail screens must keep working.

Only two datasets set a span at all: `finance.gl_postings` (31) and
`audit.events` (92) - the two highest-cardinality tables. The number is now read
as "tuned for", and the builder's filter copy says so.

## Gaps to close before the slices that need them

1. **Dataset catalogue depth.** Five datasets are published today
   (`finance.customer_invoices`, `finance.invoice_lines`, `finance.gl_postings`,
   `payments.collections`, `audit.events`). Procurement and Audit-beyond-events
   have none, which is *information* the Module chips must state, not hide -
   Prototype v2 already writes this copy.

---

## Build order (spec's sequencing, with what we now know)

| Slice | Contains | Backend |
| --- | --- | --- |
| **0** | Reconcile with BackgroundJob; one status vocabulary; the four `-text` tokens | ✅ done |
| **0b** | Rework View Queues onto house components + make export rows tell the truth | ✅ done |
| **1** | Files list, run detail, download + logging, 30-day expiry, file card | ✅ done |
| **2** | Catalogue, wizard steps 1–3, preview/estimate, definitions CRUD, Exports | ✅ done |
| **3** | Failure and omission handling end to end, frozen-config diff | ✅ done |
| 4 | Delivery only: recipients, secure links, test delivery, revocation | ✅ ready |
| 5 | ~~Sharing~~ (cut) · Quick export from module screens · admin activity + download log | ✅ ready |
| ~~Schedules~~ | Cut from the MVP - see the scope decision above | - |

Genuinely new UI in this feature is only three things - the 340px summary rail,
the two-pane field picker, and the file card. Everything else is assembly over
`CustomTable`, `StatusPill`, `Tabs`, `StepProgressBar`, `states.tsx`, `Sheet`,
`ConfirmActionModal`, `PermissionGate`, `TableToolbar`, `KpiCard` and `sonner`.
Read `custom/import-wizard` before designing the builder's state - it is the
closest existing precedent.
