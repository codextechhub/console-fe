// Shared chrome for the six QA test packs.
//
// One tester reads one pack, but six of them read the same *shape*: the same
// cover, the same reporting rules, the same run layout. That shape has already
// been through four rounds of correction, so it lives here rather than in six
// copies where the fifth would quietly keep wording the fourth had dropped.
//
// A track file supplies only what is genuinely its own - what the tester is
// testing, what looks broken but is not, which other track owns the overlap, and
// the runs themselves. Everything else is assembled here.

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  LevelFormat, PageBreak, Footer, PageNumber, convertInchesToTwip,
} = require("docx");

const INK = "1A1A1A";
const MUTED = "6B6B6B";
const ACCENT = "12457B";
const WARN = "8A3B12";
const RULE = { style: BorderStyle.SINGLE, size: 6, color: "D9D9D9" };

const INTRANET = "intranet.codexng.com";
/** The person a tester goes to when they are stuck or blocked. */
const OWNER = "Chidera";

// ── text primitives ────────────────────────────────────────────────────────
const t = (text, opts = {}) => new TextRun({ text, font: "Calibri", size: 21, color: INK, ...opts });

const p = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: 120, line: 276 },
    children: Array.isArray(text) ? text : [t(text, opts.run || {})],
    ...opts.para,
  });

const lead = (label, text) =>
  new Paragraph({
    spacing: { after: 120, line: 276 },
    children: [t(label + " ", { bold: true }), t(text)],
  });

const h1 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    children: [new TextRun({ text, font: "Calibri", size: 32, bold: true, color: ACCENT })],
  });

const h2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 140 },
    border: { bottom: RULE },
    children: [new TextRun({ text, font: "Calibri", size: 26, bold: true, color: INK })],
  });

const h3 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 260, after: 100 },
    children: [new TextRun({ text, font: "Calibri", size: 23, bold: true, color: ACCENT })],
  });

const bullets = (items) =>
  items.map((item) =>
    new Paragraph({
      numbering: { reference: "dot", level: 0 },
      spacing: { after: 60, line: 276 },
      children: Array.isArray(item) ? item : [t(item)],
    })
  );

// Numbers are written into the text rather than driven by a numbering instance:
// a run's steps must never restart or continue from the previous run's list, and
// a plain string cannot get that wrong.
const steps = (items) =>
  items.map((item, i) =>
    new Paragraph({
      spacing: { after: 70, line: 276 },
      indent: { left: convertInchesToTwip(0.28), hanging: convertInchesToTwip(0.28) },
      children: [t(`${i + 1}.  `, { bold: true }), ...(Array.isArray(item) ? item : [t(item)])],
    })
  );

const small = (text, color = MUTED) =>
  new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text, font: "Calibri", size: 18, color, italics: true })],
  });

const label = (text) =>
  new Paragraph({
    spacing: { before: 140, after: 60 },
    children: [new TextRun({ text, font: "Calibri", size: 20, bold: true, color: MUTED, allCaps: true })],
  });

const spacer = () => new Paragraph({ spacing: { after: 80 }, children: [t("")] });
const fill = (text) => t(text, { bold: true, color: "B03030" });

// ── tables ─────────────────────────────────────────────────────────────────
const cell = (children, { width, shade, bold, align } = {}) =>
  new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: shade ? { type: ShadingType.CLEAR, fill: shade, color: "auto" } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: (Array.isArray(children) ? children : [children]).map((c) =>
      typeof c === "string"
        ? new Paragraph({
            alignment: align,
            spacing: { after: 0, line: 264 },
            children: [new TextRun({ text: c, font: "Calibri", size: 19, bold, color: INK })],
          })
        : c
    ),
  });

const table = (rows, widths, { headerShade = "EAF0F6" } = {}) =>
  new Table({
    columnWidths: widths,
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    borders: {
      top: RULE, bottom: RULE, left: RULE, right: RULE,
      insideHorizontal: RULE, insideVertical: RULE,
    },
    rows: rows.map((row, r) =>
      new TableRow({
        tableHeader: r === 0,
        children: row.map((c, i) =>
          cell(c, { width: widths[i], shade: r === 0 ? headerShade : undefined, bold: r === 0 })
        ),
      })
    ),
  });

const callout = (title, lines, fillColor = "FDF3E7") =>
  new Table({
    columnWidths: [9360],
    width: { size: 9360, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: "E3C9A8" },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: "E3C9A8" },
      left: { style: BorderStyle.SINGLE, size: 18, color: "C98A3C" },
      right: { style: BorderStyle.SINGLE, size: 6, color: "E3C9A8" },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 9360, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: fillColor, color: "auto" },
            margins: { top: 140, bottom: 140, left: 180, right: 180 },
            children: [
              new Paragraph({
                spacing: { after: 80 },
                children: [new TextRun({ text: title, font: "Calibri", size: 21, bold: true, color: WARN })],
              }),
              ...lines.map((l) =>
                new Paragraph({
                  spacing: { after: 60, line: 264 },
                  children: [new TextRun({ text: l, font: "Calibri", size: 20, color: INK })],
                })
              ),
            ],
          }),
        ],
      }),
    ],
  });

