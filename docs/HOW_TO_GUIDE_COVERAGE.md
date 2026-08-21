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
| Schools and users | Manage schools and branches | `schools.manage-schools-and-branches` | Medium | Published | Not required | Console product team | 2026-08-20 | List, detail, and single-record edit tasks are fully covered by the article and do not need cross-screen automation. Article now covers the branch lifecycle (which moves are offered, reason required to leave service, close is final and asks for the name), the main-branch handover, the editable-then-frozen sign-in address, and returning a suspended school to onboarding |
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
| Finance and payments | Configure finance foundations | `finance.configure-foundations` | High | Published | Published | Console product team | 2026-08-21 | Walkthrough explains entity, chart, reference-data, and mapping order, and never creates or saves configuration |
| Finance and payments | Create and post a journal | `finance.create-and-post-journal` | High | Published | Published | Console product team | 2026-08-21 | Direct entry opens read-only during the walkthrough; it never reads fields, changes lines, posts, submits, reverses, or voids |
| Finance and payments | Close, lock, or reopen a fiscal period | `finance.close-lock-or-reopen-period` | High | Published | Published | Console product team | 2026-08-21 | Walkthrough may open the period checklist but never creates a year or confirms close, reopen, year-end, or permanent lock actions |
| Finance and payments | Invoice a customer and allocate a receipt | `finance.invoice-and-allocate-receipt` | High | Published | Published | Console product team | 2026-08-21 | Covers customers, fee structures, invoices, receipts, allocation, notes, concessions, plans, dunning, refunds, write-offs, and source-to-GL checks. Walkthrough may inspect an existing receipt but never records, allocates, refunds, writes off, or voids |
| Finance and payments | Email a customer their invoice, receipt or statement | `finance.email-customer-documents` | High | Published | Published | Console product team | 2026-08-21 | Walkthrough may open a posted invoice and recipient preview, but never presses Send or Retry. The article covers recipient, BCC, subject, attachment, delivery history, blocked sends, and failed-delivery recovery |
| Finance and payments | Reconcile a bank statement | `finance.reconcile-bank-statement` | High | Published | Published | Console product team | 2026-08-21 | Walkthrough explains account scope, totals, one-to-one, group and split matching, exceptions, ignored lines, adjustments, and completion, but never imports, selects, matches, ignores, adjusts, unmatches, or completes |
| Finance and payments | Run financial reports | `finance.run-financial-reports` | Medium | Published | Not required | Console product team | 2026-08-21 | Article covers report choice, entity and period scope, comparisons, accounting equations, control-account reconciliation, filters, and exports. Reports are read-only views with simple filters and exports, so an interactive walkthrough adds no safety or workflow-order value |
| Finance and payments | Run payroll | `finance.run-payroll` | High | Published | Published | Console product team | 2026-08-21 | Covers structures, roster, generation, calculation and posting, net payment, payslips, statutory schedules, cancellation, voiding, masked figures, payroll scope (central or per branch), assigning staff to branches, and which branch a run covers. Walkthrough never reads payroll fields or generates, posts, pays, cancels, voids, prints, or remits |
| Finance and payments | Submit and settle an expense claim | `finance.submit-and-settle-expense-claim` | High | Published | Published | Console product team | 2026-08-21 | Covers coding, receipt evidence, posting, rejection, settlement, and voiding. Walkthrough never changes evidence or claim state |
| Finance and payments | Establish, spend, and replenish petty cash | `finance.manage-petty-cash` | High | Published | Published | Console product team | 2026-08-21 | Covers float ceiling, custodian, vouchers, physical cash, register, replenishment, and voiding. Walkthrough never moves or posts cash |
| Finance and payments | Build, approve, and monitor a budget | `finance.build-and-approve-budget` | High | Published | Published | Console product team | 2026-08-21 | Covers assumptions, account and cost-centre lines, phasing, approval, variance, heatmap, revisions, and draft deletion. Walkthrough never changes or approves a budget |
| Finance and payments | Acquire, depreciate, and dispose of fixed assets | `finance.manage-fixed-assets` | High | Published | Published | Console product team | 2026-08-21 | Covers register identity, valuation, acquisition, individual and period depreciation, disposal, and ledger reconciliation. Walkthrough never posts an asset lifecycle action |
| Finance and payments | Prepare, file, and pay tax | `finance.file-and-pay-tax` | High | Published | Published | Console product team | 2026-08-21 | Covers obligations, ledger-based preparation, authority evidence, adjustments, partial remittance, and unpaid un-filing. Walkthrough never files, un-files, or pays |
| Finance and payments | Collect online payments and manage virtual accounts | `finance.collect-online-payments` | High | Published | Published | Console product team | 2026-08-21 | Covers provider state, virtual-account scope, receipt and ledger tracing, settlement, failed events, replay safety, and sensitive data. Walkthrough never creates, allocates, or replays |
| Finance and payments | Send payouts and resolve settlement failures | `finance.send-payouts-and-resolve-settlements` | High | Published | Published | Console product team | 2026-08-21 | Covers beneficiary and duplicate checks, single and batch flows, maker-checker approval, provider state, read-only settlement, webhook recovery, and double-payment prevention. Walkthrough never sends, submits, approves, or replays |
| Procurement and inventory | Complete procure-to-pay | `procurement.complete-procure-to-pay` | High | Draft | Planned | Console product team | 2026-08-13 | Walkthrough will use linked chapters |
| Procurement and inventory | Add and govern procurement vendors | `procurement.add-and-govern-vendor` | High | Published | Published | Console product team | 2026-08-21 | Covers supplier identity, accounting defaults, contacts, field-level sensitive data, KYC, risk, hold, active state, history, and performance. Walkthrough never reads or changes sensitive fields or vendor state |
| Procurement and inventory | Manage categories and catalogue items | `procurement.manage-categories-and-catalogue` | Medium | Published | Not required | Console product team | 2026-08-21 | Article covers hierarchy, accounting precedence, sourcing defaults, observed pricing, purchase history, and retirement. These are short master-data forms without a cross-screen or irreversible action, so a walkthrough adds little safety value |
| Procurement and inventory | Run RFQs, compare quotations, and award | `procurement.run-rfq-and-award` | High | Published | Published | Console product team | 2026-08-21 | Covers issue, invitations, amendments, deadlines, firm bids, comparison, competition overrides, award, close, and cancellation. Walkthrough crosses safely from RFQs to Quotations and never changes sourcing state |
| Procurement and inventory | Manage the contract lifecycle | `procurement.manage-contract-lifecycle` | High | Published | Published | Console product team | 2026-08-21 | Covers draft, activation, milestones, explicit call-offs, in-term associations, edits, renewal, and irreversible termination. Walkthrough remains read-only |
| Procurement and inventory | Manage stock and movements | Planned in C7b | Medium | Planned | Planned | Console product team | 2026-08-13 | Registry record and content not started |
| Procurement and inventory | Use procurement analytics and settings | Planned in C7b | High | Planned | Planned | Console product team | 2026-08-13 | Split reporting from configuration during C7b |
| Data imports and exports | Upload and resolve an import batch | `data.import-batch` | High | Draft | Planned | Console product team | 2026-08-13 | Content and targets start in C8 |
| Data imports and exports | Create and maintain import templates | Planned in C8 | High | Planned | Planned | Console product team | 2026-08-13 | Registry record and content not started |
| Data imports and exports | Build and run an export | Planned in C8 | High | Planned | Planned | Console product team | 2026-08-13 | Registry record and content not started |
| Data imports and exports | Recover imports or exports from failure | Planned in C8 | High | Planned | Planned | Console product team | 2026-08-13 | Registry record and content not started |
| Audit and security | Investigate an audit event | `audit.investigate-event` | High | Draft | Planned | Console product team | 2026-08-20 | Content and targets start in C9. Must cover the Tenant filter added 2026-08-20: it narrows the Explorer and the CSV export to one school, offers "No tenant (platform-level)" for sweeps and management commands, is shown only to platform staff, and does not reach events recorded before tenants were stamped on the trail |
| Audit and security | Review sessions, sign-ins, lockouts, and proxy use | Planned in C9 | High | Planned | Planned | Console product team | 2026-08-13 | Registry record and content not started |
| Audit and security | Export evidence and maintain compliance rules | Planned in C9 | High | Planned | Planned | Console product team | 2026-08-20 | Registry record and content not started. Must cover the Tenant filter on the export builder and downloading a finished export, which now goes through an authorised route rather than the payload |
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

