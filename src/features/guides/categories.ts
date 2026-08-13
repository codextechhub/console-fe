import type { GuideCategory } from "./types";

export const GUIDE_CATEGORIES = [
  { id: "getting-started", title: "Getting started", description: "Learn the Console basics and find your way around.", order: 1 },
  { id: "schools-and-users", title: "Schools and users", description: "Set up schools, branches, administrators, and user accounts.", order: 2 },
  { id: "roles-and-permissions", title: "Roles and permissions", description: "Control access safely and understand what each permission allows.", order: 3 },
  { id: "organogram-and-tasks", title: "Organogram and tasks", description: "Maintain reporting structures, staff profiles, and accountability.", order: 4 },
  { id: "approvals-and-workflow", title: "Approvals and workflow", description: "Submit, review, delegate, and configure approval processes.", order: 5 },
  { id: "finance-and-payments", title: "Finance and payments", description: "Run accounting, receivables, payments, payroll, and reporting.", order: 6 },
  { id: "procurement-and-inventory", title: "Procurement and inventory", description: "Manage purchasing, vendors, sourcing, stock, and payables.", order: 7 },
  { id: "data-imports-and-exports", title: "Data imports and exports", description: "Move data into and out of Console safely.", order: 8 },
  { id: "audit-and-security", title: "Audit and security", description: "Investigate activity, evidence, access, and compliance.", order: 9 },
  { id: "platform-health-and-settings", title: "Platform health and settings", description: "Operate the platform and maintain shared configuration.", order: 10 },
  { id: "account-and-personal-security", title: "Account and personal security", description: "Manage your profile, password, sessions, and privacy.", order: 11 },
  { id: "troubleshooting", title: "Troubleshooting", description: "Understand common failures and recover without losing work.", order: 12 },
] as const satisfies readonly GuideCategory[];
