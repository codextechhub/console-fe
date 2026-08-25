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
| Roles and permissions | Diagnose missing access | `troubleshooting.permission-denied` | Medium | Published | Not required | Console product team | 2026-08-21 | Permission and scope diagnosis is read-only and cross-linked from access-sensitive guides; a walkthrough would add no ordered workflow or safety boundary |
| Organogram and tasks | Build the organogram | `organogram.build-structure` | Medium | Published | Published | Console product team | 2026-08-14 | Walkthrough explains the safe unit, position, and matrix order and never creates, edits, moves, or deletes structure |
| Organogram and tasks | Maintain staff profiles | `organogram.maintain-staff-profiles` | Medium | Published | Published | Console product team | 2026-08-14 | Walkthrough explains identity, seat, employment, and payroll boundaries and never reads fields, creates a profile, or changes an assignment |
| Organogram and tasks | Create and complete tasks | `tasks.create-and-complete` | Low | Published | Not required | Console product team | 2026-08-14 | The short form and completion control are covered by the article; assignment and completion remain explicit user actions |
| Approvals and workflow | Review and act on an approval | `workflow.review-and-act` | High | Published | Published | Console product team | 2026-08-23 | Article explains that the prominent View full document action opens the matching source area, uses status-aware guidance, and supports recovery from a missing match; walkthrough explains queue, evidence, stage rules, and outcomes, then stops before opening or recording a decision |
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
| Finance and payments | Submit and settle an expense claim | `finance.submit-and-settle-expense-claim` | High | Published | Published | Console product team | 2026-08-23 | Covers coding, signed-in receipt viewing, approval submission and notices, rejection, settlement, and voiding. Walkthrough never changes evidence or claim state |
| Finance and payments | Establish, spend, and replenish petty cash | `finance.manage-petty-cash` | High | Published | Published | Console product team | 2026-08-21 | Covers float ceiling, custodian, vouchers, physical cash, register, replenishment, and voiding. Walkthrough never moves or posts cash |
| Finance and payments | Build, approve, and monitor a budget | `finance.build-and-approve-budget` | High | Published | Published | Console product team | 2026-08-21 | Covers assumptions, account and cost-centre lines, phasing, approval, variance, heatmap, revisions, and draft deletion. Walkthrough never changes or approves a budget |
| Finance and payments | Acquire, depreciate, and dispose of fixed assets | `finance.manage-fixed-assets` | High | Published | Published | Console product team | 2026-08-21 | Covers register identity, valuation, acquisition, individual and period depreciation, disposal, and ledger reconciliation. Walkthrough never posts an asset lifecycle action |
| Finance and payments | Prepare, file, and pay tax | `finance.file-and-pay-tax` | High | Published | Published | Console product team | 2026-08-21 | Covers obligations, ledger-based preparation, authority evidence, adjustments, partial remittance, and unpaid un-filing. Walkthrough never files, un-files, or pays |
| Finance and payments | Collect online payments and manage virtual accounts | `finance.collect-online-payments` | High | Published | Published | Console product team | 2026-08-21 | Covers provider state, virtual-account scope, receipt and ledger tracing, settlement, failed events, replay safety, and sensitive data. Walkthrough never creates, allocates, or replays |
| Finance and payments | Send payouts and resolve settlement failures | `finance.send-payouts-and-resolve-settlements` | High | Published | Published | Console product team | 2026-08-21 | Covers beneficiary and duplicate checks, single and batch flows, maker-checker approval, provider state, read-only settlement, webhook recovery, and double-payment prevention. Walkthrough never sends, submits, approves, or replays |
| Procurement and inventory | Complete procure-to-pay | `procurement.complete-procure-to-pay` | High | Published | Published | Console product team | 2026-08-21 | Covers requisition, approval, purchase order, vendor communication, accepted and rejected receipt, GR/IR, three-way match, invoice approval and posting, payment approval, withholding, advances, reversal, source reconciliation, and safe recovery. Walkthrough crosses all five lists and never opens or changes a document |
| Procurement and inventory | Add and govern procurement vendors | `procurement.add-and-govern-vendor` | High | Published | Published | Console product team | 2026-08-21 | Covers supplier identity, accounting defaults, contacts, field-level sensitive data, KYC, risk, hold, active state, history, and performance. Walkthrough never reads or changes sensitive fields or vendor state |
| Procurement and inventory | Manage categories and catalogue items | `procurement.manage-categories-and-catalogue` | Medium | Published | Not required | Console product team | 2026-08-21 | Article covers hierarchy, accounting precedence, sourcing defaults, observed pricing, purchase history, and retirement. These are short master-data forms without a cross-screen or irreversible action, so a walkthrough adds little safety value |
| Procurement and inventory | Run RFQs, compare quotations, and award | `procurement.run-rfq-and-award` | High | Published | Published | Console product team | 2026-08-21 | Covers issue, invitations, amendments, deadlines, firm bids, comparison, competition overrides, award, close, and cancellation. Walkthrough crosses safely from RFQs to Quotations and never changes sourcing state |
| Procurement and inventory | Manage the contract lifecycle | `procurement.manage-contract-lifecycle` | High | Published | Published | Console product team | 2026-08-21 | Covers draft, activation, milestones, explicit call-offs, in-term associations, edits, renewal, and irreversible termination. Walkthrough remains read-only |
| Procurement and inventory | Manage stock, locations, and movements | `procurement.stock-locations` | High | Published | Published | Console product team | 2026-08-21 | Covers stable item identity, stores, receipt, weighted-average value, issues, physical-count adjustments, reorder signals, movement ledger, and GL reconciliation. Risk raised from Medium because issue and adjustment post real journals. Walkthrough remains read-only |
| Procurement and inventory | Review procurement analytics and controls | `procurement.review-analytics` | Medium | Published | Not required | Console product team | 2026-08-21 | Covers AP aging, GR/IR, posted spend, operational vendor performance, recorded assessments, and source-record recovery. Reports are read-only, date-filtered evidence views; the article identifies the separate permission and evidence boundary for adding an assessment, so an overlay adds little safety value |
| Procurement and inventory | Configure procurement policies and controls | `procurement.configure-settings` | High | Published | Published | Console product team | 2026-08-21 | Covers entity and Finance inheritance, purchasing, lifecycle, competition, matching, accounting, workflow ownership, consumers, effective timing, audit history, and rollback. Walkthrough never edits or saves entity-wide policy |
| Data imports and exports | Upload and resolve an import batch | `data.import-batch` | High | Published | Published | Console product team | 2026-08-21 | Covers active template use, tenant and dataset scope, upload metadata, structural and row validation, issue triage, explicit execution, monitoring, source proof, and duplicate prevention. Walkthrough never uploads, validates, executes, deletes, or downloads data |
| Data imports and exports | Create and maintain import templates | `data.import-templates` | High | Published | Published | Console product team | 2026-08-21 | Covers stable dataset contracts, required and identifying columns, formats, operator guidance, test batches, publishing, compatible edits, retirement, and historical batch integrity. Walkthrough never creates, edits, publishes, retires, or downloads a template |
| Data imports and exports | Build and run an export | `data.build-and-run-export` | High | Published | Published | Console product team | 2026-08-21 | Covers catalogue authorization, entity scope, fields, filters, restricted data, preview, format, naming, saved definitions, run-time authorization, file retention, and secure handling. Walkthrough never saves, runs, downloads, schedules, shares, or deletes an export |
| Data imports and exports | Recover imports or exports from failure | `data.recover-import-export` | High | Published | Published | Console product team | 2026-08-21 | Covers validation versus execution failure, partial imports, job evidence, duplicate checks, rollback criteria, queue state, coded export remedies, retry versus edit, omissions, expiry, cancellation, and safe escalation. Walkthrough remains read-only and never retries, rolls back, cancels, downloads, or deletes |
| Audit and security | Investigate an audit event | `audit.investigate-event` | High | Published | Published | Console product team | 2026-08-21 | Covers dashboard signals, reproducible filters, platform-only tenant controls, No tenant semantics, older unscoped events, event context, actor versus effective user, entity lifecycles, preservation, and safe escalation. Walkthrough remains read-only and never changes source data or security state |
| Audit and security | Review sessions, sign-ins, lockouts, and proxy use | `audit.review-security-operations` | High | Published | Published | Console product team | 2026-08-21 | Correlates live and ended sessions, authentication outcomes and failure codes, lockouts, password activity, proxy justification, change events, and read-access trails. Walkthrough never ends a session, unlocks an account, changes a password or email, or ends proxy use |
| Audit and security | Export evidence and maintain compliance rules | `audit.export-and-compliance` | High | Published | Published | Console product team | 2026-08-21 | Covers bounded tenant-aware CSV jobs, authorised file download, secure handling, retention, masking, access and export rules, scope, history, activation, overlap, rollback, and failure recovery. Walkthrough never generates or downloads a file or creates, changes, activates, duplicates, deactivates, or deletes a rule |
| Platform health and settings | Investigate platform health | `platform.investigate-health` | High | Published | Published | Console product team | 2026-08-21 | Covers Command Center posture, uptime, APIs, jobs, queues, incidents, tenant health, SLOs, provider evidence, scope classification, and retry safety. Walkthrough remains read-only and never retries, replays, restarts, changes configuration, or creates an incident |
| Platform health and settings | Configure platform and onboarding settings | `platform.configure-platform` | High | Published | Published | Console product team | 2026-08-21 | Covers source precedence, platform profile, new-school defaults, security baselines, capabilities, entitlements, overrides, audit, advanced definitions, validation, and rollback. Walkthrough never edits, saves, resets, exports, schedules, grants, overrides, archives, or deletes configuration |
| Platform health and settings | Administer notification settings and templates | `platform.administer-notifications` | High | Published | Published | Console product team | 2026-08-23 | Covers bounded delivery history, channel policy, event contracts, unique event-channel templates, variables, backend preview, standard versus custom email design, activation, controlled monitoring, and the boundary between queue tracking and attention-worthy bell events. Walkthrough never creates, edits, saves, activates, pauses, restores, or sends a notification |
| Platform health and settings | Manage integration delivery settings | `platform.manage-integrations` | High | Published | Published | Console product team | 2026-08-21 | Covers source precedence, sender identity, bounded retries, deployment-owned secrets, read-only connection tests, health, queues, delivery, provider evidence, and rollback. Walkthrough never edits, saves, resets, tests, sends email, moves money, or replays a webhook |
| Platform health and settings | Find and download requirements documents | `platform.requirements-library` | Low | Published | Not required | Console product team | 2026-08-15 | The screen only browses and downloads; it writes nothing and has no consequential action for a walkthrough to guide. Restricted to CX platform staff - the backend requires the caller's home tenant to be the platform one in addition to the permission key |
| Account and personal security | Secure a personal account | `account.secure-account` | Medium | Published | Not required | Console product team | 2026-08-21 | Covers the personal security overview, password changes, reset history, active sessions, login history, account activity, suspicious-access response, proxy awareness, and safe return to the direct session. No walkthrough is needed for these short screens, and every password or session change remains an explicit confirmed user action |
| Account and personal security | Maintain profile and privacy | `account.maintain-profile-and-privacy` | Low | Published | Not required | Console product team | 2026-08-21 | Covers the CX self-service employment profile, editable personal and payroll fields, organisation-owned fields, missing-profile recovery, personal-data categories, variable retention, and the permission-gated activity CSV. No walkthrough is needed for these short read and edit screens, and profile saves or export requests remain explicit user actions |
| Troubleshooting | Permission denied or navigation missing | `troubleshooting.permission-denied` | Medium | Published | Not required | Console product team | 2026-08-21 | Read-only diagnosis covers identity, tenant, entity, role, permission, scope, expiry, and minimum access requests; there is no ordered in-product recovery action for a walkthrough |
| Troubleshooting | Inactive, locked, unactivated, or expired account and invitation | `troubleshooting.account-and-invitation` | Medium | Published | Not required | Console product team | 2026-08-21 | Recovery depends on private email links and administrator identity checks, so an in-product walkthrough cannot safely perform or observe it |
| Troubleshooting | Search, filter, pagination, and download results | `troubleshooting.search-filter-and-download` | Low | Published | Not required | Console product team | 2026-08-21 | Generic read-only checks apply across many list screens; the article provides the reusable sequence without coupling a walkthrough to one route |
| Troubleshooting | Import and export failures | `troubleshooting.import-and-export` | High | Published | Covered by domain walkthroughs | Console product team | 2026-08-21 | Cross-links to the import, export, and recovery guides whose existing walkthroughs explain the actual screens and stop before execution, retry, cancellation, download, or rollback |
| Troubleshooting | Stalled workflow or record status | `troubleshooting.stalled-workflow-and-records` | High | Published | Covered by domain walkthroughs | Console product team | 2026-08-21 | Cross-links to workflow, finance, and procure-to-pay walkthroughs at the real decision boundaries; another generic tour would duplicate them and lose record-specific state |
| Troubleshooting | Payment, provider, and platform health failures | `troubleshooting.payment-provider-and-health` | High | Published | Covered by domain walkthroughs | Console product team | 2026-08-21 | Cross-links to collection, payout, integration, and health walkthroughs that reconcile the real evidence and never retry, replay, post, or move money |
| Troubleshooting | Prepare a useful support ticket | `troubleshooting.prepare-support-ticket` | Medium | Published | Published | Console product team | 2026-08-23 | Article covers requester-only detail editing, resolver workflow actions, automatic following after comments, later comment and status notifications, stopping notifications, and re-following by commenting. Walkthrough explains evidence, priority, attachments, and privacy on the real ticket form, never reads fields or files, and stops before Create ticket |

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
  pause and resume, completion back to the originating guide, version invalidation,
  keyboard control, and missing-target recovery without reading page values.
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

