const sharp = require('sharp');
const fs    = require('fs');
const path  = require('path');

// Professional FitSync Pro icon
// Inspired by Apple Fitness rings + clean monogram
const svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Deep blue gradient background -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#1E3A8A"/>
      <stop offset="50%"  stop-color="#1D4ED8"/>
      <stop offset="100%" stop-color="#2563EB"/>
    </linearGradient>
    <!-- Shine overlay -->
    <radialGradient id="shine" cx="35%" cy="25%" r="60%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
    <!-- Glow for rings -->
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Rounded square background -->
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <!-- Shine -->
  <rect width="512" height="512" rx="112" fill="url(#shine)"/>

  <!-- Activity rings (top-right decoration, like Apple Watch) -->
  <!-- Outer ring -->
  <circle cx="370" cy="142" r="68" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="16" stroke-linecap="round"/>
  <circle cx="370" cy="142" r="68" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="16" stroke-linecap="round"
    stroke-dasharray="290 142" transform="rotate(-90 370 142)"/>
  <!-- Middle ring -->
  <circle cx="370" cy="142" r="48" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="14" stroke-linecap="round"/>
  <circle cx="370" cy="142" r="48" fill="none" stroke="rgba(255,255,255,0.40)" stroke-width="14" stroke-linecap="round"
    stroke-dasharray="215 86" transform="rotate(-90 370 142)"/>
  <!-- Inner ring -->
  <circle cx="370" cy="142" r="30" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="12" stroke-linecap="round"/>
  <circle cx="370" cy="142" r="30" fill="none" stroke="rgba(255,255,255,0.30)" stroke-width="12" stroke-linecap="round"
    stroke-dasharray="135 54" transform="rotate(-90 370 142)"/>

  <!-- Bold "F" monogram — large, geometric, clean -->
  <!-- Vertical bar -->
  <rect x="108" y="158" width="62" height="262" rx="31" fill="white"/>
  <!-- Top horizontal bar — full width -->
  <rect x="108" y="158" width="230" height="58" rx="29" fill="white"/>
  <!-- Middle bar — shorter -->
  <rect x="108" y="264" width="178" height="52" rx="26" fill="white"/>

  <!-- Heartbeat pulse line below F -->
  <path d="M 88 420 L 148 420 L 178 348 L 216 492 L 254 380 L 288 420 L 424 420"
    stroke="rgba(255,255,255,0.72)" stroke-width="18"
    fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
</svg>`;

const buf = Buffer.from(svg);

(async () => {
  const sizes = [16, 32, 180, 192, 512];
  for (const s of sizes) {
    await sharp(buf).resize(s, s).png({ quality: 98 }).toFile(
      path.join('C:/Users/yuval/My Claude/fitsync-pro/public/icons', `icon-${s}.png`)
    );
    console.log(`✓ icon-${s}.png`);
  }
  console.log('All icons generated!');
})();
