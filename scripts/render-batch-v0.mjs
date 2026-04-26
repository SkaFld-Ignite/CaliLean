#!/usr/bin/env node
// Render the v0 launch batch: 1 hero + 8 PDP primary shots.
// Contract: docs/brand/imagery/prompts/image-gen-brief.md (v0).
// Output: docs/brand/imagery/renders/raw/<date>-<surface>-<sku>.png
//         docs/brand/imagery/renders/web/<sku>-<surface>.jpg (compressed for review)
//         docs/brand/imagery/renders/log.md (append entry)
//
// Env: GOOGLE_API_KEY (source ../_default/.env.secrets).

import { writeFile, appendFile, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve as resolvePath, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = resolvePath(HERE, "..");
const RENDERS_DIR = resolvePath(REPO_ROOT, "docs/brand/imagery/renders");
const RAW_DIR = resolvePath(RENDERS_DIR, "raw");
const WEB_DIR = resolvePath(RENDERS_DIR, "web");
const LOG_PATH = resolvePath(RENDERS_DIR, "log.md");

// Sharp lives in /tmp/render-tools (workspace-local node_modules avoid polluting
// repo deps). If unavailable, the script still writes raw PNGs and skips JPEGs.
function tryLoadSharp() {
  try {
    const r = createRequire("/tmp/render-tools/package.json");
    return r("sharp");
  } catch {
    return null;
  }
}

const MODEL_MAP = {
  fast: "imagen-4.0-fast-generate-001",
  standard: "imagen-4.0-generate-001",
  ultra: "imagen-4.0-ultra-generate-001",
};

const GLOBAL = `You are rendering a product image for CaliLean, a research-use-only (RUO) peptide brand. Aesthetic: Aesop apothecary meets a research bench in coastal California. Restrained, premium-clinical, document-forward. Never lifestyle, never wellness influencer, never bodybuilder. Never a stock medical lab look (no white coats, no blue gloves, no green-liquid beakers). Color palette is dominated by Salt #F4F2EC (warm off-white) and Iron #1F2326 (near-black, cool undertone). Single accent allowed per frame: Pacific #3A5A6A or Eucalyptus #7C8A78. Light: cool diffuse daylight, 5400K, no direct sun, no flash, no shadow drama, low contrast. Composition: generous negative space, one subject, no decoration. Type-on-image: only what the brand specifies (small wordmark, lot mono). No invented logos, no extra text, no human hands, no people.`;

const NEG = `DO NOT include: hands, people, fingers, faces, white lab coats, blue nitrile gloves, beakers, test tubes, green or red or blue liquid, gradients, gold foil, neon, hexagon icons, DNA helix, leaves, droplets, marble, wood grain, sand, gym mats, motion blur, bokeh, lens flare, HDR look, instagram orange grading, watermark.`;

const SURFACES = {
  "pdp-primary": `SURFACE: PDP primary, square, top-down camera at 90 degrees. GROUND: heavyweight Salt-tone (#F4F2EC) linen-cotton blend, slight texture. COMPOSITION: vial dead-center, no other props, at least 35% Salt-tone negative space outside the vial. LIGHT: cool diffuse north-window daylight, soft top-light, no shadow drama. RENDER: photoreal, sharp focus across the entire vial, ISO 100 look, restrained editorial product photography.`,
  "hero-16x9": `SURFACE: hero campaign, horizontal 16:9, eye-level camera. GROUND: large-format white ceramic tile with a 4mm horizontal grout line beneath the vial. BACKGROUND: blurred horizon line of overcast Pacific sky meeting flat calm ocean, no surf, no sun, no human, no birds, May Gray atmosphere, very low contrast. COMPOSITION: single vial in left third, horizon at vertical center, vast Salt-tone negative space across right two-thirds. LIGHT: very cool diffuse, 5400K, even gray sky, no shadow drama. RENDER: photoreal, editorial, restrained, the frame should read "research bench positioned at the edge of the Pacific" not "vacation photo with a vial in it".`,
};

function vialBlock({ compound, dosage, lot, accent, packaging }) {
  const cap = accent === "pacific" ? "Pacific blue (#3A5A6A) aluminum crimp cap" : "Eucalyptus sage-green (#7C8A78) aluminum crimp cap";
  const base = packaging === "blend"
    ? `SUBJECT: a single 2ml clear glass research vial with a ${cap}, lyophilized pale-beige cake inside, wraparound Salt-tone (#F4F2EC) label printed in Iron (#1F2326) type. Label content reads "calilean" wordmark in small uppercase, then "${compound}" in a low-contrast modern serif at large size, then "${dosage}" in monospace, then "LOT ${lot}" in monospace. The label has hairline rules above and below the compound name.`
    : `SUBJECT: a single 2ml clear glass research vial with a ${cap}, lyophilized pale-beige cake inside, wraparound Salt-tone (#F4F2EC) label printed in Iron (#1F2326) type. Label content reads "calilean" wordmark in small uppercase, then "${compound}" in a low-contrast modern serif at large size, then "${dosage} mg / vial" in monospace, then "LOT ${lot}" in monospace.`;
  return base;
}

const RENDERS = [
  // ── Hero ─────────────────────────────────────────────────────────────────
  {
    label: "hero-16x9-retatrutide",
    surface: "hero-16x9",
    aspect: "16:9",
    model: "ultra",
    sku: "calilean-launch",
    sceneType: "hero",
    sku_meta: { compound: "RETATRUTIDE", dosage: "15", lot: "24-0438", accent: "pacific", packaging: "single" },
    extraScene: `The vial is the single subject in the left third. The Pacific horizon behind it is intentionally featureless — calm gray water meeting calm gray sky, no detail. This is a launch hero for a metabolic-research compound; the visual brief is "serious research catalog, not recovery-peptide store".`,
  },
  // ── Tier 1 PDP primary (Retatrutide + lab-book trio) ─────────────────────
  {
    label: "pdp-primary-retatrutide",
    surface: "pdp-primary",
    aspect: "1:1",
    model: "ultra",
    sku: "retatrutide",
    sku_meta: { compound: "RETATRUTIDE", dosage: "15", lot: "24-0438", accent: "pacific", packaging: "single" },
  },
  {
    label: "pdp-primary-bpc-157",
    surface: "pdp-primary",
    aspect: "1:1",
    model: "standard",
    sku: "bpc-157",
    sku_meta: { compound: "BPC-157", dosage: "5", lot: "24-0312", accent: "pacific", packaging: "single" },
  },
  {
    label: "pdp-primary-cjc-12-no-dac-ipamorelin-blend",
    surface: "pdp-primary",
    aspect: "1:1",
    model: "standard",
    sku: "cjc-12-no-dac-ipamorelin-blend",
    sku_meta: { compound: "CJC-1295 / IPAMORELIN", dosage: "5 / 5", lot: "24-0381", accent: "eucalyptus", packaging: "blend" },
  },
  {
    label: "pdp-primary-nad",
    surface: "pdp-primary",
    aspect: "1:1",
    model: "standard",
    sku: "nad",
    sku_meta: { compound: "NAD+", dosage: "100", lot: "24-0410", accent: "eucalyptus", packaging: "single" },
  },
  // ── Tier 2 PDP primary ──────────────────────────────────────────────────
  {
    label: "pdp-primary-bpc-157-tb-500-blend",
    surface: "pdp-primary",
    aspect: "1:1",
    model: "fast",
    sku: "bpc-157-tb-500-blend",
    sku_meta: { compound: "BPC-157 / TB-500", dosage: "5 / 5", lot: "24-0395", accent: "pacific", packaging: "blend" },
  },
  {
    label: "pdp-primary-tb-500",
    surface: "pdp-primary",
    aspect: "1:1",
    model: "fast",
    sku: "tb-500",
    sku_meta: { compound: "TB-500", dosage: "5", lot: "24-0327", accent: "pacific", packaging: "single" },
  },
  {
    label: "pdp-primary-mots-c",
    surface: "pdp-primary",
    aspect: "1:1",
    model: "fast",
    sku: "mots-c",
    sku_meta: { compound: "MOTS-C", dosage: "10", lot: "24-0356", accent: "eucalyptus", packaging: "single" },
  },
  {
    label: "pdp-primary-glutathione",
    surface: "pdp-primary",
    aspect: "1:1",
    model: "fast",
    sku: "glutathione",
    sku_meta: { compound: "GLUTATHIONE", dosage: "200", lot: "24-0433", accent: "pacific", packaging: "single" },
  },
];

function buildPrompt(item) {
  const surface = SURFACES[item.surface];
  const subject = vialBlock(item.sku_meta);
  const extra = item.extraScene ? `\n\nSCENE: ${item.extraScene}` : "";
  return `${GLOBAL}\n\n${surface}\n\n${subject}${extra}\n\n${NEG}`;
}

async function renderOne(item, sharp) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY missing");
  const modelId = MODEL_MAP[item.model];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predict`;
  const prompt = buildPrompt(item);

  const promptPath = resolvePath(RAW_DIR, `${item.label}.prompt.txt`);
  await mkdir(RAW_DIR, { recursive: true });
  await writeFile(promptPath, prompt);

  const t0 = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: item.aspect,
        personGeneration: "dont_allow",
      },
    }),
  });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  if (!res.ok) {
    const text = await res.text();
    return { item, ok: false, error: `HTTP ${res.status}: ${text.slice(0, 400)}`, elapsed };
  }
  const json = await res.json();
  const pred = json.predictions?.[0];
  if (!pred?.bytesBase64Encoded) {
    return {
      item,
      ok: false,
      error: `no image: ${JSON.stringify(json).slice(0, 400)}`,
      elapsed,
    };
  }
  const png = Buffer.from(pred.bytesBase64Encoded, "base64");
  const pngPath = resolvePath(RAW_DIR, `${item.label}.png`);
  await writeFile(pngPath, png);

  let webPath = null;
  let webBytes = null;
  if (sharp) {
    await mkdir(WEB_DIR, { recursive: true });
    webPath = resolvePath(WEB_DIR, `${item.label}.jpg`);
    const longEdge = item.aspect === "16:9" ? 1600 : 1200;
    const jpg = await sharp(png)
      .resize(longEdge, null, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    await writeFile(webPath, jpg);
    webBytes = jpg.length;
  }

  return {
    item,
    ok: true,
    pngPath,
    pngBytes: png.length,
    webPath,
    webBytes,
    mime: pred.mimeType,
    elapsed,
  };
}

function logRow(r) {
  const meta = r.item.sku_meta;
  return `| ${r.item.label} | ${r.item.model} | ${r.item.aspect} | ${meta.accent} | ${meta.compound} | ${meta.dosage} | ${meta.lot} | ${r.elapsed}s | ${r.pngBytes ?? "-"}B png / ${r.webBytes ?? "-"}B jpg |`;
}

async function appendLog(results, startedAtIso) {
  const header = `\n## Run ${startedAtIso}\n\nProvider: Google Imagen 4 (\`generativelanguage.googleapis.com\`).\nGate review: Designer (this run); CMO + CEO sign-off pending.\n\n| Label | Model | Aspect | Accent | Compound | Dosage | Lot | Elapsed | Bytes |\n|---|---|---|---|---|---|---|---|---|\n`;
  const rows = results
    .filter((r) => r.ok)
    .map(logRow)
    .join("\n");
  const errors = results.filter((r) => !r.ok);
  const errBlock = errors.length
    ? `\n\n**Errors (${errors.length}):**\n` +
      errors.map((e) => `- \`${e.item.label}\`: ${e.error}`).join("\n")
    : "";
  const exists = existsSync(LOG_PATH);
  if (!exists) {
    const intro = `# CaliLean — render log\n\nAppend-only log of every image-gen run. Source of truth for which prompts produced which renders.\n\nContract: [\`docs/brand/imagery/prompts/image-gen-brief.md\`](../prompts/image-gen-brief.md) §5.\n`;
    await mkdir(RENDERS_DIR, { recursive: true });
    await writeFile(LOG_PATH, intro);
  }
  await appendFile(LOG_PATH, header + rows + errBlock + "\n");
}

