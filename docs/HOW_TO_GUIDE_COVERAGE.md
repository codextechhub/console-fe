# Console How-to Guide Coverage

This ledger tracks user workflows, not just routes. The typed registry is the source
for guide metadata; this file records delivery state and known gaps in plain language.

Status values: `planned`, `draft`, `published`, `retired`, or `not required`.

| Category | Workflow | Guide ID | Risk | Article | Walkthrough | Owner | Last review | Known gap |
|---|---|---|---|---|---|---|---|---|
| Getting started | Console basics, navigation, access context, notifications, and help | `getting-started.console-basics` | Low | Published | Published | Console product team | 2026-08-17 | Guide articles open at the top and contents links smoothly reveal their sections |
| Getting started | Account activation and sign-in | `getting-started.activate-and-sign-in` | Medium | Published | Not required | Console product team | 2026-08-13 | Activation uses a personal email link, so an in-product walkthrough would be unavailable before sign-in and would risk exposing the link |
| Getting started | Reset a forgotten password | `getting-started.reset-password` | Medium | Published | Not required | Console product team | 2026-08-13 | Recovery uses a personal email link, so an in-product walkthrough would be unavailable before sign-in and would risk exposing the link |
| Getting started | Workspace search and quick actions | `getting-started.console-basics` | Low | Published | Published | Console product team | 2026-08-17 | Covered by the Console basics article and walkthrough; guide results exclude drafts |
| Schools and users | Create and configure a school | `schools.create-and-configure` | High | Published | Published | Console product team | 2026-08-14 | Walkthrough opens the matching school, branch, administrator, and package views, preserves entered values, keeps the target visible beside the coach, and never reads, changes, validates, or submits a field |
| Schools and users | Manage schools and branches | `schools.manage-schools-and-branches` | Medium | Published | Not required | Console product team | 2026-08-13 | List, detail, and single-record edit tasks are fully covered by the article and do not need cross-screen automation |
| Schools and users | Invite and manage CX or school users | `schools.invite-and-manage-users` | Medium | Published | Not required | Console product team | 2026-08-13 | The article covers approval, invitation, profile, and access states; consequential status actions remain explicit user actions |
| Roles and permissions | Create and assign a role | `roles.create-and-assign` | High | Published | Published | Console product team | 2026-08-13 | Walkthrough explains role composition and stops before role creation, assignment, change, or revocation |
| Roles and permissions | Review permission changes and transfer Super Admin | `roles.review-changes-and-transfer-super-admin` | High | Published | Published | Console product team | 2026-08-13 | Ownership walkthrough verifies the current owner, successor, and immediate effect, then stops before transfer and confirmation |
| Roles and permissions | Maintain the permission catalogue and groups | `roles.maintain-permission-catalogue` | High | Published | Published | Console product team | 2026-08-13 | Walkthrough explains key composition and backend enforcement, then stops before permission creation or downstream catalogue changes |
| Roles and permissions | Diagnose missing access | `troubleshooting.permission-denied` | Medium | Draft | Not required | Console product team | 2026-08-13 | Content starts in C12 |
| Organogram and tasks | Build the organogram | `organogram.build-structure` | Medium | Published | Published | Console product team | 2026-08-14 | Walkthrough explains the safe unit, position, and matrix order and never creates, edits, moves, or deletes structure |
| Organogram and tasks | Maintain staff profiles | `organogram.maintain-staff-profiles` | Medium | Published | Published | Console product team | 2026-08-14 | Walkthrough explains identity, seat, employment, and payroll boundaries and never reads fields, creates a profile, or changes an assignment |
| Organogram and tasks | Create and complete tasks | `tasks.create-and-complete` | Low | Published | Not required | Console product team | 2026-08-14 | The short form and completion control are covered by the article; assignment and completion remain explicit user actions |
| Approvals and workflow | Review and act on an approval | `workflow.review-and-act` | High | Published | Published | Console product team | 2026-08-14 | Walkthrough explains queue, evidence, stage rules, and outcomes, then stops before opening or recording a decision |
| Approvals and workflow | Delegate and track approvals | `workflow.delegate-and-track` | High | Published | Published | Console product team | 2026-08-14 | Walkthrough explains bounded delegation and tracking, and never saves, revokes, withdraws, resubmits, cancels, or reverses work |
| Approvals and workflow | Build a workflow template | `workflow.build-template` | High | Published | Published | Console product team | 2026-08-14 | No self-service retirement control exists; new stages also default auto-skip on, so the guide requires an explicit policy decision for that setting |
| Finance and payments | Configure finance foundations | Planned in C6a | High | Planned | Planned | Console product team | 2026-08-13 | Registry record and content not started |
| Finance and payments | Create and post a journal | `finance.create-and-post-journal` | High | Draft | Planned | Console product team | 2026-08-13 | Content and targets start in C6a |
| Finance and payments | Close, lock, or reopen a fiscal period | Planned in C6a | High | Planned | Planned | Console product team | 2026-08-13 | Registry record and content not started |
| Finance and payments | Invoice a customer and allocate a receipt | Planned in C6b | High | Planned | Planned | Console product team | 2026-08-13 | Registry record and content not started |
| Finance and payments | Email a customer their invoice, receipt or statement | Planned in C6b | High | Planned | Planned | Console product team | 2026-08-16 | Workflow shipped 2026-08-16 (send with recipient preview, delivery history, retry; dunning notice send wired). Article deferred to C6b with the rest of the receivables chapter rather than writing one finance guide in isolation - the screens have no published finance articles to sit beside yet. Risk is High because the action reaches a paying customer and cannot be recalled; the in-product confirmation names the recipient, the CC and the subject before sending, which is what a first-time user most needs. A walkthrough must never press Send |
| Finance and payments | Reconcile a bank statement | Planned in C6b | High | Planned | Planned | Console product team | 2026-08-13 | Registry record and content not started |
| Finance and payments | Run financial reports | Planned in C6b | Medium | Planned | Planned | Console product team | 2026-08-13 | Registry record and content not started |
| Finance and payments | Run payroll | Planned in C6c | High | Planned | Planned | Console product team | 2026-08-13 | Registry record and content not started |
| Finance and payments | Manage expenses, petty cash, budgets, assets, and tax | Planned in C6c | High | Planned | Planned | Console product team | 2026-08-13 | Split into task-sized articles during C6c |
| Finance and payments | Operate collections, payouts, settlements, and failures | Planned in C6c | High | Planned | Planned | Console product team | 2026-08-13 | Split into task-sized articles during C6c |
| Procurement and inventory | Complete procure-to-pay | `procurement.complete-procure-to-pay` | High | Draft | Planned | Console product team | 2026-08-13 | Walkthrough will use linked chapters |
| Procurement and inventory | Govern vendors, categories, and catalogue items | Planned in C7a | High | Planned | Planned | Console product team | 2026-08-13 | Registry record and content not started |
| Procurement and inventory | Run sourcing and manage contracts | Planned in C7a | High | Planned | Planned | Console product team | 2026-08-13 | Registry record and content not started |
| Procurement and inventory | Manage stock and movements | Planned in C7b | Medium | Planned | Planned | Console product team | 2026-08-13 | Registry record and content not started |
| Procurement and inventory | Use procurement analytics and settings | Planned in C7b | High | Planned | Planned | Console product team | 2026-08-13 | Split reporting from configuration during C7b |
| Data imports and exports | Upload and resolve an import batch | `data.import-batch` | High | Draft | Planned | Console product team | 2026-08-13 | Content and targets start in C8 |
| Data imports and exports | Create and maintain import templates | Planned in C8 | High | Planned | Planned | Console product team | 2026-08-13 | Registry record and content not started |
| Data imports and exports | Build and run an export | Planned in C8 | High | Planned | Planned | Console product team | 2026-08-13 | Registry record and content not started |
| Data imports and exports | Recover imports or exports from failure | Planned in C8 | High | Planned | Planned | Console product team | 2026-08-13 | Registry record and content not started |
| Audit and security | Investigate an audit event | `audit.investigate-event` | High | Draft | Planned | Console product team | 2026-08-13 | Content and targets start in C9 |
| Audit and security | Review sessions, sign-ins, lockouts, and proxy use | Planned in C9 | High | Planned | Planned | Console product team | 2026-08-13 | Registry record and content not started |
| Audit and security | Export evidence and maintain compliance rules | Planned in C9 | High | Planned | Planned | Console product team | 2026-08-13 | Registry record and content not started |
| Platform health and settings | Investigate platform health | `platform.investigate-health` | High | Draft | Planned | Console product team | 2026-08-13 | Content and targets start in C10 |
| Platform health and settings | Configure platform and onboarding settings | Planned in C10 | High | Planned | Planned | Console product team | 2026-08-13 | Registry record and content not started |
| Platform health and settings | Administer notifications and integrations | Planned in C10 | High | Planned | Planned | Console product team | 2026-08-13 | Registry record and content not started |
| Platform health and settings | Find and download requirements documents | `platform.requirements-library` | Low | Published | Not required | Console product team | 2026-08-15 | The screen only browses and downloads; it writes nothing and has no consequential action for a walkthrough to guide. Restricted to CX platform staff - the backend requires the caller's home tenant to be the platform one in addition to the permission key |
| Account and personal security | Secure a personal account | `account.secure-account` | Medium | Draft | Not required | Console product team | 2026-08-13 | Content starts in C11 |
| Account and personal security | Maintain profile and privacy | Planned in C11 | Low | Planned | Not required | Console product team | 2026-08-13 | Registry record and content not started |
| Troubleshooting | Permission denied or navigation missing | `troubleshooting.permission-denied` | Medium | Draft | Not required | Console product team | 2026-08-13 | Content starts in C12 |
| Troubleshooting | Account, invitation, import, export, workflow, finance, procurement, payment, provider, and health failures | Planned in C12 | High | Planned | Planned | Console product team | 2026-08-13 | Split by failure class during C12 |

