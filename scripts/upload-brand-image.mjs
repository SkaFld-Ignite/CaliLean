#!/usr/bin/env node
// Upload a brand image to the CaliLean MinIO bucket at a deterministic path.
// Contract: docs/brand/imagery/hosting.md

import { readFile, stat } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { extname, basename, resolve as resolvePath } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = resolvePath(HERE, "..");

// `minio` is installed in backend/node_modules (the only workspace where it's
// already a dependency). Resolve it from there so the script can run from the
// repo root without a duplicate install. Loaded lazily so --dry-run works
// even when backend deps haven't been installed yet.
function loadMinioClient() {
  const backendRequire = createRequire(resolvePath(REPO_ROOT, "backend/package.json"));
  try {
    return backendRequire("minio").Client;
  } catch (err) {
    console.error(
      "error: could not load 'minio' from backend/node_modules. " +
        "Run `pnpm install` in backend/ first.",
    );
    console.error(err?.message || err);
    process.exit(1);
  }
}

// Load backend/.env if present so this script "just works" from a repo checkout
// without the operator having to copy MINIO_* into their shell.
const BACKEND_ENV = resolvePath(REPO_ROOT, "backend", ".env");
if (existsSync(BACKEND_ENV)) {
  for (const line of readFileSync(BACKEND_ENV, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    if (m[1].startsWith("#")) continue;
    if (process.env[m[1]] !== undefined) continue;
    let val = m[2];
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    process.env[m[1]] = val;
  }
}

const PRODUCT_SURFACES = new Set([
  "pdp-primary",
  "pdp-context",
  "thumb-1x1",
]);
const PRODUCT_GALLERY = /^pdp-gallery-\d{2}$/;
const HERO_SURFACES = new Set(["hero-16x9", "hero-4x5", "og-card"]);
const SECTIONS = new Set(["editorial", "lifestyle"]);
const ALLOWED_EXT = new Set([".avif", ".jpg", ".jpeg", ".webp", ".png"]);
const PUBLISHED_EXT = new Set([".avif", ".jpg", ".jpeg", ".webp"]);

const CONTENT_TYPE = {
  ".avif": "image/avif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".png": "image/png",
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function usage() {
  return `Usage:
  upload-brand-image.mjs --sku <slug> --surface <surface> --file <path>
  upload-brand-image.mjs --campaign <slug> --surface <hero-surface> --file <path>
  upload-brand-image.mjs --section editorial|lifestyle --slug <slug> --file <path>
  upload-brand-image.mjs --sku <slug> --staging --file <path> [--name <override>]

Surfaces:
  product:  pdp-primary | pdp-gallery-NN | pdp-context | thumb-1x1
  hero:     hero-16x9 | hero-4x5 | og-card

Env (read from process env or backend/.env):
  MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY
  MINIO_BRAND_BUCKET (optional, defaults to "calilean-media")

Flags:
  --dry-run        Print the resolved bucket key and exit; do not upload.
  --content-type   Override the content type (rare; only useful for non-image fixtures).
`;
}

function fail(msg) {
  console.error(`error: ${msg}\n`);
  console.error(usage());
  process.exit(2);
}

function parseEndpoint(raw) {
  let endPoint = raw;
  let useSSL = true;
  let port = 443;
  if (endPoint.startsWith("https://")) {
    endPoint = endPoint.slice("https://".length);
  } else if (endPoint.startsWith("http://")) {
    endPoint = endPoint.slice("http://".length);
    useSSL = false;
    port = 80;
  }
  endPoint = endPoint.replace(/\/$/, "");
  const portMatch = endPoint.match(/:(\d+)$/);
  if (portMatch) {
    port = parseInt(portMatch[1], 10);
    endPoint = endPoint.replace(/:(\d+)$/, "");
  }
  return { endPoint, useSSL, port };
}

function validateProductSurface(surface) {
  if (PRODUCT_SURFACES.has(surface)) return;
  if (PRODUCT_GALLERY.test(surface)) return;
  fail(
    `--surface "${surface}" is not a valid product surface. ` +
      `Allowed: pdp-primary, pdp-gallery-NN (e.g. pdp-gallery-01), pdp-context, thumb-1x1.`,
  );
}

function validateHeroSurface(surface) {
  if (!HERO_SURFACES.has(surface)) {
    fail(
      `--surface "${surface}" is not a valid hero surface. ` +
        `Allowed: hero-16x9, hero-4x5, og-card.`,
    );
  }
}

function resolveKey(args) {
  const { sku, campaign, section, slug, surface, staging, name } = args;
  const filePath = args.file;
  const ext = extname(filePath).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    fail(`unsupported file extension "${ext}". Allowed: ${[...ALLOWED_EXT].join(", ")}`);
  }

  if (staging) {
    if (!sku) fail("--staging requires --sku");
    if (!SLUG_RE.test(sku)) fail(`--sku "${sku}" is not a valid kebab slug`);
    const filename = name ?? basename(filePath);
    return { key: `staging/${sku}/${filename}`, ext, published: false };
  }

  if (sku) {
    if (campaign || section) fail("--sku is mutually exclusive with --campaign / --section");
    if (!surface) fail("--sku requires --surface");
    if (!SLUG_RE.test(sku)) fail(`--sku "${sku}" is not a valid kebab slug`);
    validateProductSurface(surface);
    if (!PUBLISHED_EXT.has(ext)) {
      fail(`canonical product paths require ${[...PUBLISHED_EXT].join(", ")} (got ${ext}). Use --staging while iterating.`);
    }
    return { key: `products/${sku}/${surface}${ext}`, ext, published: true };
  }

  if (campaign) {
    if (section) fail("--campaign is mutually exclusive with --section");
    if (!surface) fail("--campaign requires --surface");
    if (!SLUG_RE.test(campaign)) fail(`--campaign "${campaign}" is not a valid kebab slug`);
    validateHeroSurface(surface);
    if (!PUBLISHED_EXT.has(ext)) {
      fail(`canonical hero paths require ${[...PUBLISHED_EXT].join(", ")} (got ${ext})`);
    }
    return { key: `hero/${campaign}/${surface}${ext}`, ext, published: true };
  }

  if (section) {
    if (!SECTIONS.has(section)) fail(`--section must be one of: ${[...SECTIONS].join(", ")}`);
    if (!slug) fail("--section requires --slug");
    if (!SLUG_RE.test(slug)) fail(`--slug "${slug}" is not a valid kebab slug`);
    if (!PUBLISHED_EXT.has(ext)) {
      fail(`canonical ${section} paths require ${[...PUBLISHED_EXT].join(", ")} (got ${ext})`);
    }
    return { key: `${section}/${slug}${ext}`, ext, published: true };
  }

  fail("must specify one of: --sku, --campaign, --section");
}

async function ensureBucket(client, bucket) {
  if (await client.bucketExists(bucket)) return;
  await client.makeBucket(bucket);
  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "PublicRead",
        Effect: "Allow",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  };
  await client.setBucketPolicy(bucket, JSON.stringify(policy));
}

