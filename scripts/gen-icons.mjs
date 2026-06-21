import sharp from 'sharp'
import path from 'path'

const iconsDir = path.join(process.cwd(), 'public', 'icons')

function svg(size) {
  const r = Math.round(size * 0.22)
  const fs = Math.round(size * 0.38)
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
    `<rect width="${size}" height="${size}" rx="${r}" fill="#0F172A"/>` +
    `<text x="${size/2}" y="${size/2}" font-family="Arial" font-size="${fs}" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="central">FS</text>` +
    `</svg>`
  )
}

for (const size of [16, 32, 180, 192, 512]) {
  await sharp(svg(size)).resize(size, size).png().toFile(path.join(iconsDir, `icon-${size}.png`))
  console.log(`✓ ${size}px`)
}

const pad = 19, inner = 154
await sharp(svg(inner)).resize(inner, inner)
  .extend({ top: pad, bottom: pad, left: pad, right: pad, background: '#0F172A' })
  .png().toFile(path.join(iconsDir, 'icon-192-maskable.png'))
console.log('✓ maskable 192px')
