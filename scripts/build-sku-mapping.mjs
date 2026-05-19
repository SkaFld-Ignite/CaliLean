#!/usr/bin/env node
// Builds the CaliLean v1 SKU mapping:
//   1. Updates storefront/src/data/products-seed.json:
//        - injects `sku_code` per product
//        - normalizes blend size strings (e.g. "5mg / 5mg" -> "5mg/5mg")
//        - fixes the "cjc-12-no-dac-ipamorelin-blend" handle typo -> "cjc-1295-no-dac-ipamorelin-blend"
//   2. Emits docs/sku-mapping-v1.csv and docs/sku-mapping-v1.xlsx with one
//      row per (product, variant) pair, including old + new SKU.
//
// Run from repo root:
//   node scripts/build-sku-mapping.mjs

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();
const seedPath = path.join(repoRoot, 'storefront/src/data/products-seed.json');
const csvPath = path.join(repoRoot, 'docs/sku-mapping-v1.csv');
const xlsxPath = path.join(repoRoot, 'docs/sku-mapping-v1.xlsx');

// Compound code map. Keyed by handle. See docs/sku-system.md.
const SKU_CODE_MAP = {
  'bpc-157': 'BPC',
  'th9507': 'TH9',
  'ipamorelin': 'IPM',
  'tb-500': 'TB5',
  'ghk-cu': 'GHK',
  'pt-141': 'PT1',
  'glutathione': 'GLU',
  'glow': 'GLW',
  'klow': 'KLW',
  'wolverine': 'WLV',
  'nad': 'NAD',
  'snap-8': 'SN8',
  'selank': 'SEL',
  'cagrilintide': 'CAG',
  'thymosin-alpha-1': 'TA1',
  'igf-1-lr3': 'IGF',
  'hexarelin': 'HEX',
  'cjc-1295-no-dac': 'CJC',
  'sermorelin': 'SER',
  'ghrp-2': 'GH2',
  'ghrp-6': 'GH6',
  'cl-3r': 'GL3',
  'retatrutide': 'RET',  // legacy handle, kept for backwards compat
  'melanotan-i': 'MT1',
  'melanotan-ii': 'MT2',
  'mazdutide': 'MAZ',
  'semax': 'SMX',
  'dsip': 'DSP',
  'epithalon': 'EPI',
  'ahk-cu': 'AHK',
  'mots-c': 'MOT',
  'pinealon': 'PIN',
  '5-amino-1mq': '5MQ',
  'cjc-1295-no-dac-ipamorelin-blend': 'CJI',
};

// Handles that need correcting in-place. old -> new.
const HANDLE_RENAMES = {
  'cjc-12-no-dac-ipamorelin-blend': 'cjc-1295-no-dac-ipamorelin-blend',
};

// Pull the per-component dose in mg from a size string. For blends like
// "5mg/5mg" we encode the per-component dose (5 here) — the blend code
// in `sku_code` already disambiguates the compound pair.
function dosePerComponentMg(size) {
  const first = String(size).split(/[\/+]/)[0].trim();
  const m = first.match(/(\d+(?:\.\d+)?)\s*mg/i);
  if (!m) throw new Error(`Cannot parse dose from size "${size}"`);
  return Math.round(parseFloat(m[1]));
}

function pad4(n) {
  return String(n).padStart(4, '0');
}

function buildSku(skuCode, size) {
  return `CL-${skuCode}-${pad4(dosePerComponentMg(size))}`;
}