// ── the run block ──────────────────────────────────────────────────────────
/**
 * One test run. `collector` accumulates {id, title} for the sign-off sheet, so a
 * run can never be in the pack without a line to record its result against.
 */
function makeRun(collector) {
  return function run({ id, title, what, why, before, doThis, passes, breakIt, note }) {
    collector.push({ id, title });
    const out = [h3(`${id}.  ${title}`)];
    out.push(lead("What this is:", what));
    if (why) out.push(lead("Why it matters:", why));
    if (before && before.length) {
      out.push(label("Before you start"));
      out.push(...bullets(before));
    }
    out.push(label("Do this"));
    out.push(...steps(doThis));
    out.push(label("It passes if"));
    out.push(...bullets(passes));
    if (breakIt && breakIt.length) {
      out.push(label("Now try to break it"));
      out.push(...bullets(breakIt));
    }
    if (note) out.push(small("Note: " + note));
    out.push(
      new Paragraph({
        spacing: { before: 100, after: 200 },
        border: { top: RULE },
        children: [
          new TextRun({
            text: "Result:  pass  /  fail  /  blocked          Ticket no: ______________",
            font: "Calibri", size: 18, color: MUTED,
          }),
        ],
      })
    );
    return out;
  };
}

// ── Part 1: the shared preamble ────────────────────────────────────────────
function coverAndContents({ trackNo, trackName, blurb, coverExtra = [], contents }) {
  const body = [
    new Paragraph({ spacing: { before: 1200, after: 0 }, children: [new TextRun({ text: "INTRANET TEST PACK", font: "Calibri", size: 22, bold: true, color: MUTED, allCaps: true })] }),
    new Paragraph({ spacing: { before: 100, after: 60 }, children: [new TextRun({ text: `Track ${trackNo}`, font: "Calibri", size: 60, bold: true, color: ACCENT })] }),
    new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: trackName, font: "Calibri", size: 40, bold: true, color: INK })] }),
    new Paragraph({ spacing: { after: 480 }, children: [new TextRun({ text: blurb, font: "Calibri", size: 22, color: MUTED, italics: true })] }),
  ];

  body.push(
    table(
      [
        ["Field", "Fill in"],
        ["Tester", "______________________________"],
        ["Dates for this round", "______________________________"],
        ["Intranet address", INTRANET],
        ["Your sign-in email", "______________________________"],
        ...coverExtra,
        ["Report problems as", "Support ticket inside the intranet"],
        ["Pack version", "v1  ·  16 August 2026"],
      ],
      [2600, 6760]
    )
  );

  body.push(new Paragraph({ children: [new PageBreak()] }));
  body.push(h1("What is in this pack"));
  body.push(table([["Part", "What it covers", "Time"], ...contents], [1100, 6960, 1300]));
  body.push(new Paragraph({ children: [new PageBreak()] }));
  return body;
}

