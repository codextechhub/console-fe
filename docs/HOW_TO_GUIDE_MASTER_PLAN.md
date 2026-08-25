# Console How-to Guide: Master Plan

Status: approved planning baseline

Product route: `/support/guides`

Friendly alias: `/how-to-guide`
Scope: the complete Console product, including interactive walkthroughs

## 1. Purpose

Build a permission-aware help system inside Console that records how the product
actually works. It must help a user discover a task, understand its prerequisites,
complete it safely, recover from common problems, and reach support when the guide
is not enough.

The system is also a maintenance contract. When Console behaviour changes, the
related guide records, screenshots, search entries, contextual help, and interactive
walkthroughs must be reviewed in the same change.

The guide describes shipped product behaviour. It does not replace backend
authorization, validation, automated tests, or product verification.

## 2. Outcomes

The finished system will provide:

1. A responsive how-to homepage organized by the recommended guide categories.
2. Search by task language, aliases, role, module, route, and common error text.
3. Permission-aware discovery without exposing restricted feature details.
4. Task articles with steps, screenshots, prerequisites, expected results, and fixes.
5. Contextual help from the screen the user is currently viewing.
6. Interactive walkthroughs for difficult workflows from the first release.
7. Integration with workspace search and the existing support-ticket experience.
8. Feedback and search-gap analytics that do not collect sensitive form values.
9. A complete inventory showing which shipped workflows have guide coverage.
10. Repository rules that prevent future product and documentation drift.

## 3. Recommended guide categories

These are the primary navigation and build order. A guide has one primary category
and may carry additional topic tags.

1. Getting started
2. Schools and users
3. Roles and permissions
4. Organogram and tasks
5. Approvals and workflow
6. Finance and payments
7. Procurement and inventory
8. Data imports and exports
9. Audit and security
10. Platform health and settings
11. Account and personal security
12. Troubleshooting

Role entry points cut across the categories:

- Platform administrator
- School administrator
- Finance officer
- Procurement officer
- Approver
- Support and operations staff
- Every Console user

## 4. System architecture

### 4.1 Canonical guide registry

Create one typed registry under `src/features/guides/`. It is the source used by
the guide homepage, search, related guides, route-level help, workspace search, and
walkthrough launcher.

Each record contains at least:

```ts
type GuideRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: GuideCategory;
  tags: string[];
  aliases: string[];
  audiences: GuideAudience[];
  routes: string[];
  permissionMode: "all" | "any" | "public";
  permissions: PermissionCode[];
  article: () => Promise<GuideArticle>;
  walkthroughId?: string;
  owner: string;
  reviewedAt: string;
  productVersion?: string;
  status: "draft" | "published" | "retired";
};
```

Use existing permission constants. Do not duplicate raw permission strings in
guide records when a typed constant exists. A guide hidden by frontend permissions
must still link only to backend-protected screens.

### 4.2 Article source

Store articles as structured Markdown or MDX in the repository, grouped by category.
The initial implementation should choose the smallest build-time solution that
supports typed frontmatter, reusable callouts, screenshots, internal route links,
and search extraction. Do not add a remote content-management dependency for v1.

Suggested layout:

```text
src/features/guides/
  registry.ts
  categories.ts
  search.ts
  permissions.ts
  components/
  walkthroughs/
  content/
    getting-started/
    schools-and-users/
    roles-and-permissions/
    organogram-and-tasks/
    approvals-and-workflow/
    finance-and-payments/
    procurement-and-inventory/
    data-imports-and-exports/
    audit-and-security/
    platform-health-and-settings/
    account-and-personal-security/
    troubleshooting/
```

### 4.3 Routes

- `/support/guides`: guide homepage
- `/support/guides/:slug`: article
- `/support/guides/:slug?walkthrough=start`: article with walkthrough launch intent
- `/how-to-guide`: redirect to `/support/guides`

Keep `/support` as the combined help entry. It should clearly separate self-service
guides from support tickets while allowing movement between them.

### 4.4 Search

Guide search should support:

- Title, summary, aliases, tags, step headings, route names, and safe error phrases.
- The same token-prefix behaviour users already know from workspace search.
- Debounced input and local indexing. No request per keystroke.
- Permission filtering before results render.
- Keyboard navigation and a useful no-results state.
- A no-results event containing the normalized query, current route, and result
  count only. The backend keeps only approved guide-task words and replaces every
  other token with `[redacted]`. Never record form contents, record identifiers,
  names, emails, amounts, or other user-entered values.

Add a `Guides` section to workspace search after the standalone guide search works.

### 4.5 Contextual help

