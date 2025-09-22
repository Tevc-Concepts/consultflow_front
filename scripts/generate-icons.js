#!/usr/bin/env node
/* Generate PWA icons from a base SVG using sharp */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const srcSvg = path.join(root, 'public', 'icons', 'base.svg');
const outDir = path.join(root, 'public', 'icons');

const targets = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'maskable-192.png', size: 192 },
    { name: 'maskable-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'favicon-16.png', size: 16 },
    { name: 'favicon-32.png', size: 32 },
    { name: 'favicon-48.png', size: 48 }
];

async function run() {
    if (!fs.existsSync(srcSvg)) {
        console.error(`Missing base SVG at ${srcSvg}. Create a high-contrast square logo as base.svg.`);
        process.exit(1);
    }
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    for (const t of targets) {
        const outPath = path.join(outDir, t.name);
        await sharp(srcSvg)
            .resize(t.size, t.size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
            .png()
            .toFile(outPath);
        console.log('Generated', outPath);
    }
}

run().catch((e) => { console.error(e); process.exit(1); });