function legacyBluumSku(handle, size) {
  // Mirror the legacy seeder's behaviour so we can record the old SKU.
  return `BLUUM-${handle.toUpperCase()}-${size.toUpperCase().replace(/ /g, '')}`.replace(/\//g, '-');
}

// Normalize size strings: collapse "5mg / 5mg" -> "5mg/5mg" for blends.
function normalizeSize(size) {
  return size.replace(/\s*\/\s*/g, '/').trim();
}

// Some products in the legacy seed stored multiple sizes as a single
// comma-joined string ("5mg, 10mg") instead of two array entries. Split
// those out so each variant gets its own row + SKU.
// Heuristic: if a value contains a comma AND each comma-separated piece
// independently looks like a "<digits>mg" dose (no slash), split it.
function splitMultiSize(values) {
  const out = [];
  for (const v of values) {
    if (v.includes(',') && !v.includes('/')) {
      const pieces = v.split(',').map(s => s.trim()).filter(Boolean);
      const allDoses = pieces.every(p => /^\d+(?:\.\d+)?\s*mg$/i.test(p));
      if (allDoses) {
        out.push(...pieces);
        continue;
      }
    }
    out.push(v);
  }
  return out;
}

const products = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
const rows = [];
let renamed = 0;
let normalized = 0;
let coded = 0;

for (const p of products) {
  // Apply handle rename if needed (record OLD handle for legacy SKU lookup).
  const oldHandle = p.handle;
  if (HANDLE_RENAMES[p.handle]) {
    p.handle = HANDLE_RENAMES[p.handle];
    renamed++;
  }

  // Inject sku_code.
  const code = SKU_CODE_MAP[p.handle];
  if (!code) {
    throw new Error(`No SKU code mapped for handle "${p.handle}". Add it to SKU_CODE_MAP.`);
  }
  if (p.sku_code !== code) {
    p.sku_code = code;
    coded++;
  }

  // Normalize sizes on options[].values: split comma-joined multi-sizes,
  // then collapse "5mg / 5mg" whitespace.
  const opt = p.options?.[0];
  if (opt && Array.isArray(opt.values)) {
    const fixed = splitMultiSize(opt.values).map(normalizeSize);
    if (JSON.stringify(fixed) !== JSON.stringify(opt.values)) normalized++;
    opt.values = fixed;
  }

  // Build a row per variant.
  const sizes = opt?.values ?? [];
  for (const size of sizes) {
    rows.push({
      handle: p.handle,
      title: p.title,
      sku_code: code,
      size,
      dose_mg: dosePerComponentMg(size),
      new_sku: buildSku(code, size),
      old_sku: legacyBluumSku(oldHandle, size),
      price_usd: p.price ?? '',
    });
  }
}

// Reorder keys so sku_code lands near the top of each product (cosmetic).
const reordered = products.map(p => {
  const { title, handle, sku_code, ...rest } = p;
  return { title, handle, sku_code, ...rest };
});

fs.writeFileSync(seedPath, JSON.stringify(reordered, null, 2) + '\n');

// CSV output.
const csvHeader = ['handle', 'title', 'sku_code', 'size', 'dose_mg', 'new_sku', 'old_sku', 'price_usd'];
const csvLines = [csvHeader.join(',')];
for (const r of rows) {
  csvLines.push(csvHeader.map(k => csvCell(r[k])).join(','));
}
fs.writeFileSync(csvPath, csvLines.join('\n') + '\n');

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// XLSX output (minimal hand-rolled OOXML, single sheet, no formulas).
writeXlsx(xlsxPath, 'SKU Mapping v1', csvHeader, rows);

console.log(`Updated ${seedPath}`);
console.log(`  - sku_code injected/updated: ${coded} products`);
console.log(`  - blend sizes normalized:    ${normalized} products`);
console.log(`  - handle typos fixed:        ${renamed} products`);
console.log(`Wrote ${csvPath}  (${rows.length} variants)`);
console.log(`Wrote ${xlsxPath} (${rows.length} variants)`);

// ---- xlsx writer ----------------------------------------------------------
// Minimal OOXML SpreadsheetML producer. Enough for a single-sheet workbook
// with header row + data rows. No styling, no formulas.

function writeXlsx(outPath, sheetName, header, rowObjs) {
  const sheetXml = buildSheetXml(header, rowObjs);
  const files = [
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`,
    },
    {
      name: 'xl/workbook.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
    },
    {
      name: 'xl/worksheets/sheet1.xml',
      content: sheetXml,
    },
  ];

  fs.writeFileSync(outPath, buildZip(files));
}

function buildSheetXml(header, rowObjs) {
  const rowsXml = [];
  rowsXml.push(`<row r="1">${header.map((h, i) => cellXml(colLetter(i) + '1', h)).join('')}</row>`);
  rowObjs.forEach((r, idx) => {
    const rowNum = idx + 2;
    const cells = header.map((k, i) => cellXml(colLetter(i) + rowNum, r[k]));
    rowsXml.push(`<row r="${rowNum}">${cells.join('')}</row>`);
  });
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>${rowsXml.join('')}</sheetData>
</worksheet>`;
}

function cellXml(ref, value) {
  if (value === null || value === undefined || value === '') return `<c r="${ref}"/>`;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<c r="${ref}"><v>${value}</v></c>`;
  }
  // Inline string (avoids needing a sharedStrings part).
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(value))}</t></is></c>`;
}

function colLetter(i) {
  let n = i, s = '';
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Tiny ZIP writer (store-only, no compression). Sufficient for OOXML.
function buildZip(files) {
  const fileRecords = [];
  const centralRecords = [];
  let offset = 0;

  for (const f of files) {
    const nameBuf = Buffer.from(f.name, 'utf8');
    const dataBuf = Buffer.from(f.content, 'utf8');
    const crc = crc32(dataBuf);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // local file header sig
    localHeader.writeUInt16LE(20, 4);          // version needed
    localHeader.writeUInt16LE(0, 6);           // gp flags
    localHeader.writeUInt16LE(0, 8);           // method: store
    localHeader.writeUInt16LE(0, 10);          // mtime
    localHeader.writeUInt16LE(0, 12);          // mdate
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(dataBuf.length, 18); // compressed size
    localHeader.writeUInt32LE(dataBuf.length, 22); // uncompressed size
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);          // extra length
    fileRecords.push(localHeader, nameBuf, dataBuf);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(dataBuf.length, 20);
    central.writeUInt32LE(dataBuf.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralRecords.push(central, nameBuf);

    offset += localHeader.length + nameBuf.length + dataBuf.length;
  }

  const centralStart = offset;
  const centralBuf = Buffer.concat(centralRecords);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(centralStart, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...fileRecords, centralBuf, end]);
}

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = (CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)) >>> 0;
  return (c ^ 0xffffffff) >>> 0;
}
