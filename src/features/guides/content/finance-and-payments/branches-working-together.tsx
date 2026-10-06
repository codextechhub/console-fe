import { GuideCallout, GuideChecklist, GuideSection, GuideStep, GuideSteps } from "../../article-components";

/**
 * Between Branches: money, costs, stock and customer balances passing between
 * two branches of one set of books, and what each leaves owed.
 *
 * The examples use one school with an Ikeja Branch and a Lekki Branch so the
 * figures can be followed from one section to the next.
 */
export default function BranchesWorkingTogetherArticle() {
  return (
    <div className="space-y-10">
      <GuideSection id="before-you-start" title="Before you start">
        <p>Every branch keeps its own books. When money, a cost, stock or a customer&rsquo;s balance passes from one branch to another, each branch books its own side through the inter-branch account (1260), naming the other branch. The two branches then <strong>owe each other</strong> until it is repaid.</p>
        <p>The <strong>Between Branches</strong> menu shows only where the books run more than one branch. An address typed by hand at a one-branch school says <strong>One branch</strong> instead of showing empty lists.</p>
        <GuideChecklist items={[
          "The books run more than one branch.",
          "Each branch has a bank account, ideally a collection account that money can land in.",
          "You hold the view key for the screen you need: inter-branch view for most of them, receipt view for Held Receipts.",
        ]} />
        <GuideCallout tone="info" title="Console operators act for the whole school">
          In a school&rsquo;s own app, someone who works at one branch is offered fewer actions: a void, for example, needs somebody who works in both branches. A Console operator covers every branch, so you are offered every action your keys allow. Take the same care the branch rule exists for.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="transfers-register" title="Read the transfers register">
        <p><strong>Inter-branch Transfers</strong> lists everything that passed between two branches. The <strong>What</strong> column says which kind it is:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Money</strong>: cash sent or asked for.</li>
          <li><strong>Forwarded receipt</strong>: money one branch collected for another and passed on.</li>
          <li><strong>Customer balance moved</strong>: a customer&rsquo;s account moved to another branch.</li>
          <li><strong>Recharge share</strong>: one branch&rsquo;s share of a cost another branch paid.</li>
          <li><strong>Stock</strong>: goods moved between two branches&rsquo; stores.</li>
          <li><strong>Income given back</strong>: income taken back from a branch when a moved bill was credited.</li>
          <li><strong>Shared bank split</strong>: a difference agreed when a shared bank account was split by branch.</li>
        </ul>
        <p>Narrow the list with <strong>Any stage</strong>, <strong>Any kind</strong> and <strong>Branch</strong>; once a branch is picked, <strong>With branch</strong> narrows it to one pair. Open a row to read one sentence on what it leaves between the two branches, both branches&rsquo; journals, and links to the held receipt or recharge behind it.</p>
      </GuideSection>

      <GuideSection id="send-or-ask" title="Send money, or ask for it">
        <GuideSteps>
          <GuideStep title="Send money">Select <strong>Send money</strong>. Choose the <strong>Sending branch</strong>, the account it is <strong>Paid from</strong>, the branch it goes <strong>To</strong>, the amount and <strong>What it is for</strong>. <strong>Repay by</strong> and <strong>Reference</strong> are optional. Leave <strong>Paid into</strong> empty and the money lands in the receiving branch&rsquo;s collection account. A send follows the sending branch&rsquo;s approval route, so it may read <strong>Waiting for approval</strong> first.</GuideStep>
          <GuideStep title="Or ask for it">Select <strong>Ask for money</strong>. Choose <strong>Your branch</strong>, the branch to ask, the amount and what it is for. Nothing is booked until the branch you ask sends it.</GuideStep>
          <GuideStep title="The asked branch answers">Open the request and select <strong>Send</strong>, choosing the account it is paid from, or <strong>Decline</strong> with a reason. A decline reverses nothing, because nothing was booked. Once the send is with its approvers, including after they send it back, neither is offered.</GuideStep>
          <GuideStep title="The receiving branch confirms">When the money reaches the bank, open the transfer and select <strong>Confirm it arrived</strong>, giving the day it arrived. Until then it reads <strong>Sent, not yet confirmed</strong>.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="info" title="An example">
          Lekki is ₦1,500,000 short for September salaries. Chiamaka Obi, Lekki&rsquo;s bursar, asks Ikeja for ₦1,500,000 for &ldquo;Salaries shortfall&rdquo;, repay by 31 December. Ikeja&rsquo;s bursar, Femi Adeyemi, opens the request and sends it from Ikeja&rsquo;s main account. When it lands, Chiamaka confirms it arrived. Lekki now owes Ikeja ₦1,500,000 until Lekki repays it.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="who-owes-whom" title="See who owes whom">
        <p>Open <strong>Inter-branch Balances</strong>. <strong>Who owes whom</strong> shows each pair of branches once, with the amount and whether <strong>Both books</strong> <strong>Agree</strong> or <strong>Disagree</strong>. Select <strong>Transfers</strong> on a pair to open the register narrowed to that pair.</p>
        <p><strong>Money held for another branch</strong> lists money one branch collected for another and has not yet forwarded. Above both, a line says whether the inter-branch account nets to zero across every branch, as it should.</p>
        <GuideCallout tone="warning" title="A disagreement stops the month closing">
          A pair marked Disagree has something booked on one side only. The month will not close until it is found. Open the pair&rsquo;s transfers and look for the one with a single journal.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="held-receipts" title="Money collected for another branch">
        <p>When a customer pays at one branch for another branch&rsquo;s bill, the branch that took the money cannot settle that bill. It holds the money instead, booked to Held for other branches (2190), and forwards it.</p>
        <GuideSteps>
          <GuideStep title="Record it">In <strong>Held Receipts</strong>, select <strong>Record money for another branch</strong>. Choose where it was <strong>Collected at</strong>, the account it was <strong>Paid into</strong>, the branch it is <strong>For</strong>, the <strong>Customer who paid</strong>, the amount and the day it was <strong>Received on</strong>. It reads <strong>Held</strong>.</GuideStep>
          <GuideStep title="Forward it">Open it and select <strong>Forward to</strong> the other branch. It follows the approval route for money sent between branches and reads <strong>Forwarding</strong>, then <strong>Forwarded</strong>. Once sent, it becomes a receipt at the other branch and settles the customer&rsquo;s bills there. If its approval ends without sending it, the receipt is held again and can be forwarded again.</GuideStep>
        </GuideSteps>
        <p>Recording needs the key to record receipts. A held receipt can be voided only while it has not been forwarded and is not matched to a bank statement line; once forwarded, void the forwarding transfer first.</p>
        <GuideCallout tone="info" title="An example">
          Chidi Okafor pays ₦300,000 at Ikeja&rsquo;s desk for Emeka&rsquo;s Lekki bill. Ikeja records it as held for Lekki, then forwards it. At Lekki it settles Emeka&rsquo;s bill, and nothing is owed between the branches.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="shared-costs" title="Share a cost">
        <p>A <strong>recharge</strong> shares a cost one branch paid with the branches it served. No money moves: the paying branch&rsquo;s expense falls by the others&rsquo; shares, each other branch books its share as its own expense, and owes the paying branch until it repays.</p>
        <GuideSteps>
          <GuideStep title="Raise the recharge">In <strong>Recharges</strong>, select <strong>Recharge a shared cost</strong>. Choose who it was <strong>Paid by</strong>, a <strong>Shared cost rule</strong> if one fits (or <strong>None, split it by hand</strong>), <strong>What the cost was</strong>, the <strong>Whole cost</strong>, and the expense account.</GuideStep>
          <GuideStep title="Split it">Choose <strong>By counts</strong>, such as pupils or staff per branch, or <strong>By fixed percentages</strong>. At least one other branch must take a share. Select <strong>Book recharge</strong>.</GuideStep>
        </GuideSteps>
        <p><strong>Shared Cost Rules</strong> keep the school&rsquo;s standing choice for each kind of cost: <strong>Recharge it</strong> or <strong>Paying branch absorbs it</strong>, and how a recharge splits. A cost whose rule says the paying branch absorbs it cannot be recharged until the rule changes. Rules apply to every branch, so <strong>New rule</strong> and <strong>Edit</strong> are offered only to someone who covers the whole school.</p>
        <GuideCallout tone="info" title="An example">
          Ikeja pays ₦600,000 for the September internet. The rule splits internet Ikeja 60%, Lekki 40%. Ikeja keeps ₦360,000 as its expense, Lekki books ₦240,000, and Lekki owes Ikeja ₦240,000.
        </GuideCallout>
        <p>To undo a recharge, void the recharge itself; that reverses every branch&rsquo;s share together. A single share is never voided from the register.</p>
      </GuideSection>

      <GuideSection id="stock-transfer" title="Move stock to another branch's store">
        <p>Stock moves on <strong>Procurement, Inventory, Stock Items</strong>: open the item and select <strong>Transfer</strong>. It needs the key to issue stock, and it appears only when there is more than one store or more than one branch.</p>
        <p>Choose the <strong>From store</strong>, then pick the receiving store under <strong>To store</strong> or type <strong>the code of a store at another branch</strong> (for example LEK-MAIN), then the quantity. Stock moves at the sending store&rsquo;s average cost. Between two stores of one branch nothing is booked. Between two branches, the receiving branch owes the sending branch the value moved, and a <strong>Stock</strong> line appears in the transfers register and on the balances.</p>
        <GuideCallout tone="info" title="An example">
          Ikeja sends 50 exercise books to Lekki&rsquo;s main store, code LEK-MAIN, at Ikeja&rsquo;s average cost of ₦300 each. Ikeja&rsquo;s stock falls by ₦15,000, Lekki&rsquo;s rises by ₦15,000, and Lekki owes Ikeja ₦15,000.
        </GuideCallout>
        <p>A stock transfer is never voided. To reverse one, transfer the goods back the other way.</p>
      </GuideSection>

      <GuideSection id="move-a-balance" title="Move a customer's balance to another branch">
        <p>When a customer changes branch, their account goes with them. Select <strong>Move a customer&rsquo;s balance</strong> on Inter-branch Transfers, or <strong>Move to another branch</strong> on the customer&rsquo;s record. Choose the <strong>Customer</strong>, <strong>From branch</strong>, <strong>To branch</strong>, the <strong>Move date</strong> and <strong>Why</strong>.</p>
        <p>The open invoices and debit notes, any unspent credit and the fees not yet earned move to the new branch, which collects from then on. Income earned up to the move date stays with the old branch, and the new branch owes it for that. When it is done the drawer lists what moved and what one branch now owes the other, with <strong>Open the move</strong>.</p>
        <GuideCallout tone="info" title="An example">
          Tunde owes ₦400,000 on a term billed at Ikeja and has ₦10,000 of credit. They move to Lekki when ₦380,000 of the term is not yet earned. Lekki takes the bill, the credit and the ₦380,000 not yet earned, and owes Ikeja ₦10,000: the ₦20,000 Ikeja already earned, less the ₦10,000 of credit Lekki now holds for Tunde.
        </GuideCallout>
        <p>Moving binds two branches&rsquo; books, so only someone who covers the whole school is offered it. The moved bills cannot be voided on their own while the move stands.</p>
      </GuideSection>

      <GuideSection id="void-a-transfer" title="Void a transfer">
        <p>Open the transfer and select <strong>Void</strong>. It reverses both branches&rsquo; journals, so in a school&rsquo;s own app it needs somebody who works in both branches. It is refused when:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Money sent: either bank side is matched on a reconciliation. Unmatch it there first.</li>
          <li>A customer balance moved: anything moved has been paid, credited or released at the new branch. Move the balance back with another move instead.</li>
        </ul>
        <p>Some kinds are never voided from the register, and the transfer says what to do instead: stock (transfer it back), a shared bank split difference (settle it with a cash transfer the other way), a recharge share (void the recharge), and income given back (void the credit note or concession that gave it back).</p>
      </GuideSection>

      <GuideSection id="common-problems" title="Common problems">
        <ul className="list-disc space-y-2 pl-5">
          <li>Between Branches is not in the menu: the books run one branch, or you lack the view key for that screen.</li>
          <li>The screen says One branch: there is no other branch to deal with, so nothing here applies.</li>
          <li>A request has been waiting for days: it waits for the asked branch to Send or Decline. Nothing is booked until then.</li>
          <li>A send reads Waiting for approval: it is in the sending branch&rsquo;s approval route under Workflow, Approvals.</li>
          <li>A send reads Not sent: its approval was rejected, withdrawn or cancelled, and no money moved.</li>
          <li>A send came back from the approver: it reads Sent back in the register. The stage filter lists it under Sent back, which shows only sends an approver sent back, and under Requested or sent back. Whoever sent it for approval sees Sent back to you and Resume, which sends it back as it is. A send has no Edit: to change one, withdraw it under Workflow, My Submissions. Money sent without being asked is then cancelled, so send it again; money another branch asked for goes back to waiting to be sent.</li>
          <li>Send and Decline are missing on a request: someone at the asked branch has already sent it, and the send is with its approvers or was sent back. To decline the request instead, they withdraw the approval request under Workflow, My Submissions first. The request goes back to waiting, with Send and Decline.</li>
          <li>Void is missing: the kind is never voided from the register, or you lack the void key. Read the note on the transfer.</li>
          <li>Book recharge stays off after picking a rule: the rule says the paying branch absorbs that cost. Change the rule to recharge it first.</li>
          <li>The month will not close: a pair on Inter-branch Balances disagrees. Find the transfer booked on one side only.</li>
        </ul>
      </GuideSection>

      <GuideSection id="completion-check" title="Completion check">
        <GuideChecklist items={[
          "Every transfer sent has been confirmed by the branch that received it",
          "Money held for another branch has been forwarded",
          "Every pair on Inter-branch Balances agrees",
          "The inter-branch account nets to zero across every branch",
          "Shared costs follow the school's rules",
          "Moved customers show their bills at their new branch",
        ]} />
      </GuideSection>
    </div>
  );
}
