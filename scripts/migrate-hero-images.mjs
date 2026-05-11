#!/usr/bin/env node
// Upload the 15 hero renders in docs/brand/packaging/renders/hero-image/<Slug>/
// to MinIO and set them as Medusa product.thumbnail + product.images[0] for each
// matching published product.
//
// Lessons from prior burn (memory #2445 / #2446):
//   - In May we ran scripts/migrate-product-images.mjs against prod. The MinIO
//     upload succeeded but the product PATCH did NOT persist (CL-3R still points
//     at pdp-primary-01KQHSZ0ZHTVT5ZHJTHMRMFPFE.jpg today). To stop that recurring:
//     we re-fetch each product after PATCH and assert thumbnail/images match.
//   - On verification failure this script writes a SQL fallback file you can run
//     against the Railway Postgres via the DATABASE_URL env var.
//
// Usage:
//   scripts/migrate-hero-images.mjs --dry-run
//   scripts/migrate-hero-images.mjs --backend-url https://admin.calilean.com
//   scripts/migrate-hero-images.mjs --only cl-3r
//   scripts/migrate-hero-images.mjs --force          # re-upload even if already pointing at hero-*
//
// Env (read from process env or apps/backend/.env):
//   MEDUSA_BACKEND_URL        default http://localhost:9000
//   MEDUSA_ADMIN_EMAIL        required (unless --dry-run)
//   MEDUSA_ADMIN_PASSWORD     required (unless --dry-run)

import { existsSync, readFileSync, statSync, mkdirSync, writeFileSync } from "node:fs";
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

// Each row: Medusa product handle + repo path + canonical filename written to MinIO.
// `uploadName` is the basename passed to FormData; MinIO appends -ULID-ext so the
// resulting key is `hero-<handle>-<ULID>.jpeg`. The `hero-` prefix lets us cheaply
// detect already-migrated products on re-runs.
const PRODUCTS = [
  { handle: "bpc-157",      file: "BPC_157/BPC-157___10mg.jpeg",        uploadName: "hero-bpc-157.jpeg" },
  { handle: "bac-water",    file: "Bac_Water/Bac-Water___10mL.jpeg",    uploadName: "hero-bac-water.jpeg" },
  { handle: "cl-1s",        file: "CL_1S/CL-1S___10mg.jpeg",            uploadName: "hero-cl-1s.jpeg" },
  { handle: "cl-2t",        file: "CL_2T/CL-2T___10mg.jpeg",            uploadName: "hero-cl-2t.jpeg" },
  { handle: "cl-3r",        file: "CL_3R/CL-3R___10mg.jpeg",            uploadName: "hero-cl-3r.jpeg" },
  { handle: "ghk-cu",       file: "GHK_Cu/GHK-Cu___50mg.jpeg",          uploadName: "hero-ghk-cu.jpeg" },
  { handle: "glow",         file: "GLOW/GLOW___70mg.jpeg",              uploadName: "hero-glow.jpeg" },
  { handle: "ipamorelin",   file: "Ipamorelin/Ipamorelin___10mg.jpeg",  uploadName: "hero-ipamorelin.jpeg" },
  { handle: "klow",         file: "KLOW/KLOW___80mg.jpeg",              uploadName: "hero-klow.jpeg" },
  { handle: "mots-c",       file: "MOTS_c/MOTS-c___10mg.jpeg",          uploadName: "hero-mots-c.jpeg" },
  { handle: "melanotan-2",  file: "Melanotan_2/Melanotan-2___10mg.jpeg",uploadName: "hero-melanotan-2.jpeg" },
  { handle: "ss-31",        file: "SS_31/SS-31___10mg.jpeg",            uploadName: "hero-ss-31.jpeg" },
  { handle: "tb-500",       file: "TB_500/TB-500___10mg.jpeg",          uploadName: "hero-tb-500.jpeg" },
  { handle: "tesamorelin",  file: "Tesamorelin/Tesamorelin___10mg.jpeg",uploadName: "hero-tesamorelin.jpeg" },
  { handle: "wolverine",    file: "Wolverine/Wolverine___10mg.jpeg",    uploadName: "hero-wolverine.jpeg" },
];

