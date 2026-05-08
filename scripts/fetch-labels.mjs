import fs from 'fs';
import path from 'path';

const FIGMA_TOKEN = process.env.FIGMA_PAT;
const FILE_KEY = "WgQvUpgybIgrMILvoru3Jh";

async function main() {
  if (!FIGMA_TOKEN) {
    console.error("Missing FIGMA_PAT environment variable");
    process.exit(1);
  }
  const res = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}`, {
    headers: {
      "X-Figma-Token": FIGMA_TOKEN
    }
  });
  if (!res.ok) {
    console.error("Failed to fetch Figma file:", res.status, res.statusText);
    process.exit(1);
  }
  const data = await res.json();
  const pages = data.document.children;
  
  const labels = [];
  
  for (const page of pages) {
    const frames = page.children.filter(c => c.type === 'FRAME' || c.type === 'COMPONENT' || c.type === 'INSTANCE');
    for (const frame of frames) {
      const faviconFrame = frame.children?.find(c => c.name === 'Favicon');
      const qrCodeNode = frame.children?.find(c => c.name === 'QR Code');
      
      if (faviconFrame && qrCodeNode) {
        labels.push({
          pageName: page.name,
          frameName: frame.name,
          frameId: frame.id
        });
      }
    }
  }

  // Now fetch SVG for all these frames
  const ids = labels.map(l => l.frameId).join(',');
  const imagesRes = await fetch(`https://api.figma.com/v1/images/${FILE_KEY}?ids=${encodeURIComponent(ids)}&format=svg`, {
    headers: {
      "X-Figma-Token": FIGMA_TOKEN
    }
  });
  
  if (!imagesRes.ok) {
    console.error("Failed to fetch image URLs:", imagesRes.status, await imagesRes.text());
    process.exit(1);
  }
  
  const imagesData = await imagesRes.json();
  const imagesMap = imagesData.images || {};
  
  const outDirRoot = path.join(process.cwd(), 'renders', 'labels');
  fs.mkdirSync(outDirRoot, { recursive: true });

  for (const label of labels) {
    const svgUrl = imagesMap[label.frameId];
    if (svgUrl) {
      // Create product dir
      const prodDir = path.join(outDirRoot, label.pageName.replace(/[^a-zA-Z0-9]/g, '_'));
      fs.mkdirSync(prodDir, { recursive: true });
      
      // Fetch SVG content
      const svgRes = await fetch(svgUrl);
      const svgContent = await svgRes.text();
      
      const fileName = `${label.frameName.replace(/[^a-zA-Z0-9-]/g, '_')}.svg`;
      const filePath = path.join(prodDir, fileName);
      
      fs.writeFileSync(filePath, svgContent);
      console.log(`Saved ${filePath}`);
    } else {
      console.warn(`No SVG URL returned for ${label.frameName} (${label.frameId})`);
    }
  }
  
  console.log("Finished extracting SVGs.");
}

main().catch(console.error);

