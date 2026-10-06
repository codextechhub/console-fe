import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

export default function DeferredIncomeDepositsAndDoubtfulDebtsArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Three screens keep the receivables honest about money that is not yet income: <strong>Deferred Income</strong> for fees billed before the period they pay for, <strong>Deposits</strong> for refundable deposits held for a customer, and <strong>Doubtful Debts</strong> for the allowance against debts that may not be paid. <strong>Finance Settings, Receivables</strong> sets how each one behaves.</p>
        <GuideCallout tone="info" title="Several of these act for every branch at once">
          Releasing deferred income, forfeiting deposits and running doubtful debts each post one journal per branch, so only someone who covers the whole school runs them. A Console operator covers every branch, so you are offered them whenever your keys allow.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="receivables-settings" title="Check the receivables settings">
        <p>Open <strong>Finance Settings, Receivables</strong>. These settings apply to every branch, so saving needs the settings update key and someone who covers the whole school; anyone else reads them.</p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Apply customer credit to new bills automatically</strong>: when on, a customer&rsquo;s unused credit settles each new bill as it posts.</li>
          <li><strong>Concessions above this need a second person</strong>: counted per bill, so two ₦6,000 discounts on one bill make ₦12,000.</li>
          <li><strong>Release method</strong> for fees billed ahead: spread monthly, or all at period start.</li>
          <li>The <strong>Doubtful debts</strong> bands: <strong>Over (days)</strong> and <strong>Provide (%)</strong>, up to 10 bands. An older band&rsquo;s rate cannot be lower than a younger band&rsquo;s.</li>
          <li><strong>Set a leaver&rsquo;s deposit against their unpaid bills</strong>, and <strong>Forfeit unclaimed deposits after (years)</strong>, counted from the day the customer left.</li>
          <li><strong>Payments from a payer</strong>: how one payment is split, and whose credit any surplus becomes.</li>
        </ul>
        <p><strong>Save receivables policy</strong> saves all of them together, and only changed values are written to the audit history.</p>
      </GuideSection>

      <GuideSection id="release-deferred-income" title="Release fees billed ahead">
        <p>A fee billed before the period it pays for sits in Deferred income and is released to revenue month by month. <strong>Deferred Income</strong> shows what is <strong>Waiting to be released</strong>, what has been <strong>Released to income</strong>, and what falls due each month.</p>
        <GuideSteps>
          <GuideStep title="Release what is due">Select <strong>Release due income</strong>, set <strong>Release up to</strong> (today or earlier), and select <strong>Release</strong>. It moves every month&rsquo;s share due by that date to revenue, one journal per branch. Running it again releases nothing twice.</GuideStep>
          <GuideStep title="Undo a month if needed">Select <strong>Undo a month&rsquo;s release</strong> and pick an open month. Its release journals are reversed and the shares wait to be released again. A closed month keeps its releases, and the form says which branch has closed it.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="info" title="An example">
          Bright Star bills ₦400,000 on 20 January for a term running to 30 April, spread monthly. On 31 January, Nkechi Ude releases due income up to that day, and January&rsquo;s share moves from Deferred income to revenue at the branch that billed it. The rest waits for February, March and April.
        </GuideCallout>
        <p>A month cannot be closed while its share is unreleased.</p>
      </GuideSection>

      <GuideSection id="hold-and-return-deposits" title="Hold, return, and forfeit deposits">
        <p>A fee line marked <strong>Refundable deposit</strong> (on a fee structure or a new invoice) goes to Deposits held (2170), never to income. <strong>Deposits</strong> lists every deposit with its customer, branch, invoice, amount, when the customer left, and its status.</p>
        <GuideSteps>
          <GuideStep title="Return a leaver's deposits">Open a held deposit and select <strong>Return deposits</strong>. It releases every deposit that customer holds, one credit note per branch. Any part the bill never collected is cancelled; the rest becomes credit to refund. When the setting allows it, choose <strong>Credit to refund</strong> or <strong>Set against unpaid bills first</strong>.</GuideStep>
          <GuideStep title="Forfeit unclaimed deposits">Select <strong>Forfeit unclaimed</strong> and an <strong>As of</strong> date. Every deposit still unclaimed the set number of years after its customer left moves to Forfeited deposit income, one journal per branch.</GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="doubtful-debts" title="Set the allowance for doubtful debts">
        <GuideSteps>
          <GuideStep title="Prepare a run">On <strong>Doubtful Debts</strong>, select <strong>New provision run</strong>, choose <strong>Age debts to</strong> and a narration, then <strong>Prepare run</strong>. It works out each branch&rsquo;s allowance from its debts aged to that date, using the school&rsquo;s bands.</GuideStep>
          <GuideStep title="Check it">Open the run. <strong>By branch</strong> shows what each branch needs, holds now, and the change; <strong>By age</strong> shows each band.</GuideStep>
          <GuideStep title="Submit or post it">Where the school requires approval, select <strong>Submit for approval</strong> and a second person approves it. Otherwise select <strong>Post provision</strong>. Either way the figures are worked out again when it posts, so receipts and write-offs made meanwhile count, and it posts one journal per branch.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="info" title="An example">
          With bands of 25% over 180 days and 50% over 365 days, Lekki has ₦800,000 overdue 200 days and ₦200,000 overdue 400 days. Its allowance needs ₦300,000. If Lekki already holds ₦250,000, the run raises it by ₦50,000.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5">
          <li>Release, Forfeit or New provision run is missing: you lack the key, or (in a school&rsquo;s own app) you do not cover the whole school.</li>
          <li>Release up to refuses a date: income is released for days that have passed, not ahead.</li>
          <li>The month will not close: some of its deferred income is still unreleased. Release due income first.</li>
          <li>A leaver&rsquo;s deposit was not set against their bills: the setting is off, or Credit to refund was chosen.</li>
          <li>A provision run is waiting: it needs a second person&rsquo;s approval under Workflow, Approvals.</li>
          <li>A provision run came back from the approver: it reads Sent back, on its row and when you open it, and the filter above the runs offers All runs or Sent back, to list only those. Whoever sent it for approval sees Sent back to you and Resume, which sends it back as it is. A run has no Edit: to change one, withdraw it under Workflow, My Submissions and submit it again.</li>
          <li>The settings are greyed: they bind every branch, so changing them needs the update key and whole-school reach.</li>
        </ul>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideChecklist items={[
          "Deferred income due by month end is released",
          "Every refundable deposit sits in Deposits held, not income",
          "Leavers' deposits are returned or set against their bills as the school decided",
          "The doubtful debts allowance matches the bands at the latest run",
          "Receivables settings changes were made by someone covering the whole school",
        ]} />
      </GuideSection>
    </div>
  );
}