const HERO_DIR = resolvePath(REPO_ROOT, "docs", "brand", "packaging", "renders", "hero-image");
const MIME = "image/jpeg";

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
  if (!res.ok) fail(`auth failed: ${res.status} ${res.statusText} — ${await res.text()}`);
  const data = await res.json();
  if (!data.token) fail(`auth response missing token: ${JSON.stringify(data)}`);
  return data.token;
}

async function findProductByHandle(backendUrl, token, handle) {
  const url = new URL(`${backendUrl}/admin/products`);
  url.searchParams.set("handle", handle);
  url.searchParams.set("limit", "1");
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) fail(`list failed for handle "${handle}": ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.products?.[0] ?? null;
}

async function uploadFile(backendUrl, token, absPath, uploadName) {
  const buf = readFileSync(absPath);
  const blob = new Blob([buf], { type: MIME });
  const form = new FormData();
  form.append("files", blob, uploadName);
  const res = await fetch(`${backendUrl}/admin/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) fail(`upload failed for ${absPath}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const file = data.files?.[0];
  if (!file?.url) fail(`upload response missing files[0].url: ${JSON.stringify(data)}`);
  return { url: file.url, key: file.key ?? file.id ?? null, bytes: buf.length };
}

async function patchProduct(backendUrl, token, productId, payload) {
  const res = await fetch(`${backendUrl}/admin/products/${productId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) fail(`patch failed for ${productId}: ${res.status} ${text}`);
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function urlsMatch(actual, expected) {
  if (!actual || !expected) return false;
  return actual === expected;
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
    console.log("Usage: scripts/migrate-hero-images.mjs [--dry-run] [--backend-url URL] [--only HANDLE] [--force]");
    process.exit(0);
  }

  const backendUrl = (values["backend-url"] || process.env.MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");

  const targets = values.only ? PRODUCTS.filter((p) => p.handle === values.only) : PRODUCTS;
  if (targets.length === 0) fail(`--only "${values.only}" did not match any hero product`);

  const plan = targets.map((p) => {
    const absPath = resolvePath(HERO_DIR, p.file);
    return { ...p, absPath, exists: existsSync(absPath), bytes: existsSync(absPath) ? statSync(absPath).size : 0 };
  });

  console.log(`Backend: ${backendUrl}`);
  console.log(`Targets: ${plan.length}`);
  for (const p of plan) console.log(`  ${p.handle.padEnd(15)} ← ${p.file}  [${p.exists ? p.bytes + " B" : "MISSING"}]`);
  const missing = plan.filter((x) => !x.exists);
  if (missing.length) fail(`missing local files for: ${missing.map((x) => x.handle).join(", ")}`);

  if (values["dry-run"]) {
    console.log("\n[dry-run] Skipping auth + uploads + writes.");
    return;
  }

  const email = process.env.MEDUSA_ADMIN_EMAIL;
  const password = process.env.MEDUSA_ADMIN_PASSWORD;
  if (!email) fail("missing env: MEDUSA_ADMIN_EMAIL");
  if (!password) fail("missing env: MEDUSA_ADMIN_PASSWORD");

  const token = await authToken(backendUrl, email, password);
  console.log("\nAuthenticated. Uploading + patching + verifying...\n");

  const updated = [];
  const skipped = [];
  const failed = [];     // verification failures — need DB fallback

  for (const p of plan) {
    const product = await findProductByHandle(backendUrl, token, p.handle);
    if (!product) {
      console.warn(`  ⚠ ${p.handle.padEnd(15)} no product with that handle on this backend`);
      skipped.push({ handle: p.handle, reason: "no-product" });
      continue;
    }

    // Skip if already pointing at a hero-* asset and not --force.
    const currentThumb = product.thumbnail || "";
    if (!values.force && /\/hero-[^/]+\.jpeg$/.test(currentThumb)) {
      console.log(`  • ${p.handle.padEnd(15)} already on hero-* asset (use --force to replace) → ${currentThumb.split("/").pop()}`);
      skipped.push({ handle: p.handle, reason: "already-hero", productId: product.id });
      continue;
    }

    const up = await uploadFile(backendUrl, token, p.absPath, p.uploadName);

    // PATCH thumbnail + images. Pass full image objects for the existing images we
    // want to KEEP plus the new one. Here we replace entirely with the new hero,
    // so images = [{ url: new }].
    await patchProduct(backendUrl, token, product.id, {
      thumbnail: up.url,
      images: [{ url: up.url }],
    });

    // Re-fetch and verify (the May burn was a silent persistence failure).
    await new Promise((r) => setTimeout(r, 750));
    const after = await findProductByHandle(backendUrl, token, p.handle);
    const newThumb = after?.thumbnail;
    const newImages = after?.images || [];
    const thumbOk = urlsMatch(newThumb, up.url);
    const imagesOk = newImages.some((i) => i.url === up.url);

    if (thumbOk && imagesOk) {
      console.log(`  ✓ ${p.handle.padEnd(15)} (${product.id}) → ${up.url}`);
      updated.push({ handle: p.handle, productId: product.id, url: up.url, key: up.key });
    } else {
      console.error(`  ✗ ${p.handle.padEnd(15)} (${product.id}) VERIFY FAILED  thumbOk=${thumbOk} imagesOk=${imagesOk}`);
      console.error(`      expected: ${up.url}`);
      console.error(`      actual:   ${newThumb}`);
      failed.push({ handle: p.handle, productId: product.id, expected: up.url, actualThumbnail: newThumb, actualImages: newImages.map((i) => i.url) });
    }
  }

  console.log(`\nDone. updated=${updated.length} skipped=${skipped.length} failed=${failed.length} total=${plan.length}`);

  if (failed.length) {
    const snapshotsDir = resolvePath(REPO_ROOT, "scripts", "snapshots");
    mkdirSync(snapshotsDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const sqlPath = resolvePath(snapshotsDir, `hero-db-fallback-${ts}.sql`);
    const lines = [
      "-- DB fallback for products where the admin-API PATCH did not persist.",
      "-- Run against Railway Postgres (DATABASE_URL):",
      "--   psql \"$DATABASE_URL\" -f <this-file>",
      "-- Idempotent: updates product.thumbnail + replaces the image link rows.",
      "",
      "BEGIN;",
      "",
    ];
    for (const f of failed) {
      lines.push(`-- ${f.handle}  (${f.productId})`);
      lines.push(`UPDATE product SET thumbnail = '${f.expected}', updated_at = NOW() WHERE id = '${f.productId}';`);
      lines.push(`WITH old_images AS (SELECT image_id FROM product_images WHERE product_id = '${f.productId}'), deleted_links AS (DELETE FROM product_images WHERE product_id = '${f.productId}' RETURNING image_id) DELETE FROM image WHERE id IN (SELECT image_id FROM old_images UNION SELECT image_id FROM deleted_links);`);
      lines.push(`WITH ins AS (INSERT INTO image (id, url, metadata, created_at, updated_at) VALUES ('img_' || substring(md5(random()::text), 1, 26), '${f.expected}', '{}', NOW(), NOW()) RETURNING id)`);
      lines.push(`INSERT INTO product_images (product_id, image_id) SELECT '${f.productId}', id FROM ins;`);
      lines.push("");
    }
    lines.push("COMMIT;");
    writeFileSync(sqlPath, lines.join("\n") + "\n");
    console.error(`\nDB fallback SQL written: ${sqlPath}`);
    console.error("NOTE: image / product_images table names assume Medusa 2.14 default schema.");
    console.error("Inspect first with:  psql \"$DATABASE_URL\" -c '\\dt'  and adjust table names if needed.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`error: ${err?.message || err}`);
  process.exit(1);
});
