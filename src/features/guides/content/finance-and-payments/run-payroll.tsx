import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function RunPayrollArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Confirm the active entity, pay period, pay date, active employees, approved salary structures, bank account, and access to sensitive payroll figures. Payroll creates liabilities before cash moves, so posting and payment are separate controls.</p>
        <p>A school runs payroll one of two ways. <strong>Central</strong> is the default and needs no decision: one run covers everybody the school employs. <strong>Per branch</strong> means each site's run covers that site's staff, so the school raises one run per branch per pay period. The setting is <strong>Payroll scope</strong> under Settings, and it changes what a run covers rather than how it is calculated.</p>
        <GuideCallout tone="warning" title="Treat payroll figures as restricted data">Do not paste employee names, bank details, gross pay, deductions, or net pay into tasks, screenshots, or support tickets. Users without the sensitive payroll grant see masked values by design.</GuideCallout>
      </GuideSection>
      <GuideSection id="prepare-the-roster" title="Prepare salary structures and the employee roster">
        <GuideSteps>
          <GuideStep title="Build approved structures">Define earning and deduction components, calculation bases, and the basic-pay component. Only PAYE and pension deductions currently route to statutory payables.</GuideStep>
          <GuideStep title="Check employee salaries">Confirm the employee, branch, structure, gross amount, PAYE, pension, and active status. Inactive salary rows are excluded from generated runs.</GuideStep>
          <GuideStep title="Give everyone a branch before switching to per branch">Every active salary row needs a site, because a branch run only reaches the people assigned to that branch. Filter the roster by <strong>Unassigned</strong> to see exactly who is still missing one, then set each person's branch in the salary drawer. The branch can be changed later; it is not fixed at creation.</GuideStep>
          <GuideStep title="Resolve gaps first">A generated run copies the current roster. Correct missing or duplicate employees before generation rather than patching the run without evidence.</GuideStep>
        </GuideSteps>
      </GuideSection>
      <GuideSection id="generate-and-review" title="Generate and review the payroll run">
        <p>Select <strong>New payroll run</strong>, choose Roster or Manual, set the pay date and period label, then create the draft. Review employee count, gross, PAYE, pension, net pay, component breakdowns, and totals against the approved payroll schedule.</p>
        <p>At a school on per-branch payroll the drawer also asks <strong>This run covers</strong>, and there is no preselected answer. Choose the whole school, or one named site. The line beneath the choice states how many active employees the run would pay and where, so read it before generating: the whole school and a single site are one selection apart. Users assigned to a single branch are not asked, because their run always covers their own site, and a school on central payroll never sees the question at all.</p>
        <p>Once several runs exist, the <strong>Branch</strong> column on the runs list identifies which site each one covers. It appears only where a run actually carries a branch, and a whole-school run is shown as covering the whole school rather than left blank.</p>
      </GuideSection>
      <GuideSection id="post-the-run" title="Calculate and post payroll">
        <p><strong>Calculate &amp; post</strong> records salary expense and credits PAYE payable, pension payable, and net-wages payable. Confirm the period is open and every line is correct before posting.</p>
      </GuideSection>
      <GuideSection id="pay-net-wages" title="Pay net wages">
        <p>Open a calculated run, select <strong>Pay net</strong>, choose the approved bank account and payment date, then verify the amount. Payment debits net-wages payable and credits bank. It does not remit PAYE or pension.</p>
      </GuideSection>
      <GuideSection id="produce-evidence" title="Produce payslips and statutory evidence">
        <p>Use Payslips for employee evidence and Statutory returns for PAYE and pension schedules. Remit the outstanding statutory liability under Tax Remittance, because liability balances are tracked for the entity rather than assigned to one payroll run.</p>
      </GuideSection>
      <GuideSection id="correct-a-run" title="Correct or cancel a payroll run">
        <GuideCallout tone="warning" title="The correction depends on status">Cancel a draft to discard it. Void a calculated run to reverse its accrual journal. A paid run cannot be voided until the disbursement is reversed through the approved recovery process.</GuideCallout>
        <p>Under per-branch payroll, two runs may share a pay period only when both cover different branches. A whole-school run overlaps every branch run, so raising one blocks the sites for that period, and raising a site's run blocks the whole-school one. Cancelling the run raised in error is how the correct one becomes available; a cancelled run no longer counts as an overlap.</p>
      </GuideSection>
      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5"><li>No employees generated: check active roster rows and the selected entity.</li><li>Figures are masked: request the sensitive payroll grant only when the role requires per-employee values.</li><li>Posting date rejected: choose a date covered by an open fiscal period.</li><li>Pay action missing: the run must be calculated and the user needs payroll payment permission.</li><li>Payroll scope will not switch to per branch: active employees are still unassigned. The refusal names them; filter the roster by Unassigned, give each one a site, then switch.</li><li>A run is refused for overlapping another: under per-branch payroll a whole-school run and a branch run cannot share a pay period. Check the Branch column for the run already covering that period.</li><li>The branch you need is not in the list: only sites currently in service are offered, and a user assigned to one branch is offered only that branch.</li></ul>
      </GuideSection>
      <GuideSection id="completion-check" title="Completion check"><GuideChecklist items={["Roster and structures match the approved schedule", "Draft totals and employee lines were independently reviewed", "The run covers the intended branch or the whole school", "The run is in the intended status", "Net wages and statutory liabilities were handled separately", "Payslips, schedules, journals, and bank evidence agree"]} /></GuideSection>
    </div>
  );
}