## C6a completion record

- Finance setup, ledger, and close now publish three task guides: configure finance
  foundations, create and post a journal, and close, lock, or reopen a fiscal period.
- Foundation guidance records entity scope, fiscal calendar creation, the four-digit
  chart code lines, postable and group accounts, FX direction, tax mappings, cost
  centres, dimensions, Finance Settings consumers, and pre-go-live verification.
- Journal guidance distinguishes immediate direct entry from draft submission and
  source-document posting. It records posting-window checks, line balance, tags,
  evidence, approval submission, manual reversal, and source-document voiding.
- Fiscal-close guidance records Open, Soft-closed, Closed, and permanently Locked
  states, blocker versus warning checklist rows, year-end Retained Earnings posting,
  reopen controls, and the final-period lock boundary.
- Three high-risk walkthroughs explain these workflows. They never create or save
  configuration, read or change journal fields, post or submit a journal, create a
  fiscal year, or confirm close, reopen, year-end, or permanent-lock actions.
- Workspace search now opens the direct-entry drawer with the permission enforced by
  that drawer. It no longer advertises immediate posting to a draft-submit-only user.

## C6b completion record

- Finance receivables, banking, and reports now publish four task guides: invoice a
  customer and allocate a receipt, email customer finance documents, reconcile a
  bank statement, and run and interpret financial reports.
