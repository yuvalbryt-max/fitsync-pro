const sharp = require('sharp');
const fs    = require('fs');
const path  = require('path');

fs.mkdirSync(path.join(__dirname, 'public', 'icons'), { recursive: true });

// Fitness app icon — dark background + gradient barbell
const svgIcon = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="110" fill="#0a0e1a"/>
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1d3461" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#2d1a52" stop-opacity="0.6"/>
    </linearGradient>
    <linearGradient id="bar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect x="40" y="40" width="432" height="432" rx="80" fill="url(#bg)"/>

  <!-- Barbell center bar -->
  <rect x="156" y="236" width="200" height="40" rx="8" fill="url(#bar)"/>

  <!-- Left weights -->
  <rect x="96"  y="196" width="36" height="120" rx="10" fill="#3b82f6"/>
  <rect x="120" y="176" width="36" height="160" rx="10" fill="#2563eb"/>

  <!-- Right weights -->
  <rect x="380" y="196" width="36" height="120" rx="10" fill="#8b5cf6"/>
  <rect x="356" y="176" width="36" height="160" rx="10" fill="#7c3aed"/>

  <!-- Left collar -->
  <rect x="152" y="210" width="20" height="92" rx="6" fill="#60a5fa"/>
  <!-- Right collar -->
  <rect x="340" y="210" width="20" height="92" rx="6" fill="#a78bfa"/>

  <!-- Subtle glow -->
  <ellipse cx="256" cy="256" rx="180" ry="40" fill="url(#bar)" opacity="0.08"/>
</svg>`;

async function makeIcon(size) {
  await sharp(Buffer.from(svgIcon))
    .resize(size, size)
    .png({ quality: 95, compressionLevel: 9 })
    .toFile(path.join(__dirname, 'public', 'icons', `icon-${size}.png`));
  console.log(`icon-${size}.png created`);
}

Promise.all([makeIcon(192), makeIcon(512), makeIcon(180), makeIcon(32), makeIcon(16)])
  .then(() => console.log('All icons generated!'))
  .catch(console.error);
