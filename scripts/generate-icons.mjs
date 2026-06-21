import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const iconsDir = path.join(__dirname, '..', 'public', 'icons')

function buildSVG(size) {
  const r = Math.round(size * 0.22)
  const fontSize = Math.round(size * 0.38)
  const spacing = Math.round(size * 0.02)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${size}" y2="${size}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#1E293B"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#bg)"/>
  <text x="${size/2}" y="${size/2}" font-family="Arial, Helvetica, sans-serif"
    font-size="${fontSize}" font-weight="700" fill="white"
    text-anchor="middle" dominant-baseline="central" letter-spacing="${spacing}">FS</text>
</svg>`
}

const sizes = [16, 32, 180, 192, 512]

for (const size of sizes) {
  await sharp(Buffer.from(buildSVG(size))).resize(size, size).png().toFile(path.join(iconsDir, `icon-${size}.png`))
  console.log(`✓ icon-${size}.png`)
}

// Maskable (192 with 10% safe-zone padding)
const pad = 19
const inner = 192 - pad * 2
await sharp(Buffer.from(buildSVG(inner))).resize(inner, inner)
  .extend({ top: pad, bottom: pad, left: pad, right: pad, background: '#0F172A' })
  .png().toFile(path.join(iconsDir, 'icon-192-maskable.png'))
console.log('✓ icon-192-maskable.png')

console.log('All icons generated!')