- Receivables guidance covers customer and fee preparation, invoice issue, receipt
  evidence, oldest-first, largest-first and manual allocation, customer credit,
  notes, concessions, plans, dunning, refunds, write-offs, and source-to-GL checks.
- Customer-email guidance covers invoice, receipt and statement choice, recipient
  and BCC preview, subject and attachment checks, delivery status, blocked sends,
  failure reasons, and safe retry.
- Reconciliation guidance covers account and statement preparation, imports,
  automatic and manual matching, equal-total one-to-one, group and split matches,
  timing differences, adjustments, ignored duplicates, unmatching, completion, and
  independent evidence review.
- Reporting guidance covers Trial Balance, Income Statement, Balance Sheet, Cash
  Flow, Changes in Equity, cost and dimension analysis, period comparison,
  accounting equations, control-account reconciliation, and controlled exports.
- Three high-risk walkthroughs explain receipt allocation, customer delivery and
  bank reconciliation. They never post, send, retry, import, match, ignore, adjust,
  unmatch, refund, write off, void, or complete a consequential action.
- Shared drawers and dialogs become non-modal only while a walkthrough is active,
  so Radix does not hide or trap the coach behind a newly opened record or preview.
  Ordinary drawer and dialog behavior remains modal outside walkthroughs.
- Financial reports do not need a walkthrough because they are read-only views with
  simple filters and exports. The article records the judgment and interpretation
  checks that matter more than control-by-control coaching.

## C6c completion record

- Payments, payroll, and finance operations now publish eight task-sized guides:
  payroll, expense claims, petty cash, budgets, fixed assets, tax, collections, and
  payouts with settlement recovery.
- Payroll guidance separates roster and structure preparation, draft generation,
  accrual posting, net-wage payment, payslips, statutory schedules, remittance, and
  status-specific correction. It records payroll field masking as a privacy control.
- Expense and petty-cash guidance preserves receipt evidence and source records,
  separates expense posting from payment, reconciles the imprest register to physical
  cash, and prevents replenishment from silently increasing the float ceiling.
- Budget, asset, and tax guidance covers planning baselines and variance, the full
  asset register and ledger lifecycle, and the separate preparation, filing, payment,
  partial-remittance, and unpaid correction states of a tax return.
- Collection and payout guidance traces provider, business-record, journal, and bank
  states; protects bank and webhook data; and requires proof of non-posting before a
  retry or replay that could duplicate real money.
- Eight walkthroughs explain the high-risk controls through stable screen targets.
  They never generate, post, pay, approve, send, file, allocate, replay, import,
  create, void, dispose, replenish, or otherwise perform a consequential action.

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
