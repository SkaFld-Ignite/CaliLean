const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

function stripPdfInfoMetadata(pdfPath) {
  const source = fs.readFileSync(pdfPath);
  const pdf = source.toString("latin1");
  const stripped = pdf.replace(/\/Info\s+\d+\s+\d+\s+R/g, (match) => " ".repeat(match.length));
  fs.writeFileSync(pdfPath, Buffer.from(stripped, "latin1"));
}

async function exportColorReference() {
  const htmlPath = path.resolve(__dirname, "color-reference.html");
  const outputPath = path.join(__dirname, "color-reference.pdf");

  if (!fs.existsSync(htmlPath)) {
    console.error(`Color reference HTML not found: ${htmlPath}`);
    process.exit(1);
  }

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0", timeout: 30000 });
  await page.emulateMediaType("print");

  await page.pdf({
    path: outputPath,
    printBackground: true,
    preferCSSPageSize: true,
    margin: {
      top: "0",
      right: "0",
      bottom: "0",
      left: "0",
    },
    displayHeaderFooter: false,
    tagged: false,
    outline: false,
  });

  await browser.close();
  stripPdfInfoMetadata(outputPath);
  console.log(`Color reference exported: ${outputPath}`);
}

exportColorReference().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