## C12 completion record

- Seven task-sized troubleshooting guides now cover access, account and invitation,
  list and download behaviour, import and export failures, stalled workflows and
  record statuses, payment and provider health, and support-ticket preparation.
- Cross-links connect each failure class to the existing permission-aware domain
  guide that owns the detailed workflow. Restricted finance, procurement, import,
  export, and platform titles remain hidden without at least one relevant view
  permission.
- Recovery guidance starts with evidence and classification. It blocks duplicate
  imports, payments, payouts, postings, retries, replays, approvals, and status
  bypasses until the original outcome is proven.
- The support-ticket walkthrough uses stable targets for the issue, classification,
  attachments, and submit boundary. It never reads a field, attaches a file, or
  creates a ticket, and it stops before the consequential action.
- High-risk generic troubleshooting does not duplicate the existing domain
  walkthroughs. The ledger records which real workflow walkthroughs carry each
  safety boundary and why a second generic tour would be less accurate.

## O1 completion record

- The permission-gated Guide coverage screen compares the shipped product route
  catalogue and registered high-value task actions with every active guide mapping.
  Guide article and compatibility-alias routes are excluded because they deliver
  guidance rather than represent product workflows.
- Review freshness is calculated from the guide risk: high risk every 90 days,
  medium every 180 days, and low every 365 days. Stale and due-soon articles are
  ordered into an owner-visible review queue.