function partOne({
  trackNo, prefix, whatYouAreTesting, notYours, firstSteps, entityNote,
  houseRules, knownIntended, crossTrack,
}) {
  const body = [h1("Part 1  ·  Read this first")];

  body.push(h2("1.1  What you are testing, in plain words"));
  whatYouAreTesting.forEach((para) => body.push(p(para)));
  body.push(p(notYours));

  body.push(h2("1.2  The first five minutes"));
  body.push(...steps(firstSteps));

  if (entityNote) {
    body.push(h2("1.3  The one idea you must understand: entities"));
    entityNote.paras.forEach((para) => body.push(p(para)));
    if (entityNote.footnote) body.push(small(entityNote.footnote));
  }

  body.push(h2(`${entityNote ? "1.4" : "1.3"}  House rules`));
  body.push(...bullets([
    [t("All six of us are on the same database. ", { bold: true }), t("Anything you create is visible to everyone else, and anything you delete is gone for them too.")],
    [t(`Name everything you create with ${prefix} and your first name. `, { bold: true }), t(`Something like "${prefix} Ada test". Then you can always find your own rows and nobody else has to guess whose they are.`)],
    [t("Never delete, cancel or suspend a record you did not create. ", { bold: true }), t("Somebody else is mid-test on it.")],
    ...houseRules,
    [t("Write down the reference of everything you create ", { bold: true }), t("(a code, a number, an email address). Every ticket you raise should carry one. It is the fastest way for a developer to find the exact row you were looking at.")],
    [t("Work on a laptop for the main runs. ", { bold: true }), t("The last section asks you to repeat a few things on a phone.")],
  ]));

  body.push(h2(`${entityNote ? "1.5" : "1.4"}  Things that look broken but are not`));
  body.push(p("These are deliberate. Do not raise tickets for them. If you spend an hour writing one of these up, that is an hour we all lose."));
  body.push(callout("Known and intended", knownIntended));
  body.push(spacer());

  body.push(h2(`${entityNote ? "1.6" : "1.5"}  How to report a problem`));
  body.push(p("Everything goes in as a support ticket inside the intranet. This does two jobs at once: we get a tracked report, and the ticketing system gets tested."));
  body.push(...steps([
    "Open Support in the main sidebar, then Create support ticket.",
    [t("Title: start with your run number, then a short factual statement of what is wrong. Example: "), t(`"${trackNo === 1 ? "C2" : "B1"} - the invite email never arrives"`, { italics: true }), t(".")],
    "Category: choose BUG for something broken, HELP for something you could not work out, OTHER for a suggestion.",
    "Priority: use the table below. Be honest in both directions. Marking cosmetics as URGENT hides the real fires.",
    "Description: use the five lines in the template below. Attach a screenshot if the problem is visual. Screenshots, PDFs, CSVs and spreadsheets are all accepted.",
    "Write the ticket number on the run's Result line in this pack, so we can match your sheet to the tracker later.",
  ]));

  body.push(label("Priority"));
  body.push(table(
    [
      ["Priority", "Use it when", "Example"],
      ["URGENT", "Data is lost or wrong, or you can see something you should not be able to see. Also: the screen is unusable and there is no way round it.", "A suspended user can still sign in."],
      ["HIGH", "A main action fails or produces the wrong result. There may be a workaround but it hurts.", "Saving a record returns an error and nothing is created."],
      ["MEDIUM", "Something is wrong but the work still gets done. Wrong labels, a filter that ignores you, broken layout on a phone.", "The status filter shows everyone when you asked for active only."],
      ["LOW", "Cosmetic. Spacing, wording, an icon that does not fit.", "A column header is in the wrong case."],
    ],
    [1200, 4460, 3700]
  ));

  body.push(label("Description template - copy this into every ticket"));
  body.push(table(
    [
      ["What I did", "Step by step, from a screen I can name. Include the reference of the record."],
      ["What I expected", "One sentence."],
      ["What actually happened", "One sentence, plus the exact text of any error message."],
      ["Where", "The web address in the bar, plus roughly what time it was."],
      ["How often", "Every time / once / only after doing X first."],
    ],
    [2200, 7160]
  ));

  body.push(h2(`${entityNote ? "1.7" : "1.6"}  Help you have while testing`));
  body.push(...bullets([
    [t("The small circled i beside a page title. ", { bold: true }), t("It explains what the screen is for. Read it. If it says something the screen does not do, that is a real finding, so raise it.")],
    [t("The help button. ", { bold: true }), t("It offers guides matched to the page you are on, and on some screens an interactive walkthrough that highlights things as you go.")],
    [t("Cmd+E or Ctrl+E ", { bold: true }), t('opens an action launcher. Type a few letters of what you want and it takes you there. Worth trying once for each of your screens.')],
  ]));

  body.push(h2(`${entityNote ? "1.8" : "1.7"}  When your track touches somebody else's`));
  body.push(table([["If this happens", "What to do"], ...crossTrack], [3000, 6360]));
  body.push(new Paragraph({ children: [new PageBreak()] }));
  return body;
}

function signOff(runIds) {
  const body = [h1("Sign-off sheet"), p("Fill this in as you go. Bring it to the wrap-up.")];
  const rows = [["Run", "What it covers", "Pass / fail / blocked", "Ticket no."]];
  runIds.forEach(({ id, title }) => rows.push([id, title, "", ""]));
  body.push(table(rows, [800, 4560, 2200, 1800]));
  body.push(spacer());
  body.push(table([["Tester signature", "Date"], ["", ""]], [5360, 4000]));
  return body;
}

// ── document assembly ──────────────────────────────────────────────────────
function buildDocument({ trackNo, trackName, body }) {
  return new Document({
    creator: "Intranet QA",
    title: `Intranet Test Pack - Track ${trackNo}: ${trackName}`,
    description: `Manual test script for one tester covering ${trackName.toLowerCase()} on the intranet.`,
    numbering: {
      config: [
        {
          reference: "dot",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: convertInchesToTwip(0.3), hanging: convertInchesToTwip(0.18) } },
                run: { font: "Calibri", size: 21 },
              },
            },
          ],
        },
      ],
    },
    styles: { default: { document: { run: { font: "Calibri", size: 21, color: INK } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1080, bottom: 1080, left: 1440, right: 1440 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: `Track ${trackNo}  ·  ${trackName}  ·  page `, font: "Calibri", size: 16, color: MUTED }),
                  new TextRun({ children: [PageNumber.CURRENT], font: "Calibri", size: 16, color: MUTED }),
                ],
              }),
            ],
          }),
        },
        children: body,
      },
    ],
  });
}

async function write(doc, outPath) {
  const fs = require("node:fs");
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buf);
  return buf.length;
}

module.exports = {
  INTRANET, OWNER, INK, MUTED, ACCENT, RULE,
  t, p, lead, h1, h2, h3, bullets, steps, small, label, spacer, fill,
  table, callout, makeRun, coverAndContents, partOne, signOff, buildDocument, write,
  Paragraph, PageBreak, TextRun,
};
