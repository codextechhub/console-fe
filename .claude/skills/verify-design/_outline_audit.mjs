// Audit: find panel-like boxes whose boundary is invisible against what's behind them.
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const EMAIL = process.env.EMAIL || "admin@codexng.com";
const PASSWORD = process.env.PASSWORD || "Admin@123456";
const targets = (process.env.ROUTES || "").split(/[\s,]+/).map(s => s.trim()).filter(Boolean);

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const AUDIT = () => {
  // Computed colours come back as rgb(), rgba() AND oklch() in Chrome, so hand
  // parsing misses the token colours. Let the canvas do the conversion.
  const _cv = document.createElement("canvas"); _cv.width = _cv.height = 1;
  const _cx = _cv.getContext("2d", { willReadFrequently: true });
  const parse = (c) => {
    const v = String(c).trim();
    if (!v || v === "none" || v === "transparent") return null;
    const shadow = v.match(/(rgba?\([^)]*\)|okl(?:ch|ab)\([^)]*\)|color\([^)]*\)|#[0-9a-f]{3,8})/i);
    if (!shadow) return null;
    _cx.clearRect(0, 0, 1, 1);
    try { _cx.fillStyle = shadow[1]; } catch { return null; }
    _cx.fillRect(0, 0, 1, 1);
    const d = _cx.getImageData(0, 0, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
  };
  const over = (fg, bg) => fg.a >= 1 ? fg : {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1,
  };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const bgOf = (el) => {
    let n = el;
    while (n) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a > 0.95) return c; n = n.parentElement; }
    return { r: 255, g: 255, b: 255, a: 1 };
  };
  const out = [];
  for (const el of document.querySelectorAll("main *, [role=dialog] *")) {
    const r = el.getBoundingClientRect();
    if (r.width < 180 || r.height < 48) continue;
    const s = getComputedStyle(el);
    const own = parse(s.backgroundColor);
    if (!own || own.a < 0.9) continue;                 // only filled panels
    const behind = bgOf(el.parentElement);
    const fill = contrast(own, behind);
    // Same colour as what is behind it: not a distinct surface (a tbody inside
    // its own bordered panel), so it owes no boundary of its own.
    if (fill < 1.005) continue;
    // boundary: border, ring (box-shadow spread), or outline
    // A panel may be bounded on one side only (a header strip with border-b),
    // so score every side and keep the strongest.
    let bcon = 0, bw = 0, bcolor = "";
    for (const side of ["Top", "Right", "Bottom", "Left"]) {
      const w = parseFloat(s[`border${side}Width`]) || 0;
      if (!w) continue;
      const c = parse(s[`border${side}Color`]);
      if (!c || c.a <= 0.02) continue;
      const k = contrast(over(c, behind), behind);
      if (k > bcon) { bcon = k; bw = w; bcolor = s[`border${side}Color`]; }
    }
    // A Tailwind ring emits several shadow layers and the FIRST is the white
    // ring-offset, so score every layer and keep the strongest.
    const shadow = s.boxShadow && s.boxShadow !== "none" ? s.boxShadow : "";
    let rcon = 0;
    for (const m of shadow.matchAll(/rgba?\([^)]*\)|okl(?:ch|ab)\([^)]*\)|color\([^)]*\)|#[0-9a-f]{3,8}/gi)) {
      const rc = parse(m[0]);
      if (rc && rc.a > 0.02) rcon = Math.max(rcon, contrast(over(rc, behind), behind));
    }
    const boundary = Math.max(bcon, rcon);
    const visible = boundary >= 1.12 || fill >= 1.12;   // ~ a line you can actually see
    if (!visible) {
      out.push({
        cls: el.className && String(el.className).slice(0, 150),
        tag: el.tagName.toLowerCase(),
        w: Math.round(r.width), h: Math.round(r.height),
        fill: +fill.toFixed(3), border: +bcon.toFixed(3), ring: +rcon.toFixed(3),
        bw, bcolor, shadow: shadow.slice(0, 80),
      });
    }
  }
  return out;
};

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.getByPlaceholder("Enter your email").fill(EMAIL);
await page.getByPlaceholder("Enter your password").fill(PASSWORD);
await page.getByRole("button", { name: "Login" }).click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 });

for (const path of targets) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(1200);
  const rows = await page.evaluate(AUDIT);
  console.log(`\n### ${path}  (${rows.length} invisible panels)`);
  for (const r of rows) console.log(`  ${r.w}x${r.h} fill=${r.fill} border=${r.border}(${r.bw}px ${r.bcolor}) ring=${r.ring}\n     ${r.cls}`);
}
await browser.close();