async function main() {
  const { values } = parseArgs({
    options: {
      sku: { type: "string" },
      campaign: { type: "string" },
      section: { type: "string" },
      slug: { type: "string" },
      surface: { type: "string" },
      file: { type: "string" },
      staging: { type: "boolean", default: false },
      name: { type: "string" },
      "dry-run": { type: "boolean", default: false },
      "content-type": { type: "string" },
      help: { type: "boolean", short: "h", default: false },
    },
    strict: true,
    allowPositionals: false,
  });

  if (values.help) {
    console.log(usage());
    process.exit(0);
  }
  if (!values.file) fail("--file is required");

  const filePath = resolvePath(process.cwd(), values.file);
  let st;
  try {
    st = await stat(filePath);
  } catch {
    fail(`file not found: ${filePath}`);
  }
  if (!st.isFile()) fail(`not a file: ${filePath}`);

  const { key, ext, published } = resolveKey({ ...values, file: filePath });

  if (values["dry-run"]) {
    console.log(JSON.stringify({ key, published }, null, 2));
    return;
  }

  const required = ["MINIO_ENDPOINT", "MINIO_ACCESS_KEY", "MINIO_SECRET_KEY"];
  for (const k of required) {
    if (!process.env[k]) fail(`missing env: ${k}`);
  }

  const bucket = process.env.MINIO_BRAND_BUCKET || "calilean-media";
  const { endPoint, useSSL, port } = parseEndpoint(process.env.MINIO_ENDPOINT);

  const Client = loadMinioClient();
  const client = new Client({
    endPoint,
    port,
    useSSL,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
  });

  await ensureBucket(client, bucket);

  const buf = await readFile(filePath);
  const contentType = values["content-type"] || CONTENT_TYPE[ext] || "application/octet-stream";

  const metadata = {
    "Content-Type": contentType,
    "x-amz-acl": "public-read",
    "x-amz-meta-original-filename": basename(filePath),
  };
  if (published) {
    metadata["Cache-Control"] = "public, max-age=31536000, immutable";
  } else {
    metadata["Cache-Control"] = "public, max-age=300";
  }

  await client.putObject(bucket, key, buf, buf.length, metadata);

  const protocol = useSSL ? "https" : "http";
  const portSuffix =
    (useSSL && port === 443) || (!useSSL && port === 80) ? "" : `:${port}`;
  const url = `${protocol}://${endPoint}${portSuffix}/${bucket}/${key}`;

  console.log(JSON.stringify({ bucket, key, url, bytes: buf.length, published }, null, 2));
}

main().catch((err) => {
  console.error(`error: ${err?.message || err}`);
  process.exit(1);
});
