import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const FIGMA_TOKEN = process.env.FIGMA_PAT;
const FILE_KEY = "WgQvUpgybIgrMILvoru3Jh";
const OUT_DIR = path.join(process.cwd(), 'docs/brand/packaging/renders/labels');

function slugify(str) {
  return str.replace(/[^a-zA-Z0-9]/g, '_');
}

// "CL-1S — 10mg" → { base: "CL-1S___10mg", dir: "CL_1S" }
function parseFrameName(pageName, frameName) {
  // Split only on em dash or en dash surrounded by spaces, not hyphens
  const parts = frameName.split(/\s+[—–]\s+/);
  const dose = parts[1] ? parts[1].trim() : frameName.trim();
  const base = `${pageName.replace(/\s/g, '-')}___${dose}`;
  const dir = slugify(pageName);
  return { base, dir };
}

async function fetchWithRetry(url, opts = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, opts);
    if (res.ok) return res;
    if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
  }
  return null;
}

async function exportFormat(ids, format, scale) {
  const params = new URLSearchParams({ ids: ids.join(','), format });
  if (scale) params.set('scale', String(scale));
  const res = await fetchWithRetry(
    `https://api.figma.com/v1/images/${FILE_KEY}?${params}`,
    { headers: { "X-Figma-Token": FIGMA_TOKEN } }
  );
  if (!res) throw new Error(`Failed to fetch ${format} image URLs`);
  const data = await res.json();
  return data.images || {};
}

async function downloadFile(url, filePath) {
  const res = await fetchWithRetry(url);
  if (!res) { console.warn(`  ⚠ Failed to download: ${filePath}`); return false; }
  const buf = await res.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(buf));
  return true;
}

async function main() {
  if (!FIGMA_TOKEN) {
    console.error("Missing FIGMA_PAT — load docs/.env first");
    process.exit(1);
  }

  console.log("📐 Fetching Figma file structure...");
  const fileRes = await fetchWithRetry(
    `https://api.figma.com/v1/files/${FILE_KEY}`,
    { headers: { "X-Figma-Token": FIGMA_TOKEN } }
  );
  if (!fileRes) { console.error("Failed to fetch Figma file"); process.exit(1); }
  const { document } = await fileRes.json();

  // Collect all label frames (identified by having Favicon + QR Code children)
  const labels = [];
  for (const page of document.children) {
    const frames = page.children?.filter(c =>
      c.type === 'FRAME' || c.type === 'COMPONENT' || c.type === 'INSTANCE'
    ) || [];
    for (const frame of frames) {
      const hasFavicon = frame.children?.some(c => c.name === 'Favicon');
      const hasQR = frame.children?.some(c => c.name === 'QR Code');
      if (hasFavicon && hasQR) {
        const { base, dir } = parseFrameName(page.name, frame.name);
        labels.push({ pageName: page.name, frameName: frame.name, frameId: frame.id, base, dir });
      }
    }
  }

  console.log(`Found ${labels.length} label frames across ${[...new Set(labels.map(l => l.pageName))].length} pages\n`);

  // Clear and recreate output directories
  const dirs = [...new Set(labels.map(l => l.dir))];
  for (const dir of dirs) {
    const full = path.join(OUT_DIR, dir);
    if (fs.existsSync(full)) fs.rmSync(full, { recursive: true });
    fs.mkdirSync(full, { recursive: true });
  }
  // Also remove any stale dirs not in current label set
  if (fs.existsSync(OUT_DIR)) {
    for (const existing of fs.readdirSync(OUT_DIR)) {
      if (existing.startsWith('.')) continue;
      if (!dirs.includes(existing)) {
        fs.rmSync(path.join(OUT_DIR, existing), { recursive: true });
        console.log(`  🗑 Removed stale dir: ${existing}`);
      }
    }
  }

  const ids = labels.map(l => l.frameId);

  // Fetch SVG and PNG export URLs in parallel
  console.log("🔗 Requesting export URLs from Figma API (SVG + PNG @2x)...");
  const [svgMap, pngMap] = await Promise.all([
    exportFormat(ids, 'svg', null),
    exportFormat(ids, 'png', 2),
  ]);

  // Download all files
  console.log("⬇  Downloading files...\n");
  let saved = 0;
  for (const label of labels) {
    const prodDir = path.join(OUT_DIR, label.dir);
    const svgPath = path.join(prodDir, `${label.base}.svg`);
    const pngPath = path.join(prodDir, `${label.base}@2x.png`);

    process.stdout.write(`  ${label.frameName}  →  `);

    const [svgOk, pngOk] = await Promise.all([
      svgMap[label.frameId] ? downloadFile(svgMap[label.frameId], svgPath) : Promise.resolve(false),
      pngMap[label.frameId] ? downloadFile(pngMap[label.frameId], pngPath) : Promise.resolve(false),
    ]);

    if (svgOk && pngOk) { console.log('SVG + PNG ✓'); saved += 2; }
    else if (svgOk)      { console.log('SVG ✓  PNG ✗'); saved += 1; }
    else if (pngOk)      { console.log('SVG ✗  PNG ✓'); saved += 1; }
    else                 { console.log('✗ both failed'); }
  }

  console.log(`\n✅ Saved ${saved} files to ${OUT_DIR}\n`);

  // Git commit + push
  console.log("🚀 Pushing to GitHub...");
  try {
    execSync('git add docs/brand/packaging/renders/labels', { stdio: 'inherit' });
    execSync(
      'git commit -m "feat(brand): refresh all vial label renders (SVG + PNG @2x)"',
      { stdio: 'inherit' }
    );
    execSync('git push', { stdio: 'inherit' });
    console.log("✅ GitHub push complete\n");
  } catch (e) {
    console.warn("⚠ Git push failed (maybe nothing to commit):", e.message);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