Each supported screen can declare one or more guide IDs. The header or page shell
opens a compact help panel containing:

- Guides for this page
- Available walkthroughs
- Related troubleshooting
- Create support ticket

Ticket creation may include the guide ID, route pattern, product area, and app
version. It must not copy field values or sensitive page content.

### 4.6 Coverage ledger and generated audit

Maintain `docs/HOW_TO_GUIDE_COVERAGE.md` as the human-readable delivery ledger. One
row represents one user workflow, not merely one route. Each row records category,
guide ID, product routes, audience, risk, article status, walkthrough status, owner,
last review date, and known gaps.

Generate a machine check from the typed registry and route or action catalogues. It
should flag:

- Published product routes with no contextual guide mapping.
- High-value actions with no discoverable guide.
- Complex or high-risk workflows with no walkthrough or recorded exception.
- Published guides with missing owners, stale reviews, invalid relations, or missing
  screenshots.
- Walkthrough definitions that reference missing guide IDs or duplicate stable
  targets.

The generated report assists review. It does not automatically prove that an article
is accurate or that a walkthrough works against populated product data.

## 5. Standard article contract

Every task article contains:

1. Task-based title beginning with a clear verb.
2. Short outcome statement.
3. Who can do it, expressed in user language.
4. Required permissions, visible only when useful to the reader.
5. Prerequisites and records that must already exist.
6. Numbered steps using the exact current interface labels.
7. Screenshots for decision-heavy or visually ambiguous steps.
8. `You are done when` with an observable result.
9. Common problems, causes, and recovery steps.
10. Safety and accounting consequences where relevant.
11. Open-screen and start-walkthrough actions when available.
12. Related guides.
13. Content owner, last reviewed date, and report-outdated action.

Articles must cover populated, empty, loading, forbidden, and recoverable error states
when those states materially change what a user should do.

## 6. Interactive walkthrough system

### 6.1 Behaviour

A walkthrough runs inside the real Console screen. It can:

- Navigate to an authorized route.
- Highlight a stable target.
- Explain what the target does and why it matters.
- Wait for the user to open a drawer, select a tab, or complete a safe action.
- Branch based on visible status or route.
- Pause, resume, go back, skip, or exit.
- Return to the matching article when the target is unavailable.

A walkthrough must not:

- Auto-submit financial postings, approvals, payments, imports, invitations,
  permission changes, proxy sessions, or destructive actions.
- Insert fabricated production data.
- Read, store, or transmit user-entered field values.
- Bypass permissions, validation, confirmation dialogs, or workflow controls.
- Depend on brittle CSS paths or translated display text as its only locator.

### 6.2 Stable target contract

Walkthrough targets use explicit attributes such as:

```tsx
<Button data-guide="finance.invoice.create">Create invoice</Button>
```

Target IDs are permanent public contracts within the repository. Renaming or
removing one requires updating every referencing walkthrough and its tests in the
same change. Reusable shared components should accept a guide target prop rather
than requiring wrapper hacks.

### 6.3 Walkthrough definition

```ts
type Walkthrough = {
  id: string;
  guideId: string;
  route: string;
  permissions: PermissionCode[];
  prerequisites: string[];
  steps: WalkthroughStep[];
  version: number;
};

type WalkthroughStep = {
  id: string;
  target?: string;
  title: string;
  body: string;
  placement?: "top" | "right" | "bottom" | "left" | "auto";
  advance: "next" | "target-click" | "route-change" | "manual";
  route?: string;
  optional?: boolean;
};
```

Persist only guide ID, walkthrough version, completed step IDs, and completion time,
scoped to the effective user identity. Proxy sessions must not share walkthrough
progress with the direct user session.

### 6.4 Accessibility and responsive behaviour

- Walkthrough controls must be keyboard operable and screen-reader labelled.
- Focus returns safely when the walkthrough closes.
- The highlighted control remains usable.
- The overlay must not trap users away from required confirmation or error UI.
- Desktop uses anchored coach marks.
- Phone uses a bottom sheet or compact card so the target and instructions remain
  visible without horizontal overflow.
- Complex editors remain desktop-first, consistent with the product depth policy.

### 6.5 Hardest workflows included in the initial programme