## F1 completion record

- Typed categories, audiences, access rules, records, routes, and validation: built.
- Initial high-risk workflow records: built as drafts.
- Coverage report helper and contract tests: built.
- Visible guide pages, articles, search, contextual help, and walkthrough engine: not
  part of F1 and remain scheduled in F2 through F6.

## F2 completion record

- Responsive guide homepage and friendly `/how-to-guide` alias: built.
- Permission-aware category, audience, popular-task, and recent-review discovery:
  built.
- URL-backed category and audience filters with safe empty states: built.
- Support Centre self-service guide entry point: built.
- Real-backend desktop, 390px phone, and 820px tablet rendering: verified on
  2026-08-13 with no page-level overflow or error boundary.
- Published article navigation: deliberately remains disabled until the F3 renderer
  and first published article exist.

## F3 completion record

- Typed published-article metadata, contents sections, related-guide relationships,
  primary product routes, and read-time estimates: built.
- Responsive article renderer with sticky desktop contents, smooth in-page anchors,
  top-resetting article navigation, product deep links, related guides, feedback,
  and outdated-report handoff: built.
- Reusable numbered steps, callouts, checklists, and explanatory figures: built.
- `Get started with Console`: published as the first complete article.
- Real-backend desktop, 390px phone, and 820px tablet article rendering: verified
  on 2026-08-13 with no page overflow, error boundary, or console errors.