- The registry validator now appears as an operations report for invalid routes,
  actions, relations, sections, articles, permissions, and walkthrough references.
- Walkthrough verification is versioned. A changed walkthrough version invalidates
  the older result until its targets are driven again. The baseline records the C1
  through C12 walkthrough versions verified on 2026-08-21.
- `platform.review-guide-coverage` documents how to read and repair each report at
  its source. The screen and guide require platform health access and expose no
  customer records or mutation controls.

### No walkthrough - recorded reason

The dashboard is a read-only diagnostic with independent report sections. It has
no ordered, consequential, or branching workflow to teach, and every repair occurs
in the versioned source registry rather than in the screen. A walkthrough would add
ceremony without making an operation safer. Revisit if the page later gains an
editor, assignment, approval, or automated repair action.

## Finance recovery coverage (2026-08-23)

- Three task-sized guides now cover credit and debit notes with concessions,
  customer refunds with bad-debt write-offs, and payment-plan creation through
  installment tracking and cancellation.
- Five high-value action gaps are now mapped: create credit note, create refund,
  create write-off, create payment plan, and create concession. Four explicit
  receivables routes were added to the shipped route contract and mapped in the
  same change.
- Three walkthroughs open only the safe creation drawers, explain the current
  accounting preview and approval rule, and stop before every issue, post, submit,
  refund, write-off, create, activate, receipt, cancel, allocation, or void action.
