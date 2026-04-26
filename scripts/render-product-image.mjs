#!/usr/bin/env node
// Render a CaliLean product image via Google Imagen 4.
// Contract: docs/brand/imagery/prompts/image-gen-brief.md
//
// Usage:
//   render-product-image.mjs \
//     --prompt-file path/to/prompt.txt \
//     --aspect 1:1 \
//     --model fast|standard|ultra \
//     --out renders/2026-04-26-pdp-primary-bpc-157.png \
//     [--seed 42]
//
// Env: GOOGLE_API_KEY (source from _default/.env.secrets).

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve as resolvePath } from "node:path";
import { parseArgs } from "node:util";

const MODEL_MAP = {
  fast: "imagen-4.0-fast-generate-001",
  standard: "imagen-4.0-generate-001",
  ultra: "imagen-4.0-ultra-generate-001",
};

const ASPECTS = new Set(["1:1", "9:16", "16:9", "3:4", "4:3"]);

function fail(msg) {
  console.error(`error: ${msg}`);
  process.exit(2);
}

async function main() {
  const { values } = parseArgs({
    options: {
      "prompt-file": { type: "string" },
      prompt: { type: "string" },
      aspect: { type: "string", default: "1:1" },
      model: { type: "string", default: "standard" },
      out: { type: "string" },
      seed: { type: "string" },
      help: { type: "boolean", short: "h", default: false },
    },
    strict: true,
  });

  if (values.help) {
    console.log("see header comment");
    return;
  }
  if (!values.out) fail("--out is required");
  if (!values.prompt && !values["prompt-file"]) fail("--prompt or --prompt-file is required");
  if (!ASPECTS.has(values.aspect)) fail(`--aspect must be one of: ${[...ASPECTS].join(", ")}`);
  if (!MODEL_MAP[values.model]) fail(`--model must be one of: fast, standard, ultra`);
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) fail("GOOGLE_API_KEY env required (source _default/.env.secrets)");

  const prompt = values.prompt
    ? values.prompt
    : (await readFile(resolvePath(process.cwd(), values["prompt-file"]), "utf8")).trim();

  const modelId = MODEL_MAP[values.model];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predict`;

  const params = {
    sampleCount: 1,
    aspectRatio: values.aspect,
    personGeneration: "dont_allow",
  };
  if (values.seed) params.seed = parseInt(values.seed, 10);

  const body = {
    instances: [{ prompt }],
    parameters: params,
  };

  console.error(
    `[render] model=${modelId} aspect=${values.aspect} prompt=${prompt.length}b → ${values.out}`,
  );
  const t0 = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  if (!res.ok) {
    const text = await res.text();
    fail(`HTTP ${res.status} (${elapsed}s): ${text.slice(0, 600)}`);
  }
  const json = await res.json();
  const pred = json.predictions?.[0];
  if (!pred?.bytesBase64Encoded) {
    fail(`no image bytes in response: ${JSON.stringify(json).slice(0, 600)}`);
  }
  const buf = Buffer.from(pred.bytesBase64Encoded, "base64");
  const outAbs = resolvePath(process.cwd(), values.out);
  await mkdir(dirname(outAbs), { recursive: true });
  await writeFile(outAbs, buf);
  console.log(
    JSON.stringify(
      {
        model: modelId,
        aspect: values.aspect,
        out: values.out,
        bytes: buf.length,
        mime: pred.mimeType,
        elapsedSeconds: parseFloat(elapsed),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(`error: ${err?.message || err}`);
  process.exit(1);
});