- Interactive walkthrough launch remains disabled until the F6 engine is available.

## F4 completion record

- Shared local guide search covers titles, summaries, aliases, tags, categories,
  article section headings, and safe error phrases: built.
- Exact titles and aliases rank ahead of token-prefix and substring matches: built
  and regression tested.
- Permission filtering happens before guide matching, and search entry points only
  open published articles: built.
- Guide homepage arrow-key selection, Enter launch, clear filters, and useful
  no-results guidance: built.
- Workspace search includes Guides after Actions and before People in the same
  visual and keyboard order: built.
- Search-gap analytics remain scheduled for the analytics slice because the app has
  no approved telemetry sink yet. No user-entered search text is sent elsewhere.

## F5 completion record

- Route-pattern matching resolves contextual guides without retaining live record
  identifiers, query strings, or fragments: built and regression tested.
- The protected header help control opens a responsive panel with page guides,
  published related troubleshooting, walkthrough availability, all-guides access,
  and support-ticket handoff: built.
- Contextual discovery filters unpublished and unauthorized guide records before
  rendering: built and regression tested.
- Support tickets may receive only `guide_id`, normalized `route_pattern`,
  `product_area`, and `app_version`: built with backend validation and storage.
- Unknown metadata keys and record-bearing live URLs are rejected by the backend.
- Ticket detail shows the safe product context to authorized ticket participants.

## F6 implementation record

- A typed walkthrough registry and validator now enforce guide relations, stable
  step IDs, route shape, versions, and branch destinations.
- The runtime supports route-aware launch, branching, back and next controls,
  pause and resume, completion, version invalidation, keyboard control, and
  missing-target recovery without reading page values.
- Progress stores only walkthrough ID, guide ID, version, current and completed
  step IDs, and completion time. Direct and proxy sessions use separate identity
  keys.