- Payment-plan creation now uses the same complete permission rule in the screen
  and action palette. Both create and activate permissions are required because
  the current Create plan flow performs those two server actions in sequence.
- Payment-plan walkthrough version 2 owns its form, schedule, and final-action
  targets inside the New plan drawer. A source contract prevents those markers
  from drifting into the separate Record installment drawer again.
- Walkthrough resume now restores the nearest visible safe opener when stored
  progress points inside a drawer or modal that has since closed. Refund
  walkthrough version 3 also clears earlier broken saved states. Target-click
  steps disable coach-side Next and advance only after the opened UI is visible.
- Refund guidance measures credit on the selected accounting date, write-off
  guidance remains invoice-specific, and both require proof that an earlier
  attempt did not already create or post the adjustment before any retry.

## High-value action gap closure (2026-08-23)

- Every registered high-value action is now referenced by an active guide.
- Create staff profile and Create task map to their existing task-sized articles,
  whose instructions already follow those exact creation workflows.
- Create bank account maps to bank reconciliation guidance. The account-preparation
  section now covers the entity, controlled bank identity, one-to-one GL cash
  mapping, currency, status, primary flags, and the separate money-movement boundary.
- Proxy a user maps to security-operations guidance. The article now covers support
  authority, target verification, the effective-identity boundary, prompt exit, and
  the two-layer proxy audit trail.
