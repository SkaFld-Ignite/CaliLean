#!/usr/bin/env node
// Re-render the 5 PDP primary shots that failed or were marginal in the first
// pass. Uses a natural-language prompt (no all-caps structural headers) to
// stop Imagen 4 from rendering the prompt schema as visible text on the canvas.
// Contract: docs/brand/imagery/prompts/image-gen-brief.md (interpretation v0.1).
// Output: docs/brand/imagery/renders/raw/<label>.png + web/<label>.jpg + log entry.

import { writeFile, appendFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = resolvePath(HERE, "..");
const RENDERS_DIR = resolvePath(REPO_ROOT, "docs/brand/imagery/renders");
const RAW_DIR = resolvePath(RENDERS_DIR, "raw");
const WEB_DIR = resolvePath(RENDERS_DIR, "web");
const LOG_PATH = resolvePath(RENDERS_DIR, "log.md");

function tryLoadSharp() {
  try {
    const r = createRequire("/tmp/render-tools/package.json");
    return r("sharp");
  } catch {
    return null;
  }
}

const MODEL_ID = "imagen-4.0-generate-001";

function buildPrompt({ compound, dosage, lot, accentColor, accentName }) {
  const dosageLine = dosage.includes("/")
    ? `the dosage line printed in monospace reads "${dosage}"`
    : `the dosage line printed in monospace reads "${dosage} mg / vial"`;
  return [
    `An overhead photograph of a single small clear glass research vial (about two milliliters), photographed straight down from directly above, resting on a heavyweight off-white linen-cotton textile in a warm Salt off-white tone hex F4F2EC.`,
    `The vial has an aluminum crimp seal cap colored ${accentColor} (${accentName}), with a slight matte finish, no logo on the cap.`,
    `Inside the vial is a pale beige lyophilized cake, dry, slightly translucent at the edges.`,
    `A clean wraparound paper label in the same Salt off-white wraps the lower two-thirds of the vial. The label is printed in dark Iron near-black ink. The wordmark "calilean" is set small in lower-case at the very top of the label, with a thin hairline rule beneath it. Below that, the compound name is set in a low-contrast modern serif at large size and reads exactly: ${compound}. Below the compound name, a thin hairline rule, then ${dosageLine}. Below the dosage line, set in monospace, the lot designation reads exactly: LOT ${lot}.`,
    `Composition: the vial is centered in the square frame with at least 35% empty Salt-toned linen visible around it. No other props, no decoration, no other objects in the frame.`,
    `Lighting: cool diffuse daylight from a north-facing window, color temperature about 5400 Kelvin, very soft and even, no harsh shadows, no directional spotlight, no glare on the glass, no flash, low contrast.`,
    `Style: restrained editorial product photography in the style of an Aesop apothecary catalog crossed with a research bench, premium clinical, document-forward, sharp focus across the entire vial, the label perfectly legible, no motion blur, no bokeh on the subject, no lens flare, no HDR look.`,
    `Strictly do not include: any other text or codes anywhere in the frame beyond the label content described, no people, no hands, no fingers, no faces, no white lab coats, no blue gloves, no beakers, no test tubes, no syringes, no needles, no green or red or blue liquid, no gradient backdrops, no marble, no wood grain, no sand, no gym equipment, no watermark, no instagram orange grading, no neon, no decorative borders, no mockup labels or annotations, no source code, no UI panels, no schema text.`,
  ].join(" ");
}

const TARGETS = [
  { label: "pdp-primary-bpc-157", sku: "bpc-157", aspect: "1:1", meta: { compound: "BPC-157", dosage: "5", lot: "24-0312", accentColor: "muted Pacific blue hex 3A5A6A", accentName: "deep teal-blue" } },
  { label: "pdp-primary-cjc-12-no-dac-ipamorelin-blend", sku: "cjc-12-no-dac-ipamorelin-blend", aspect: "1:1", meta: { compound: "CJC-1295 / IPAMORELIN", dosage: "5 / 5 mg / vial", lot: "24-0381", accentColor: "muted Eucalyptus sage hex 7C8A78", accentName: "soft sage green" } },
  { label: "pdp-primary-bpc-157-tb-500-blend", sku: "bpc-157-tb-500-blend", aspect: "1:1", meta: { compound: "BPC-157 / TB-500", dosage: "5 / 5 mg / vial", lot: "24-0395", accentColor: "muted Pacific blue hex 3A5A6A", accentName: "deep teal-blue" } },
  { label: "pdp-primary-mots-c", sku: "mots-c", aspect: "1:1", meta: { compound: "MOTS-C", dosage: "10", lot: "24-0356", accentColor: "muted Eucalyptus sage hex 7C8A78", accentName: "soft sage green" } },
  { label: "pdp-primary-glutathione", sku: "glutathione", aspect: "1:1", meta: { compound: "GLUTATHIONE", dosage: "200", lot: "24-0433", accentColor: "muted Pacific blue hex 3A5A6A", accentName: "deep teal-blue" } },
];

async function renderOne(item, sharp) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY missing");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:predict`;
  const prompt = buildPrompt(item.meta);
  await mkdir(RAW_DIR, { recursive: true });
  await writeFile(resolvePath(RAW_DIR, `${item.label}.prompt.txt`), prompt);
  const t0 = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1, aspectRatio: item.aspect, personGeneration: "dont_allow" },
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
    return { item, ok: false, error: `no image: ${JSON.stringify(json).slice(0, 400)}`, elapsed };
  }
  const png = Buffer.from(pred.bytesBase64Encoded, "base64");
  const pngPath = resolvePath(RAW_DIR, `${item.label}.png`);
  await writeFile(pngPath, png);
  let webBytes = null;
  if (sharp) {
    await mkdir(WEB_DIR, { recursive: true });
    const webPath = resolvePath(WEB_DIR, `${item.label}.jpg`);
    const longEdge = item.aspect === "16:9" ? 1600 : 1200;
    const jpg = await sharp(png)
      .resize(longEdge, null, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    await writeFile(webPath, jpg);
    webBytes = jpg.length;
  }
  return { item, ok: true, pngBytes: png.length, webBytes, elapsed };
}