- The published Console basics guide now launches a safe reference walkthrough
  across quick actions, workspace search, and contextual help. It never submits
  an action or changes business data.
- Desktop uses a target-aligned coach mark. Phones use a full-width bottom sheet.
- Planned high-risk category walkthroughs remain draft until their matching
  articles and populated workflow verification ship in the category slices.

## C1 completion record

- Getting started now publishes three task guides: Console orientation, account
  activation and sign-in, and forgotten-password recovery.
- Console orientation explains entities, branches, roles, permission-based
  visibility, notifications, recent work, guide discovery, walkthrough launch,
  support handoff, and common recovery paths.
- The Support sidebar group exposes Support Centre and How-to Guides as separate,
  route-aware submenu destinations.
- Guide search shows immediate keyboard-accessible suggestions and matches partial
  words in any order across titles, aliases, tags, summaries, and section names.
- Category selection replaces the category grid in place with a named, focused
  result panel and a clear return action, avoiding disorienting mobile page jumps.
- Browse by area appears before Popular tasks so category discovery and its
  focused result state stay near the top of the guide page on small screens.
- Search results now replace the role and category grids, while a selected role
  collapses to one card with its published results immediately below it.
- Availability badges and category counts include only published guides the user
  can open. Draft category content stays out of normal result lists.
- Activation and password recovery use the exact current public-screen labels,
  password policy, completion states, and expired-link recovery.
- Auth walkthroughs are deliberately not provided. These tasks happen before
  sign-in through personal email links, so a Console walkthrough cannot reach them
  safely and must not read or retain their tokens.

## C2 completion record

- Schools and users now publishes three task guides: create and configure a school,
  manage schools and branches, and invite or manage CX and school users.
- School onboarding covers the current four-step form, branch and administrator
  invitations, module dependencies, capacity limits, completion state, and safe
  recovery from validation or submission problems.
- School and branch management covers status cards, debounced search, sort, detail
  review, separate permission boundaries, branch creation, invite status, and
  lifecycle checks.
- User management covers CX and school scopes, Members, Invites, and Drafts, filters,
  approval-before-invitation behaviour, organogram seats, staff-profile routing,
  and controlled suspend, reactivate, and unlock actions.
- The high-risk school-creation walkthrough uses a distinct stable target for each
  wizard view. It moves between those views so the visible form matches the spoken
  step and preserves entered values, but never reads fields, changes values,
  validates input, submits creation, or sends invitations.
- The shared walkthrough coach measures its rendered size, chooses a non-overlapping
  side, scrolls once per target, and leaves the highlighted content undimmed. The
  same positioning behaviour applies to every published walkthrough.
- Lower-risk school-list, branch, and user-management tasks use exact articles and
  contextual help. Their state-changing actions remain deliberate user actions, so
  additional walkthroughs are not required for C2.

## C3 completion record

- Roles and permissions now publishes three task guides: create and assign roles,
  review permission changes and transfer Super Admin, and maintain the permission
  catalogue and groups.
- Role guidance covers permission groups, individual permissions, active status,
  multiple assignments, safe replacement, written revocation reasons, and the
  separate ownership path for Super Admin.
- Change-request guidance covers ADD and REMOVE deltas, justification, reviewer
  decisions, applied and failed states, dependency checks, and audit notes.
- Catalogue guidance covers modules, resources, actions, composed keys,
  sensitivity, restricted status, dependencies, groups, and the requirement for
  backend authorization and tenant or entity scoping.
- Three high-risk walkthroughs explain role composition, Super Admin transfer, and
  permission creation. They never select permissions, create or assign roles,
  approve changes, transfer ownership, create catalogue records, or bypass a
  confirmation or authorization check.
- Missing-access diagnosis remains linked to the planned troubleshooting article
  and is completed in C12, where cross-category recovery guidance is audited.

## C4 completion record

- Organogram and tasks now publishes three task guides: build the organogram,
  maintain staff profiles and seat assignments, and create, assign, or complete
  tasks.
- Organogram guidance records the required Division, Department, Team, Position,
  staff-seat order, the difference between solid and matrix lines, deletion
  protection, and the effect of solid reporting on task visibility.
- Staff guidance records brief and full profile boundaries, effective-dated
  primary-seat history, the separate payroll field permissions, and recovery
  when the profile saves but its seat assignment fails.
- Task guidance records My Tasks and My Team behavior, backend-derived assignment
  bounds, required task fields, status filters, completion notification and Undo,
  and permanent deletion.
