// Build one QA test pack, or all of them.
//
// .cjs on purpose: the app's package.json sets "type": "module", so a .js file
// here would be parsed as ESM and every require() would fail.
//
//   node docs/qa/_build/build.cjs 1       # just track 1
//   node docs/qa/_build/build.cjs         # every track that exists
//
// Needs the `docx` package. It is not a dependency of the app - these documents
// are internal and nothing in src/ imports this - so install it on demand:
//
//   npm i --no-save docx
//
// Output goes to docs/qa/, which is where the committed .docx files live.

const fs = require("node:fs");
const path = require("node:path");
const { buildDocument, write } = require("./pack.cjs");

const OUT_DIR = path.join(__dirname, "..");
const TRACKS_DIR = path.join(__dirname, "tracks");

const slug = (name) => name.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function buildOne(file) {
  const build = require(path.join(TRACKS_DIR, file));
  const { trackNo, trackName, body, runCount } = build();
  const out = path.join(OUT_DIR, `Track-${trackNo}-${slug(trackName)}.docx`);
  const bytes = await write(buildDocument({ trackNo, trackName, body }), out);
  console.log(`Track ${trackNo}  ${trackName}`);
  console.log(`  ${path.relative(process.cwd(), out)}  ${bytes.toLocaleString()} bytes, ${runCount} runs`);
}

async function main() {
  const wanted = process.argv[2];
  const files = fs.readdirSync(TRACKS_DIR)
    .filter((f) => f.endsWith(".cjs"))
    .filter((f) => !wanted || f === `track-${wanted}.cjs`)
    .sort();

  if (!files.length) {
    console.error(wanted ? `No track file for "${wanted}".` : "No track files found.");
    process.exit(1);
  }
  for (const file of files) await buildOne(file);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
