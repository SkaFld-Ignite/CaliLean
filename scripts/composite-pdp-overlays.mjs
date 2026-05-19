#!/usr/bin/env node
/**
 * SKA-47 v2 — composite-master line re-render
 *
 * Pipeline:
 *   1. Read master vial PNG (one render — vial size + background locked).
 *   2. For each SKU, generate an SVG overlay (compound / dosage / lot) using
 *      brand-locked typography.
 *   3. Composite SVG over master via sharp; export raw PNG + web JPG.
 *
 * Usage:
 *   node scripts/composite-pdp-overlays.mjs                 # all 8 SKUs
 *   node scripts/composite-pdp-overlays.mjs --only nad      # one SKU (test)
 *   node scripts/composite-pdp-overlays.mjs --ship          # also write to storefront/public/...
 *
 * Sharp is loaded from /tmp/svg-composite (heartbeat-installed) since neither
 * backend nor storefront have it as a dep yet.
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire("/tmp/svg-composite/package.json");
const sharp = require("sharp");
const opentype = require("opentype.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");

const MASTER_PNG = path.join(
  REPO,
  "docs/brand/imagery/renders/v2-pilot/master/raw/master-vial.SELECTED.png",
);

const OUT_RAW = path.join(REPO, "docs/brand/imagery/renders/v2-pilot/composites/raw");
const OUT_WEB = path.join(REPO, "docs/brand/imagery/renders/v2-pilot/composites/web");
const OUT_STOREFRONT = path.join(REPO, "storefront/public/brand/products");

// Inter TTFs vendored at scripts/fonts/. Base64-embedded in each SVG via
// @font-face so librsvg can render text without system fontconfig.
const FONT_REGULAR = path.join(__dirname, "fonts/Inter-Regular.ttf");
const FONT_MEDIUM  = path.join(__dirname, "fonts/Inter-Medium.ttf");

// ----- Label geometry (measured from master-vial.SELECTED.png, 1024x1024) ---
// Determined by sampling the white label rect against the linen background:
//   white card x: ~378..596  (width 218)
//   white card y: ~455..770  (height 315)
//   wordmark band (`calilean` baked into the master): y ~685..735
//
// Available real estate above the wordmark for the per-SKU overlay:
//   y ~460..670 (~210px tall)
//
// SVG canvas matches the master canvas (1024x1024) so x/y are absolute px.
const LABEL = {
  x: 378,
  y: 455,
  w: 218,
  h: 315,
  // Y baselines for the 3-line overlay (above the wordmark):
  yCompound: 510,      // ~55px below label top
  yDivider:  535,      // hairline separator
  yDosage:   580,      // ~70px below compound
  yLot:      640,      // ~60px below dosage, just above wordmark band
};

// ----- 8-SKU launch lineup --------------------------------------------------
// Folder slugs in storefront/public/brand/products/. The CJC blend folder uses
// the truncated "cjc-12-..." slug per the products-seed.json typo (memory:
// catalog_data_traps).
const SKUS = [
  {
    slug: "bpc-157",
    compound: "BPC-157",
    dosage: "10 mg",
    lot: "LOT 24-0410",
  },
  {
    slug: "wolverine",
    compound: "BPC-157 / TB-500",
    dosage: "5 mg + 5 mg",
    lot: "LOT 24-0421",
  },
  {
    slug: "cjc-12-no-dac-ipamorelin-blend",
    compound: "CJC-1295 / IPAMORELIN",
    dosage: "5 mg + 5 mg",
    lot: "LOT 24-0371",
  },
  {
    slug: "glutathione",
    compound: "GLUTATHIONE",
    dosage: "1500 mg",
    lot: "LOT 24-0513",
  },
  {
    slug: "mots-c",
    compound: "MOTS-C",
    dosage: "40 mg",
    lot: "LOT 24-0865",
  },
  {
    slug: "nad",
    compound: "NAD+",
    dosage: "500 mg",
    lot: "LOT 24-0424",
  },
  {
    slug: "cl-3r",
    compound: "CL-3R",
    dosage: "15 mg",
    lot: "LOT 24-0543",
  },
  {
    slug: "tb-500",
    compound: "TB-500",
    dosage: "10 mg",
    lot: "LOT 24-0542",
  },
];

// ----- SVG label-overlay template -------------------------------------------
// Typography: brand brief §3 — Switzer for the wordmark (baked into master),
// Inter for label data lines (humanist sans, similar metrics to Switzer).
// Text is converted to SVG <path>s up front via opentype.js so librsvg never
// has to do font lookup (no fontconfig dependency).
//
// Compound size auto-shrinks if the string is long (blend names) so all 8 SKUs
// share the same vertical baselines (the line-coherence ask).
let _fontCache = null;
async function loadFonts() {
  if (_fontCache) return _fontCache;
  const [reg, med] = await Promise.all([
    readFile(FONT_REGULAR),
    readFile(FONT_MEDIUM),
  ]);
  _fontCache = {
    regular: opentype.parse(reg.buffer.slice(reg.byteOffset, reg.byteOffset + reg.byteLength)),
    medium:  opentype.parse(med.buffer.slice(med.byteOffset, med.byteOffset + med.byteLength)),
  };
  return _fontCache;
}

// Render text centered at (cx, baselineY) as a single <path d="..."/>.
// `tracking` is per-em letter-spacing (in em units, applied as extra width).
function textToPath(font, text, cx, baselineY, fontSize, { tracking = 0, fill = "#1a1a1a" } = {}) {
  // Naive letter-spacing: render glyph by glyph and add `tracking * fontSize` between.
  // opentype.js getPath() lays out glyphs sequentially; we want manual control so
  // we walk glyphs ourselves and accumulate x.
  const glyphs = font.stringToGlyphs(text);
  const scale = fontSize / font.unitsPerEm;
  const trackingPx = tracking * fontSize;

  // First pass — total advance width (including tracking gaps).
  let total = 0;
  glyphs.forEach((g, i) => {
    total += g.advanceWidth * scale;
    if (i < glyphs.length - 1) total += trackingPx;
  });

  let x = cx - total / 2;
  const paths = [];
  for (let i = 0; i < glyphs.length; i++) {
    const g = glyphs[i];
    const p = g.getPath(x, baselineY, fontSize);
    paths.push(p.toPathData(2));
    x += g.advanceWidth * scale;
    if (i < glyphs.length - 1) x += trackingPx;
  }
  return `<path d="${paths.join(" ")}" fill="${fill}"/>`;
}

function buildOverlaySvg({ compound, dosage, lot }, fonts) {
  // Auto-fit compound to label width (~218px - 32px padding = 186px usable).
  let compoundSize = 30;
  if (compound.length > 10) compoundSize = 24;
  if (compound.length > 14) compoundSize = 20;
  if (compound.length > 20) compoundSize = 16;

  const cx = LABEL.x + LABEL.w / 2;
  const dividerInset = 28;

  const compoundPath = textToPath(fonts.medium,  compound, cx, LABEL.yCompound, compoundSize, { tracking: 0.02 });
  const dosagePath   = textToPath(fonts.regular, dosage,   cx, LABEL.yDosage,   22,           { tracking: 0.02 });
  const lotPath      = textToPath(fonts.regular, lot,      cx, LABEL.yLot,      11,           { tracking: 0.18, fill: "#555555" });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${compoundPath}
  <line x1="${LABEL.x + dividerInset}" y1="${LABEL.yDivider}" x2="${LABEL.x + LABEL.w - dividerInset}" y2="${LABEL.yDivider}" stroke="#1a1a1a" stroke-width="0.75" opacity="0.55"/>
  ${dosagePath}
  ${lotPath}
</svg>`;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ----- Composite + write ----------------------------------------------------
async function compositeOne(masterBuf, sku, { ship, fonts }) {
  const svg = buildOverlaySvg(sku, fonts);
  const composed = await sharp(masterBuf)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  const rawPath = path.join(OUT_RAW, `pdp-primary-${sku.slug}.png`);
  const webPath = path.join(OUT_WEB, `pdp-primary-${sku.slug}.jpg`);

  await writeFile(rawPath, composed);
  await sharp(composed).jpeg({ quality: 90, mozjpeg: true }).toFile(webPath);

  let shipPath = null;
  if (ship) {
    const dir = path.join(OUT_STOREFRONT, sku.slug);
    if (!existsSync(dir)) {
      console.warn(`  ! skipping ship (no storefront dir): ${dir}`);
    } else {
      shipPath = path.join(dir, "pdp-primary.jpg");
      await sharp(composed).jpeg({ quality: 90, mozjpeg: true }).toFile(shipPath);
    }
  }

  return { rawPath, webPath, shipPath };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const onlySlug = onlyArg ? onlyArg.split("=")[1] : null;
  const ship = args.has("--ship");

  const targets = onlySlug ? SKUS.filter((s) => s.slug === onlySlug) : SKUS;
  if (onlySlug && targets.length === 0) {
    throw new Error(`Unknown slug: ${onlySlug}`);
  }

  await mkdir(OUT_RAW, { recursive: true });
  await mkdir(OUT_WEB, { recursive: true });

  const masterBuf = await readFile(MASTER_PNG);
  const fonts = await loadFonts();
  console.log(`Master: ${MASTER_PNG} (${masterBuf.length} bytes)`);
  console.log(`Fonts:  Inter Regular + Medium (embedded as base64)`);
  console.log(`Targets: ${targets.map((s) => s.slug).join(", ")}`);
  console.log(`Ship to storefront: ${ship ? "YES" : "no"}\n`);

  for (const sku of targets) {
    process.stdout.write(`  [${sku.slug.padEnd(36)}] ${sku.compound} | ${sku.dosage} | ${sku.lot}\n`);
    const { rawPath, webPath, shipPath } = await compositeOne(masterBuf, sku, { ship, fonts });
    process.stdout.write(`    -> ${path.relative(REPO, rawPath)}\n`);
    process.stdout.write(`    -> ${path.relative(REPO, webPath)}\n`);
    if (shipPath) process.stdout.write(`    -> ${path.relative(REPO, shipPath)}  [SHIPPED]\n`);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