- Two walkthroughs cover the difficult structure and staff-profile workflows.
  They never create or alter structure, select a person or seat, read form values,
  upload a photo, create a profile, change an assignment, or expose payroll data.
- The low-risk task form does not need a walkthrough. Its create, assign, complete,
  undo, edit, and delete actions remain deliberate user actions described by the
  article.

## C5 completion record

- Approvals and workflow now publishes three task guides: review and act on an
  approval, delegate and track approvals, and build an approval workflow template.
- Decision guidance records queue eligibility, current-attempt handling, ANY,
  QUORUM, and UNANIMOUS rules, terminal and return rejection behaviour, required
  reasons, confirmations, and audited results.
- Submission and delegation guidance records amendment and resubmission, permanent
  withdrawal, date and document scope, exclusive versus shared authority, revocation,
  administrative monitoring, cancellation, and audited vote reversal.
- Template guidance records approver groups, effective members, dynamic roles,
  organogram resolution, scopes, stage and route conditions, empty-approver policy,
  notifications, shared and school-owned versions, validation, publishing, and
  revision behaviour.
- Three high-risk walkthroughs explain these decision boundaries. They never record
  an approval, save or revoke a delegation, withdraw or resubmit a request, cancel or
  reverse an instance, change template fields, or publish or switch a version.
- Template retirement remains a known product gap because no self-service lifecycle
  control is exposed. The guide directs authorized users to the approved support path
  and preserves existing instances and dependencies.
- New template stages currently default empty-approver auto-skip on. The guide and
  walkthrough call this out and require the author to switch it off unless approved
  policy explicitly permits skipping the stage.

## Quick export from a list screen (2026-08-15)

- New user-visible workflow: an **Export** button on fifteen list screens opens a
  drawer that sends that screen's own filters to a background export. Registered as
  `data.quick-export` (`export-what-a-table-is-showing`), category
  `data-imports-and-exports`, access `exports.catalogue.view` **and**
  `exports.run.create`. The article is **published** (`quick-export.tsx`) - the
  first written article in this category.
- Screens covered: Finance (Invoices, Customers, Receipts, General ledger,
  Expense claims), Payments (Collections, Payouts, Transactions Log),
  Procurement (Purchase orders, Vendors, Vendor invoices, Requisitions), Support
  (Tickets), Administration (Users, Role assignments, Sign-in sessions), Workflow
  (Approval requests).
- **Transactions Log** is a merge of two datasets, so its export follows the
  screen's direction filter: In exports collections, Out exports payouts, and
  with neither chosen the button is disabled with a reason. One file cannot hold
  both - a collection has a payer and a provider reference, a payout has a
  beneficiary and a batch.
- **Settlement** has no dataset and cannot have one: it is a computed
  reconciliation, not a queryset. It gained server-rendered csv/xlsx/pdf via
  `?export=&view=` on `payments/reports/settlement-reconciliation/` instead,
  matching the finance reports. The article's "no Export button here" answer
  covers it.
- Audit → Events is deliberately **not** covered by this guide. It keeps its own
  "Export filtered" flow into the audit export builder (`config.audit.export`),
  which is a compliance artifact with its own retention and review path; pointing
  readers at a quick export there would be wrong advice.
- The guidance a reader most needs is the **honesty contract**: the drawer reports
  which of the screen's filters were carried, which the export added (a required
  date window, making the file narrower), and which could not be carried at all -
  in which case the file is *wider* than the table, the warning names each dropped
  filter, and the run button reads "Run anyway". Two known cases are unavoidable
  and must be documented rather than fixed: Customers filtered to Overdue or In
  credit (both computed from live AR balances, not stored), and Sign-in sessions
  filtered by school or ended-today.
- General ledger carries a second caveat: the screen lists one row per journal
  **entry**, the export produces one row per **line**, so the row count in the
  drawer legitimately exceeds what is on screen.

### No walkthrough - recorded reason

No interactive walkthrough is provided, and one would not help. The workflow is a
single drawer with two inputs (name, format) and one action; there is no ordering
to teach, no branch, and no destructive step. The one thing a reader must
understand - the widening warning - is already stated in place, in full sentences,
at the point of decision. A walkthrough would also have to highlight a control
that lives on fifteen different screens rather than one route, so its stable
`data-guide` target would be the drawer it cannot open without first choosing a
screen. Revisit if quick export gains column selection or scheduling.