| Walkthrough | Why it needs guidance | Safety boundary |
|---|---|---|
| Create and configure a school | Multi-step onboarding and package setup | Stops before final creation until the user confirms |
| Create a role and assign it | Wide permission consequences | Never selects permissions or submits for the user |
| Build a workflow template | Conditions, stages, approver sources, publishing | Uses the shipped approver contract and stops before publish |
| Upload and resolve an import batch | Mapping, validation, row errors, commit | Never uploads a file or commits rows automatically |
| Build and run an export | Dataset, fields, filters, format, run | Never starts an export without the user's action |
| Create and post a journal | Balanced lines, period rules, posting impact | Stops before submit or post |
| Create an AR invoice and allocate a receipt | Several dependent records and accounting effects | Never posts, issues, or allocates automatically |
| Reconcile a bank statement | Import, matching, exceptions, final reconciliation | Never confirms matches or finalizes reconciliation |
| Complete procure-to-pay | Requisition through vendor payment | Split into linked chapters; no approvals or payments are automatic |
| Run payroll | Employee data, calculation, posting, payment | Never calculates, posts, or pays automatically |
| Close or reopen a fiscal period | Broad accounting consequences | Explains impact and stops before every state-changing action |
| Investigate failed payment or webhook | Cross-screen operational diagnosis | Read-only guidance; retry remains an explicit user action |
| Investigate an audit event | Filters, entity trail, session context | Read-only guidance |
| Configure finance or procurement settings | Large downstream effects | One section per chapter; never saves automatically |

## 7. Complete guide inventory by category

This is the coverage baseline. During implementation, each line becomes one or more
registry records with an owner and status. Large workflows should be split when one
article would require more than roughly twelve decision-bearing steps.

### 7.1 Getting started

- Sign in and activate an account.
- Reset a forgotten password.
- Navigate the dashboard and sidebar.
- Use workspace search and quick actions.
- Understand entities, branches, roles, and permission-based visibility.
- Read notifications and return to recent work.
- Find guides, launch a walkthrough, and create a support ticket.

### 7.2 Schools and users

- Browse, search, filter, and sort schools.
- Create and configure a school.
- View and edit a school.
- Create, view, and edit a branch.
- Add a school administrator.
- Browse CX and school users.
- Invite a CX user and understand invitation status.
- Edit a user and resolve account-access problems.
- Open a user's staff profile.

### 7.3 Roles and permissions

- Understand roles, permissions, resources, actions, dependencies, and groups.
- Create and edit a platform role.
- Assign roles to platform users.
- Review role change requests.
- Transfer super administrator ownership.
- Browse and maintain the permission catalogue.
- Create and edit permission modules, resources, actions, and dependencies.
- Create and edit permission groups.
- Diagnose why a user cannot see or perform an action.

### 7.4 Organogram and tasks

- Read and navigate the org chart.
- Build departments, positions, reporting lines, and matrix relationships.
- Create and maintain a staff profile.
- Understand cascading organogram changes.
- View personal and team task accountability.
- Create, update, complete, and review a task.

### 7.5 Approvals and workflow

- Review, approve, reject, or return an approval.
- Track a personal submission.
- Delegate approval responsibility.
- Inspect all workflow instances and team load.
- Create and manage approver groups.
- Create, validate, publish, revise, and retire a workflow template.
- Understand stages, conditions, roles, groups, and dynamic approvers.
- Diagnose a stalled, skipped, rejected, or unavailable approval.

### 7.6 Finance and payments

- Set up entities, chart of accounts, periods, currencies, tax codes, cost centres,
  and dimensions.
- Create, submit, approve, post, reverse, and inspect journals as permitted.
- Create and maintain customers and fee structures.
- Create, issue, inspect, void, and adjust AR invoices.
- Record receipts and allocate, unallocate, refund, or write off balances.
- Manage credit and debit notes, payment plans, concessions, and dunning.
- Manage bank accounts and reconcile statements.
- Create and track expense claims and petty cash vouchers.
- Build budgets, manage fixed assets, and track tax remittance.
- Run payroll from salary setup through payslips and statutory returns.
- Review collections, virtual accounts, payouts, batches, settlements, transaction
  logs, and failed provider events.
- Run and interpret trial balance, income statement, balance sheet, cash flow,
  changes in equity, and cost or dimension analysis.
- Close, lock, reopen, and audit fiscal periods safely.
- Configure finance settings and diagnose configuration health.

### 7.7 Procurement and inventory

- Understand the complete procure-to-pay lifecycle.
- Create, submit, revise, and track requisitions.
- Create and manage purchase orders.
- Record goods receipts and quality notes.
- Create, match, approve, and track vendor invoices.
- Create and track vendor payments.
- Work with the procurement approval queue.
- Create and govern vendors, categories, and catalogue items.
- Create RFQs, invite vendors, compare quotations, and award sourcing decisions.
- Create and monitor contracts.
- Manage stock items and movements.
- Read AP aging, GR/IR control, spend, and vendor-performance reports.
- Configure procurement settings and reference data.

