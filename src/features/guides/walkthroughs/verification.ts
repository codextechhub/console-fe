export type WalkthroughVerificationRecord = {
  walkthroughId: string;
  version: number;
  verifiedAt: string;
  missingTargetIds: readonly string[];
};

// Baseline captured after the category release verification runs. A walkthrough
// version change deliberately invalidates its record until the changed targets
// have been driven again on desktop, phone, and tablet.
const VERSION_ONE_WALKTHROUGHS = [
  "walkthrough.roles.create-and-assign",
  "walkthrough.roles.transfer-super-admin",
  "walkthrough.roles.maintain-permission-catalogue",
  "walkthrough.organogram.build-structure",
  "walkthrough.organogram.maintain-staff-profiles",
  "walkthrough.workflow.review-and-act",
  "walkthrough.workflow.delegate-and-track",
  "walkthrough.workflow.build-template",
  "walkthrough.finance.configure-foundations",
  "walkthrough.finance.create-and-post-journal",
  "walkthrough.finance.close-lock-or-reopen-period",
  "walkthrough.finance.invoice-and-allocate-receipt",
  "walkthrough.finance.email-customer-documents",
  "walkthrough.finance.reconcile-bank-statement",
  "walkthrough.procurement.add-and-govern-vendor",
  "walkthrough.procurement.run-rfq-and-award",
  "walkthrough.procurement.manage-contract-lifecycle",
  "walkthrough.procurement.complete-procure-to-pay",
  "walkthrough.procurement.manage-stock-and-movements",
  "walkthrough.procurement.configure-settings",
  "walkthrough.data.import-batch",
  "walkthrough.data.import-templates",
  "walkthrough.data.build-and-run-export",
  "walkthrough.data.recover-import-export",
  "walkthrough.audit.investigate-event",
  "walkthrough.audit.review-security-operations",
  "walkthrough.audit.export-and-compliance",
  "walkthrough.platform.investigate-health",
  "walkthrough.platform.configure-platform",
  "walkthrough.platform.administer-notifications",
  "walkthrough.platform.manage-integrations",
  "walkthrough.finance.run-payroll",
  "walkthrough.finance.submit-and-settle-expense-claim",
  "walkthrough.finance.manage-petty-cash",
  "walkthrough.finance.build-and-approve-budget",
  "walkthrough.finance.manage-fixed-assets",
  "walkthrough.finance.file-and-pay-tax",
  "walkthrough.finance.collect-online-payments",
  "walkthrough.finance.send-payouts-and-resolve-settlements",
  "walkthrough.troubleshooting.prepare-support-ticket",
] as const;

export const WALKTHROUGH_VERIFICATION_RECORDS: readonly WalkthroughVerificationRecord[] = [
  {
    walkthroughId: "walkthrough.getting-started.console-basics",
    version: 2,
    verifiedAt: "2026-08-21",
    missingTargetIds: [],
  },
  {
    walkthroughId: "walkthrough.schools.create-and-configure",
    version: 2,
    verifiedAt: "2026-08-21",
    missingTargetIds: [],
  },
  {
    walkthroughId: "walkthrough.finance.adjust-credit-notes-and-concessions",
    version: 1,
    verifiedAt: "2026-08-23",
    missingTargetIds: [],
  },
  {
    walkthroughId: "walkthrough.finance.refund-or-write-off-balance",
    version: 3,
    verifiedAt: "2026-08-23",
    missingTargetIds: [],
  },
  {
    walkthroughId: "walkthrough.finance.create-and-manage-payment-plan",
    version: 2,
    verifiedAt: "2026-08-23",
    missingTargetIds: [],
  },
  ...VERSION_ONE_WALKTHROUGHS.map((walkthroughId) => ({
    walkthroughId,
    version: 1,
    verifiedAt: "2026-08-21",
    missingTargetIds: [],
  })),
];
