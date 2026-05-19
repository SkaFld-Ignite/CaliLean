#!/usr/bin/env node
// Surgical Medusa v2 Admin-API update of `thumbnail` + `images[]` for the
// 8 CaliLean launch SKUs after a storefront imagery refresh.
//
// For each SKU this script now:
//   1. Reads storefront/public/brand/products/<folder>/pdp-primary.jpg.
//   2. Uploads the bytes to MinIO via POST /admin/uploads (Medusa's file
//      provider — service at backend/src/modules/minio-file/service.ts).
//   3. PATCHes the product with { thumbnail, images: [{ url }] } using the
//      MinIO URL returned by the upload.
//
// Without step 2 the Medusa admin gallery had no actual asset and the CEO
// had to upload-and-relink each SKU by hand. See SKA-53.
//
// Contract: SKA-42 (initial swap), SKA-53 (this fix). Parent SKA-20.
// Auth: POST /auth/user/emailpass → bearer token → /admin/uploads + /admin/products/{id}.
//
// Usage:
//   scripts/migrate-product-images.mjs --dry-run
//   scripts/migrate-product-images.mjs \
//     --backend-url https://admin.calilean.com
//   scripts/migrate-product-images.mjs --only bpc-157 --force
//
// Env (read from process env or backend/.env):
//   MEDUSA_BACKEND_URL        default http://localhost:9000
//   MEDUSA_ADMIN_EMAIL        required (unless --dry-run)
//   MEDUSA_ADMIN_PASSWORD     required (unless --dry-run)
//
// Flags:
//   --dry-run        Resolve files + report plan; do NOT auth or write.
//   --backend-url    Override MEDUSA_BACKEND_URL.
//   --only <handle>  Restrict to a single product handle (debug).
//   --force          Re-upload + re-link even if product already points at a
//                    MinIO URL for pdp-primary. Default: skip those SKUs.

import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve as resolvePath } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = resolvePath(HERE, "..");

const BACKEND_ENV = resolvePath(REPO_ROOT, "apps", "backend", ".env");
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

// 8 launch SKUs. Handle is the Medusa product handle (verified 2026-04-27
// against admin.calilean.com); folder is the matching
// storefront/public/brand/products/<folder>/pdp-primary.jpg path. The cjc
// blend uses the truncated `cjc-12-...` slug for both handle and folder —
// there is a separate `cjc-1295-no-dac` standalone product this script must
// not touch.
const LAUNCH_SKUS = [
  { handle: "bpc-157", folder: "bpc-157" },
  { handle: "wolverine", folder: "wolverine" },
  { handle: "cjc-12-no-dac-ipamorelin-blend", folder: "cjc-12-no-dac-ipamorelin-blend" },
  { handle: "glutathione", folder: "glutathione" },
  { handle: "mots-c", folder: "mots-c" },
  { handle: "nad", folder: "nad" },
  { handle: "cl-3r", folder: "cl-3r" },
  { handle: "tb-500", folder: "tb-500" },
];

const PRIMARY_FILENAME = "pdp-primary.jpg";
const PRIMARY_MIME = "image/jpeg";
// MinIO file provider derives the upload key as `${name}-${ulid()}${ext}`
// (see backend/src/modules/minio-file/service.ts upload()), so any URL whose
// path segment begins with "pdp-primary-" is a previously-uploaded primary
// asset for this script's purposes.
const MINIO_KEY_PREFIX = "pdp-primary-";

function fail(msg) {
  console.error(`error: ${msg}`);
  process.exit(2);
}