### 7.8 Data imports and exports

- Choose or create an import template.
- Prepare, upload, validate, correct, commit, and review an import batch.
- Understand partial failures and row-level errors.
- Build, save, edit, and run an export.
- Select datasets, fields, filters, and output formats.
- Track queues, inspect runs, download files, and recover from failed exports.
- Create and review audit exports.

### 7.9 Audit and security

- Read the security dashboard.
- Search and filter audit events.
- Trace changes to an entity.
- Review live sessions, login attempts, account lockouts, password activity, and
  proxy sessions.
- Export audit evidence.
- Create and maintain compliance rules.
- Investigate suspicious activity without changing evidence.

### 7.10 Platform health and settings

- Use the health command centre.
- Investigate uptime, API endpoints, jobs, queues, incidents, tenants, SLOs, and
  provider webhooks.
- Understand platform settings and configuration sources.
- Configure school-onboarding defaults, security baselines, integrations,
  capabilities, entitlements, and overrides as permitted.
- Administer notification settings and templates.
- Distinguish a user problem, tenant problem, provider problem, and platform problem.

### 7.11 Account and personal security

- View and update a personal profile.
- Change a password safely.
- Review and end active sessions.
- Review personal login history and activity.
- Understand privacy and personal-data controls.
- Recognize proxy mode and return to the direct session.

### 7.12 Troubleshooting

- Permission denied or missing navigation item.
- Expired, inactive, locked, or unactivated account.
- Invitation not received or expired.
- Search, filters, pagination, or download appears not to work.
- Import rejected, partially failed, or stuck.
- Export failed, expired, or unavailable.
- Workflow has no approver or is stalled.
- Journal, invoice, period, allocation, reconciliation, payroll, or report cannot
  proceed because of setup or status.
- Requisition, PO, receipt, invoice, or payment status does not advance.
- Payment, settlement, payout, or provider webhook failed.
- Background job, integration, tenant, or endpoint is unhealthy.
- What to include in a support ticket.

## 8. Build sequence: one independently shippable slice at a time

Every slice includes implementation, unit coverage, real-backend screen verification,
phone and tablet overflow checks, screenshot review, guide records, and a short update
to the coverage ledger.

### Foundation

1. **Slice F1: Contracts and registry**
   - Add typed categories, audiences, guide records, route mappings, validators,
     ownership fields, and a coverage report script.
   - Add tests for duplicate IDs or slugs, missing owners, invalid routes, and
     permission metadata.

2. **Slice F2: Guide shell and homepage**
   - Add routes, responsive landing page, categories, role entry points, popular
     tasks, recently updated guides, empty states, and permission filtering.

3. **Slice F3: Article renderer**
   - Add article layout, table of contents, callouts, screenshots, deep-linked
     headings, related guides, open-screen action, feedback, and outdated reporting.

4. **Slice F4: Search and discovery**
   - Add local index, aliases, keyboard interaction, no-results handling, and guide
     results in workspace search.

5. **Slice F5: Contextual help and support handoff**
   - Add help-for-this-page, relevant troubleshooting, and safe ticket metadata.

6. **Slice F6: Walkthrough engine**
   - Add stable target API, coach marks, mobile sheet, branching, persistence,
     resume, version invalidation, missing-target recovery, accessibility, and tests.

### Category releases

7. **Slice C1: Getting started**
8. **Slice C2: Schools and users**
9. **Slice C3: Roles and permissions**
10. **Slice C4: Organogram and tasks**
11. **Slice C5: Approvals and workflow**
12. **Slice C6a: Finance setup, ledger, and close**
13. **Slice C6b: Finance receivables, banking, and reports**
14. **Slice C6c: Payments, payroll, expenses, budgets, assets, and tax**
15. **Slice C7a: Procurement vendors, sourcing, and contracts**
16. **Slice C7b: Procure-to-pay, inventory, analytics, and settings**
17. **Slice C8: Data imports and exports**
18. **Slice C9: Audit and security**
19. **Slice C10: Platform health and settings**
20. **Slice C11: Account and personal security**
21. **Slice C12: Troubleshooting and cross-link audit**

Each category release adds its relevant hard-workflow walkthroughs. Do not postpone
all walkthroughs to the end.

### Completion and operations

22. **Slice O1: Coverage and freshness dashboard**
   - Report shipped routes and registered high-value actions with no guide mapping.
   - Report stale review dates, broken guide relations, and walkthrough targets not
     found by verification.