- Existing walkthroughs may explain the surrounding evidence and controls, but they
  do not start a proxy session or create a bank account. Those consequential actions
  remain explicit user decisions. Task creation is a short, reversible personal form;
  the staff-profile walkthrough already covers the ordered profile and seat workflow.

## Procurement route gap closure (2026-08-23)

- The Procurement dashboard maps to analytics and controls guidance because its
  spend, purchase-order, approval, invoice, vendor, and activity cards are report
  summaries that lead readers back to their source records.
- The Procurement approval queue maps to the complete procure-to-pay guide. Approval
  permissions are included in that guide's discovery rules so an eligible approver
  can see the guidance even without document-creation access.
- All nine real Procurement settings section routes map to the settings guide. The
  mapping follows the named sections registered by the router and the walkthrough.
- Five wildcard section patterns were removed from the shipped route catalogue.
  Procurement intentionally registers only named vendor, sourcing, inventory,
  analytics, and settings sections, so the wildcards represented no reachable
  screen and produced false coverage gaps.
- No new walkthrough is required. The dashboard is read-only, the approval safety
  sequence already belongs to the procure-to-pay walkthrough, and the settings
  walkthrough already covers the consequential cross-section workflow without
  saving a policy change.

## Complete route gap closure (2026-08-23)

- Every real protected or account-access route in the guide route catalogue now
  maps to at least one active guide. The coverage contract fails if any route or
  high-value action becomes unmapped.
- Role editing maps to the role creation and assignment guide. The article now
  covers the existing access snapshot, affected assignees, protected roles, the
  full resulting permission set, and rollback before a direct save.
- Finance Overview maps to financial-report guidance, Finance Audit maps to audit
  investigation guidance, and entity-trail details map to the same investigation
  guide. The articles distinguish summary signals, source reports, immutable
  Finance before-and-after evidence, and the wider security trail.
- Settings Overview maps to platform configuration guidance. The Administration
  link hub and the personal notification feed map to Console basics, so readers
  receive navigation and notification guidance without specialist configuration
  permissions.
