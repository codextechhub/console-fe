import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function RunPayrollArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Confirm the active entity, pay period, pay date, active employees, approved salary structures, bank account, and access to sensitive payroll figures. Payroll creates liabilities before cash moves, so posting and payment are separate controls.</p>
        <p>A school runs payroll one of two ways. <strong>Central</strong> is the default and needs no decision: one run covers everybody the school employs. <strong>Per branch</strong> means each branch&rsquo;s run covers that branch&rsquo;s staff, so the school raises one run per branch per pay period. The choice is <strong>Payroll scope</strong> under the Console&rsquo;s own Settings, Payroll, set per school, and it changes what a run covers rather than how it is calculated.</p>
        <GuideCallout tone="warning" title="Treat payroll figures as restricted data">Do not paste employee names, bank details, gross pay, deductions, or net pay into tasks, screenshots, or support tickets. Field Access decides which pay figures each role sees, and hidden figures stay hidden by design.</GuideCallout>
      </GuideSection>

      <GuideSection id="payroll-settings" title="Choose the payroll settings">
        <p>Open <strong>Finance Settings, Payroll</strong>. Changes apply from the next run generated. Saving needs the settings update key and someone who covers the whole school, because the policy binds every branch.</p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Where PAYE comes from</strong>: <strong>Computed from the national tax table</strong>, or <strong>Taken from the salary structure or roster</strong>. A person&rsquo;s PAYE can still be set by hand on their salary record, with a reason.</li>
          <li><strong>Deductions and contributions</strong>: a rate and an on/off switch for employee and employer pension, NHF, NSITF and the ITF levy.</li>
          <li><strong>Payslips</strong>: <strong>Show payslips in the app</strong> (staff read their own under My payslips) and <strong>Email payslips</strong> (each person is emailed a PDF).</li>
          <li><strong>Earlier pay</strong>: <strong>Earlier pay required</strong> and <strong>Payroll moved here on</strong>; see Record earlier pay below.</li>
          <li><strong>Voluntary deductions</strong>: the kinds the school allows, such as a staff loan or cooperative savings, each with the account it is owed to.</li>
        </ul>
      </GuideSection>

      <GuideSection id="prepare-the-roster" title="Prepare salary structures and the employee roster">
        <GuideSteps>
          <GuideStep title="Build approved structures">Define earning and deduction components, calculation bases, and the basic-pay component.</GuideStep>
          <GuideStep title="Check each salary record">Open a person on <strong>Employee salaries</strong> and select <strong>Edit</strong>. Confirm the staff member, branch, gross, cost centre, structure and active status. Inactive salary records are left out of generated runs.</GuideStep>
          <GuideStep title="Fill in tax and pension">Under <strong>Tax and pension</strong>, set <strong>State of residence</strong> (it starts as their branch&rsquo;s state), <strong>Tax ID</strong>, <strong>Pension administrator</strong>, <strong>Pension PIN</strong> and, if they claim rent relief, <strong>Annual rent</strong>. PAYE is paid to the state they live in, and pension to their administrator.</GuideStep>
          <GuideStep title="Date a change">Under <strong>When pay changes take effect</strong>, set <strong>Takes effect on</strong> and a reason for a change of branch, structure, pay, cost centre or state. Left empty, it applies from the first month not yet paid. A date ahead changes nothing until that day.</GuideStep>
          <GuideStep title="Give everyone a branch before switching to per branch">Every active salary record needs a branch, because a branch run only reaches the people assigned to that branch. Filter the roster by <strong>Unassigned</strong> to see who is still missing one, then set each person&rsquo;s branch. The branch can be changed later.</GuideStep>
        </GuideSteps>
        <p>A person&rsquo;s record also has <strong>Pay history</strong> (every change with the day it takes effect, marked <strong>Ahead</strong> while it is still to come) and <strong>Tax year</strong> (this employer&rsquo;s year so far, with a <strong>Tax summary PDF</strong> for roles that see every pay figure).</p>
      </GuideSection>

      <GuideSection id="earlier-pay" title="Record earlier pay">
        <p>Someone who joined after January earned pay earlier in the tax year. PAYE is worked out over the whole year, so record that pay on their salary record under <strong>Earlier pay</strong>, with <strong>Record earlier pay</strong>:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>A previous employer</strong>: from their P45 or tax deduction card. It counts in PAYE but is never this school&rsquo;s pay, so payslips and returns keep it apart.</li>
          <li><strong>Earlier months at this school</strong>: this school&rsquo;s own pay for the months before its payroll ran on Console. It counts as this school&rsquo;s pay in payslips and the annual return.</li>
        </ul>
        <p>Enter gross pay, taxable pay before reliefs, PAYE deducted, pension, NHF and an evidence reference. For somebody with no previous employer, select <strong>No previous employer</strong> to record zeros.</p>
        <GuideCallout tone="info" title="An example">
          Aisha Bello joins on 1 April after earning ₦900,000 elsewhere, with ₦45,000 PAYE deducted. With that recorded, April&rsquo;s PAYE is ₦95,330 and May to December ₦30,830 each, because the year&rsquo;s bands and the tax already paid are both counted. Without it, April would be worked out as if Aisha had earned nothing this year.
        </GuideCallout>
        <p>A correction reaches the next run; runs already posted keep the figures they used, and a draft run that holds the person must be cancelled first. When <strong>Earlier pay required</strong> is on, a run is refused while anyone on it joined after January with nothing recorded; when off, they are listed as a warning (<strong>Earlier pay still to record</strong>) and paid as though they earned nothing before. <strong>Payroll moved here on</strong> is only for a school whose payroll ran elsewhere earlier in the year.</p>
      </GuideSection>

      <GuideSection id="deductions" title="Voluntary deductions">
        <p>On a salary record, the <strong>Deductions</strong> tab holds amounts the person agreed to have taken from pay, such as a staff loan. Select <strong>Add deduction</strong>, choose the <strong>Kind</strong>, the amount <strong>Each month</strong>, and either <strong>Stop at a total</strong> or a <strong>Last run on or before</strong> date. It comes off every run until then. <strong>Stop</strong> ends it from the next run; what was already deducted stays on the runs that took it.</p>
        <p>The kinds come from Finance Settings, Payroll; if none exist yet, someone who covers the whole school adds them there.</p>
      </GuideSection>

      <GuideSection id="generate-and-review" title="Generate and review the payroll run">
        <p>Select <strong>New payroll run</strong>, choose Roster or Manual, set the pay date and period label, then create the draft. Review employee count, gross, PAYE, pension, net pay, component breakdowns, and totals against the approved payroll schedule. Under each line, <strong>How PAYE was worked out</strong> shows the working, and opens by naming where the PAYE came from: <strong>Computed from the national tax table</strong>, <strong>Taken from the salary structure or roster</strong>, <strong>Overridden on the employee&rsquo;s salary</strong> or <strong>Typed on a hand-raised run</strong>.</p>
        <p>At a school on per-branch payroll the drawer also asks <strong>This run covers</strong>, and there is no preselected answer. Choose the whole school, or one named branch. The line beneath the choice states how many active employees the run would pay and where, so read it before generating: the whole school and a single branch are one selection apart.</p>
        <p>After generating, a notice names anybody left off because another run already pays them for the month, and anybody with earlier pay still to record. To count earlier pay, cancel the draft, record it, and generate again. The <strong>Branch</strong> column on the runs list shows which branch each run covers.</p>
      </GuideSection>

      <GuideSection id="post-the-run" title="Calculate and post payroll">
        <p><strong>Calculate &amp; post</strong> records salary expense and credits PAYE payable, pension payable, and net-wages payable. Confirm the period is open and every line is correct before posting. A posted run reads <strong>Calculated</strong>.</p>
      </GuideSection>

      <GuideSection id="pay-net-wages" title="Pay net wages">
        <p>Open a calculated run, select <strong>Pay net</strong>, choose the approved bank account and payment date, then verify the amount. Payment debits net-wages payable and credits bank. It does not remit PAYE or pension.</p>
      </GuideSection>

      <GuideSection id="produce-evidence" title="Produce payslips and statutory returns">
        <p>The <strong>Payslips</strong> tab lists every line of every run. Select a row for the breakdown, and <strong>Payslip PDF</strong> to print or save it. A payslip shows earnings, deductions, net pay, what the employer paid on top, and this employer&rsquo;s year to date; earlier pay appears in its own block, kept out of the year to date when it came from a previous employer. The PDF needs a role that sees every pay figure on it.</p>
        <p><strong>Statutory returns</strong> lists PAYE, pension, NHF, NSITF and ITF schedules; they are filed and paid under <strong>Tax Remittance</strong>, because liability balances are tracked for the entity rather than one run.</p>
      </GuideSection>

      <GuideSection id="annual-paye-return" title="Prepare the annual PAYE return">
        <p>On <strong>Tax Remittance</strong>, select <strong>Annual PAYE return</strong> and choose the <strong>Tax year</strong>. It lists each person&rsquo;s tax ID, state, months here, gross, taxable pay, PAYE and pension at this employer for the year. It includes this school&rsquo;s own months before its payroll ran on Console, and never a previous employer&rsquo;s pay: that employer files it.</p>
        <p>The return needs a role that sees every pay figure on it.</p>
      </GuideSection>

      <GuideSection id="correct-a-run" title="Correct or cancel a payroll run">
        <GuideCallout tone="warning" title="The correction depends on status">Cancel a draft to discard it. Void a calculated run to reverse the journal it posted, which booked the salary expense and what is owed for it. A paid run cannot be voided until the disbursement is reversed through the approved recovery process.</GuideCallout>
        <p>Under per-branch payroll, two runs may share a pay period only when both cover different branches. A whole-school run overlaps every branch run, so raising one blocks the branches for that period, and raising a branch&rsquo;s run blocks the whole-school one. Cancelling the run raised in error is how the correct one becomes available; a cancelled run no longer counts as an overlap.</p>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5">
          <li>No employees generated: check active salary records and the selected entity.</li>
          <li>Figures are hidden: Field Access hides pay figures your role may not read. Request access only when the role requires per-employee values.</li>
          <li>Posting date rejected: choose a date covered by an open fiscal period.</li>
          <li>Pay action missing: the run must be calculated and the user needs payroll payment permission.</li>
          <li>A run is refused for missing earlier pay: Earlier pay required is on. Record it for each person named, with zeros where there was no previous employer.</li>
          <li>A correction to earlier pay is refused: a draft run holds the person. Cancel the draft, correct, and generate again.</li>
          <li>Add deduction is not offered: your role may not set how much comes off someone&rsquo;s pay, or no kinds of deduction exist yet.</li>
          <li>Payroll scope will not switch to per branch: active employees are still unassigned. The refusal names them; filter the roster by Unassigned, give each one a branch, then switch.</li>
          <li>A run is refused for overlapping another: under per-branch payroll a whole-school run and a branch run cannot share a pay period. Check the Branch column for the run already covering that period.</li>
          <li>The branch you need is not in the list: only branches currently in service are offered.</li>
        </ul>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check"><GuideChecklist items={["Payroll settings match the school's policy", "Roster, structures, and tax and pension details match the approved schedule", "Joiners after January have earlier pay recorded", "Draft totals and employee lines were independently reviewed", "The run covers the intended branch or the whole school", "Net wages and statutory liabilities were handled separately", "Payslips, schedules, journals, and bank evidence agree"]} /></GuideSection>
    </div>
  );
}