23. **Slice O2: Analytics and editorial loop**
   - Add privacy-safe guide views, completions, walkthrough exits, helpful votes,
     outdated reports, and no-result searches.
   - Define a recurring review queue by owner and product risk.
   - Keep analytics separate from audit evidence, expose aggregate counts only to
     platform health operators, and delete raw events after 180 days.

24. **Slice O3: Final accessibility, responsive, security, and content audit**
   - Verify every category, role entry point, support handoff, and walkthrough on
     desktop and phone with real permission states.
   - Completed 2026-08-25. The final evidence, repaired findings, and remaining
     operating boundaries are recorded in `docs/HOW_TO_GUIDE_COVERAGE.md`.

## 9. Definition of done for every slice

A slice is complete only when all applicable items are true:

1. Behaviour and content use the same current interface labels.
2. Guide records are permission-aware and tenant-safe.
3. Articles contain prerequisites, steps, completion signals, and recovery advice.
4. Walkthrough targets are stable and covered by tests.
5. Walkthroughs never automate consequential actions.
6. Search and contextual mappings are updated.
7. Desktop, 390px phone, and 820px tablet layouts have been inspected.
8. Changed screens were driven against the real backend with populated data.
9. Accessibility checks cover keyboard, focus, headings, labels, and reduced motion.
10. The coverage ledger and content review date are current.
11. `CLAUDE.md` and `AGENTS.md` guide-alignment requirements are satisfied.

## 10. Future-change alignment contract

For every future product change, the implementer must determine guide impact before
declaring the work complete.

Guide impact exists when a change affects:

- A route, navigation label, permission, role, prerequisite, field, action, status,
  validation rule, confirmation, success result, error recovery, or workflow order.
- A screenshot-visible screen, contextual help mapping, search alias, support handoff,
  analytics event, walkthrough target, or walkthrough branch.
- Backend behaviour that changes what a user can do or what result they should expect.

When impact exists, update in the same change:

1. Guide registry metadata.
2. Relevant article steps and troubleshooting.
3. Screenshots when the visible instruction changed.
4. Contextual route mappings and search aliases.
5. Walkthrough definitions and stable targets.
6. Guide and walkthrough tests.
7. Review date, owner, and coverage ledger.

When no impact exists, the final work summary should state `Guide impact: none` with
a brief reason. This is a review signal, not a box-ticking replacement for inspection.

New user-visible workflows are not complete until they have at least one discoverable
guide record. Complex or high-risk workflows also require an interactive walkthrough,
or a written reason in the coverage ledger explaining why a walkthrough would be unsafe
or unhelpful.

## 11. Content ownership and review frequency

- High risk: roles, permissions, approvals, finance posting, payments, payroll,
  procurement payment, imports, security, and settings. Review every 90 days and on
  every behavioural change.
- Medium risk: school and user management, organogram, exports, audit investigation,
  health operations. Review every 180 days and on every behavioural change.
- Low risk: navigation, profile, general discovery. Review every 365 days and on
  every behavioural change.

Every guide has one named product or engineering owner. An owner may delegate a review,
but an unowned published guide fails registry validation.

## 12. Testing strategy

### Unit and contract tests

- Registry uniqueness, required metadata, route validity, relationships, and status.
- Permission filtering and forbidden-result removal.
- Search ranking, aliases, token prefixes, no-results normalization, and keyboard flow.
- Walkthrough state machine, branching, progress versioning, effective-identity scope,
  missing targets, and safe exit.
- Content link and screenshot path validation.

### Integration tests

- Homepage to article, article to product route, and article to walkthrough.
- Contextual help resolves the correct route-pattern guides.
- Workspace search returns only permitted guides.
- Support ticket receives safe metadata only.
- Walkthrough never advances past a consequential action without explicit user input.

### Visual and real-backend verification

- Run `/verify-design` after each guide screen or walkthrough UI change.
- Run the mobile audit at 390px and 820px for every affected route.
- Inspect populated articles, long titles, long step lists, missing screenshots,
  permission-limited categories, no search results, mobile coach marks, and target-not-
  found recovery.
- Drive each difficult workflow with seeded real data up to, but not automatically
  through, its consequential action.

## 13. Decisions locked by this plan

1. The guide lives inside Console under Support.
2. Recommended guide categories control navigation and category release order.
3. Repository content and a typed registry are canonical for v1.
4. Guide discovery is permission-aware.
5. Interactive walkthroughs are included from the foundation and ship per category.
6. Stable guide target IDs are repository contracts.
7. Walkthroughs teach consequential actions but never perform them for the user.
8. Product changes and affected guide changes ship together.
9. The system records the complete workflow inventory, not merely screen descriptions.
10. A coverage and freshness report makes omissions visible.