async function main() {
  if (!process.env.GOOGLE_API_KEY) {
    console.error("error: GOOGLE_API_KEY missing — `source ../_default/.env.secrets`");
    process.exit(2);
  }
  const sharp = tryLoadSharp();
  if (!sharp) {
    console.error(
      "warn: sharp unavailable; raw PNGs will be written but JPEG web copies will be skipped.",
    );
  }

  const startedAt = new Date().toISOString();
  const results = [];
  for (const item of RENDERS) {
    process.stderr.write(`\n[${item.label}] (${item.model}) ... `);
    try {
      const r = await renderOne(item, sharp);
      results.push(r);
      process.stderr.write(r.ok ? `ok ${r.elapsed}s\n` : `FAIL ${r.elapsed}s :: ${r.error}\n`);
    } catch (err) {
      results.push({ item, ok: false, error: err?.message || String(err), elapsed: "?" });
      process.stderr.write(`FAIL :: ${err?.message || err}\n`);
    }
  }

  await appendLog(results, startedAt);
  const ok = results.filter((r) => r.ok).length;
  const fail = results.length - ok;
  process.stderr.write(`\nDone: ${ok} ok, ${fail} fail. Log: ${LOG_PATH}\n`);
  console.log(JSON.stringify({ ok, fail, items: results.map((r) => ({ label: r.item.label, ok: r.ok, error: r.error || null })) }, null, 2));
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(`fatal: ${err?.message || err}`);
  process.exit(1);
});