async function authToken(backendUrl, email, password) {
  const res = await fetch(`${backendUrl}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    fail(`auth failed: ${res.status} ${res.statusText} — ${await res.text()}`);
  }
  const data = await res.json();
  if (!data.token) fail(`auth response missing token: ${JSON.stringify(data)}`);
  return data.token;
}

async function findProductByHandle(backendUrl, token, handle) {
  const url = new URL(`${backendUrl}/admin/products`);
  url.searchParams.set("handle", handle);
  url.searchParams.set("limit", "1");
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    fail(`list failed for handle "${handle}": ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.products?.[0] ?? null;
}

async function uploadPrimary(backendUrl, token, absPath) {
  const buf = readFileSync(absPath);
  const blob = new Blob([buf], { type: PRIMARY_MIME });
  const form = new FormData();
  form.append("files", blob, PRIMARY_FILENAME);
  const res = await fetch(`${backendUrl}/admin/uploads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });
  if (!res.ok) {
    fail(`upload failed for ${absPath}: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const file = data.files?.[0];
  if (!file?.url) {
    fail(`upload response missing files[0].url: ${JSON.stringify(data)}`);
  }
  return { url: file.url, key: file.key, bytes: buf.length };
}

async function updateProductImages(backendUrl, token, productId, payload) {
  const res = await fetch(`${backendUrl}/admin/products/${productId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    fail(`update failed for ${productId}: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function alreadyOnMinio(product) {
  // Heuristic: thumbnail + at least one image both point at a MinIO-uploaded
  // primary asset (key prefix `pdp-primary-`). Skip in that case unless --force.
  const thumb = product?.thumbnail;
  const firstImage = product?.images?.[0]?.url;
  if (!thumb || !firstImage) return false;
  const isMinioPrimary = (u) => {
    try {
      const segs = new URL(u).pathname.split("/");
      const last = segs[segs.length - 1] || "";
      return last.startsWith(MINIO_KEY_PREFIX);
    } catch {
      return false;
    }
  };
  return isMinioPrimary(thumb) && isMinioPrimary(firstImage);
}

async function main() {
  const { values } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      "backend-url": { type: "string" },
      only: { type: "string" },
      force: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
    strict: true,
    allowPositionals: false,
  });

  if (values.help) {
    console.log(
      "Usage: scripts/migrate-product-images.mjs [--dry-run] [--backend-url URL] [--only HANDLE] [--force]",
    );
    process.exit(0);
  }

  const backendUrl = (values["backend-url"] || process.env.MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");

  const targets = values.only
    ? LAUNCH_SKUS.filter((s) => s.handle === values.only)
    : LAUNCH_SKUS;
  if (targets.length === 0) fail(`--only "${values.only}" did not match any launch SKU`);

  const plan = targets.map((sku) => {
    const absPath = resolvePath(
      REPO_ROOT,
      "apps",
      "storefront",
      "public",
      "brand",
      "products",
      sku.folder,
      PRIMARY_FILENAME,
    );
    return {
      handle: sku.handle,
      folder: sku.folder,
      absPath,
      exists: existsSync(absPath),
      bytes: existsSync(absPath) ? statSync(absPath).size : 0,
    };
  });

  console.log(`Backend: ${backendUrl}`);
  console.log(`Targets: ${plan.length}`);
  for (const p of plan) {
    const flag = p.exists ? `${p.bytes} B` : "MISSING";
    console.log(`  ${p.handle.padEnd(40)} ← ${p.absPath}  [${flag}]`);
  }
  const missing = plan.filter((p) => !p.exists);
  if (missing.length) {
    fail(`missing local files for: ${missing.map((p) => p.handle).join(", ")}`);
  }

  if (values["dry-run"]) {
    console.log("\n[dry-run] Skipping auth + uploads + writes.");
    return;
  }

  const email = process.env.MEDUSA_ADMIN_EMAIL;
  const password = process.env.MEDUSA_ADMIN_PASSWORD;
  if (!email) fail("missing env: MEDUSA_ADMIN_EMAIL");
  if (!password) fail("missing env: MEDUSA_ADMIN_PASSWORD");

  const token = await authToken(backendUrl, email, password);
  console.log("\nAuthenticated. Uploading + patching products…");

  const results = [];
  for (const p of plan) {
    const product = await findProductByHandle(backendUrl, token, p.handle);
    if (!product) {
      console.warn(`  skip ${p.handle}: no product with that handle in this Medusa instance`);
      results.push({ handle: p.handle, status: "missing" });
      continue;
    }
    if (!values.force && alreadyOnMinio(product)) {
      console.log(`  • ${p.handle.padEnd(40)} already on MinIO (use --force to replace)`);
      results.push({ handle: p.handle, status: "skipped", productId: product.id });
      continue;
    }

    const upload = await uploadPrimary(backendUrl, token, p.absPath);
    await updateProductImages(backendUrl, token, product.id, {
      thumbnail: upload.url,
      images: [{ url: upload.url }],
    });
    console.log(`  ✓ ${p.handle.padEnd(40)} (${product.id}) → ${upload.url}`);
    results.push({
      handle: p.handle,
      status: "updated",
      productId: product.id,
      url: upload.url,
      key: upload.key,
    });
  }

  const updated = results.filter((r) => r.status === "updated").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const miss = results.filter((r) => r.status === "missing").length;
  console.log(`\nDone. updated=${updated} skipped=${skipped} missing=${miss} total=${results.length}`);
}

main().catch((err) => {
  console.error(`error: ${err?.message || err}`);
  process.exit(1);
});
