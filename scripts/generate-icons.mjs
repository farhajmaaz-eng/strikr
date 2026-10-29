import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const mark = (size, padding = 0) => {
  const inner = size - padding * 2;
  const scale = inner / 64;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#08090a"/>
    <g transform="translate(${padding} ${padding}) scale(${scale})">
      <rect width="64" height="64" fill="#ff4d2e"/>
      <path d="M15 51 38 13" stroke="#08090a" stroke-width="7" stroke-linecap="square"/>
      <path d="M28 51 51 13" stroke="#08090a" stroke-width="7" stroke-linecap="square"/>
      <path d="M11 51h30" stroke="#08090a" stroke-width="7"/>
    </g>
  </svg>`;
};

await sharp(Buffer.from(mark(192))).png().toFile('public/pwa-192.png');
await sharp(Buffer.from(mark(512))).png().toFile('public/pwa-512.png');
await sharp(Buffer.from(mark(512, 72))).png().toFile('public/pwa-maskable-512.png');
await sharp(Buffer.from(mark(180))).png().toFile('public/apple-touch-icon.png');
await sharp('public/favicon.svg').resize(64, 64).png().toFile('public/favicon-64.png');
console.log('icons generated');