- The platform Settings wildcard and eight Finance wildcards were removed. Their
  routers accept only named sections, so the route catalogue now lists every real
  Finance section explicitly and no longer treats mistyped section URLs as shipped
  screens.
- No new walkthrough is required. Role editing uses the same high-risk fields and
  final save boundary already taught by the role walkthrough; the Finance dashboard,
  Finance Audit, entity-trail detail, Administration hub, and notification feed are
  read-only. Existing Finance settings and audit walkthroughs retain their current
  consequential-action boundaries.

## O2 analytics and editorial loop (2026-08-25)

- Guide article opens, reader-marked completions, helpful or not-helpful votes,
  outdated-guide ticket handoffs, and finished or paused walkthrough exits now use
  one closed event contract.
- Standalone and workspace no-result searches wait 800 ms after results settle.
  The backend keeps only approved guide-task words, replaces all other tokens with
  `[redacted]`, and stores the normalized route pattern and zero result count. It
  never stores an actor, tenant breakdown, record id, form value, amount, email, or
  free-text report.
- Disposable analytics are retained for 180 days and remain separate from support
  and security audit evidence. The ingest path is available to active users so the
  sample is not permission-biased, but is scoped to 120 events per authenticated
  user per minute. Excess requests return HTTP 429 and create no event. Aggregate
  summaries require `platform.health.view` and expose no tenant dimension.
- The Coverage and freshness screen now includes 30-day reader metrics, sanitized
  no-result phrases, and an editorial queue that combines review deadlines, owner,
  product risk, outdated reports, negative votes, low completion, and walkthrough
  exits.
- The coverage guide explains how to read these signals and why they prompt a
  source review rather than prove that a workflow succeeded or failed. No new
  walkthrough was added because analytics review is read-only and has no ordered,
  consequential product action.

## O3 final audit (2026-08-25)

- The final registry contains 64 active guides. All 215 shipped screen routes and
  all 56 registered high-value actions are mapped, all review dates are current,
  and the Coverage and freshness screen reports zero integrity gaps.
- All 66 guide-system routes, comprising the landing page, coverage dashboard, and
  64 articles, rendered against the real backend on desktop without a console or
  page error. The same 66 routes passed 132 phone and tablet checks at 390px and
  820px with no horizontal overflow or error boundary.
- All 45 interactive walkthroughs passed on phone and desktop, for 90 clean
  viewport runs. The desktop pass advanced every safe step, confirmed every live
  target, checked that the coach did not cover its highlight, and confirmed that
  Finish returned to the guide that launched the walkthrough.
- The fiscal-period walkthrough previously highlighted the whole period list, so
  selecting the highlight could not open a checklist. Version 2 now highlights a
  real period card and waits for its close drawer before advancing. A source
  contract keeps the marker on the selectable card.
- A walkthrough ending over an open dialog could lose the guide destination to
  the dialog's delayed close route. Completion now lets the layer finish handling
  the click before navigating, so the support-ticket walkthrough and equivalent
  modal or drawer flows return to their originating articles.
- Accessibility inspection covered landmarks, heading structure, duplicate IDs,
  hash targets, image alternatives, field labels, control names, filter state,
  keyboard and coach focus contracts, and reduced motion. The role filter now
  exposes its selected state, the desktop sidebar control announces Collapse
  sidebar or Expand sidebar, and walkthrough scrolling no longer animates when
  reduced motion is requested.
- Guide discovery and access tests cover no-permission and representative role
  permission sets so restricted guide titles do not leak through search, role
  entry points, contextual help, or relations. Live screen checks used the seeded
  platform administrator because no lower-privilege browser credentials are part
  of the verification fixture.
- The focused backend analytics suite passed all five privacy and security tests,
  including closed event shapes, redaction, scoped throttling, aggregate access,
  and 180-day retention. Analytics remains separate from support and audit
  evidence and exposes no tenant or actor dimension.
- Final automated evidence is 116 guide tests, clean scoped lint, a successful
  production build, 66 clean accessibility routes, 132 clean responsive route
  checks, and 90 clean walkthrough viewport runs. The build retains only the
  existing dynamic-import and large-chunk advisory warnings.