async function appendLog(results, startedAt) {
  const header = `\n## Run ${startedAt} — re-render (natural-language prompt)\n\nReason: first pass at \`standard\` produced two complete failures (BPC-157, CJC-Ipamorelin) where Imagen rendered the prompt schema (\`SURFACE:\`, \`<RenderSettings>\`) as visible canvas text, plus three marginals (BPC/TB blend, MOTS-c, Glutathione) with gibberish label sublines and heavy shadow drama. This pass uses a single natural-language paragraph (no structural caps) and forces \`standard\` for the four formerly-fast SKUs.\n\n| Label | Model | Aspect | Compound | Lot | Elapsed | Bytes |\n|---|---|---|---|---|---|---|\n`;
  const rows = results
    .filter((r) => r.ok)
    .map((r) => `| ${r.item.label} | standard | ${r.item.aspect} | ${r.item.meta.compound} | ${r.item.meta.lot} | ${r.elapsed}s | ${r.pngBytes ?? "-"}B png / ${r.webBytes ?? "-"}B jpg |`)
    .join("\n");
  const errors = results.filter((r) => !r.ok);
  const errBlock = errors.length
    ? `\n\n**Errors (${errors.length}):**\n` + errors.map((e) => `- \`${e.item.label}\`: ${e.error}`).join("\n")
    : "";
  if (!existsSync(LOG_PATH)) {
    await mkdir(RENDERS_DIR, { recursive: true });
    await writeFile(LOG_PATH, "# CaliLean — render log\n");
  }
  await appendFile(LOG_PATH, header + rows + errBlock + "\n");
}

async function main() {
  if (!process.env.GOOGLE_API_KEY) {
    console.error("error: GOOGLE_API_KEY missing");
    process.exit(2);
  }
  const sharp = tryLoadSharp();
  const startedAt = new Date().toISOString();
  const results = [];
  for (const item of TARGETS) {
    process.stderr.write(`[${item.label}] ... `);
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
  console.log(JSON.stringify({ ok, fail: results.length - ok, items: results.map((r) => ({ label: r.item.label, ok: r.ok, error: r.error || null })) }, null, 2));
  if (results.length - ok > 0) process.exit(1);
}

main().catch((err) => {
  console.error(`fatal: ${err?.message || err}`);
  process.exit(1);
});
