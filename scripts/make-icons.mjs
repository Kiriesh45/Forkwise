/**
 * Draws the extension icons.
 *
 * A script rather than committed binaries: the shape is defined once, every
 * size is rendered from the same definition, and a colour change is a one-line
 * diff instead of five opaque files nobody can review.
 *
 * Run with `npm run icons`. PNG is written by hand because the only
 * alternative was a native image dependency for four small squares.
 */

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const SIZES = [16, 32, 48, 96, 128];
const OUTPUT_DIR = new URL('../public/icon/', import.meta.url);

/** Saturated enough to stay visible on both light and dark browser toolbars. */
const BACKGROUND = [45, 164, 78];
const GLYPH = [255, 255, 255];

/**
 * A fork: one stem splitting into two branches, with a node at each end.
 * Coordinates are fractions of the icon, so the drawing is resolution free.
 */
const STEM = { from: [0.5, 0.82], to: [0.5, 0.52] };
const BRANCHES = [
  { from: [0.5, 0.52], to: [0.3, 0.3] },
  { from: [0.5, 0.52], to: [0.7, 0.3] },
];
const NODES = [
  [0.5, 0.82],
  [0.3, 0.28],
  [0.7, 0.28],
];
const STROKE = 0.08;
const NODE_RADIUS = 0.1;
const CORNER_RADIUS = 0.22;

// Called at the bottom of the file: `function` declarations hoist, but the
// `const` lookup table further down does not, and running here would read it
// before it exists.
function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const size of SIZES) {
    writeFileSync(new URL(`${size}.png`, OUTPUT_DIR), encodePng(size, size, render(size)));
  }
  console.log(`Wrote ${SIZES.length} icons to public/icon/`);
}

/** RGBA bytes, painted with a signed distance field so edges stay smooth. */
function render(size) {
  const pixels = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      // Sample at the pixel centre, in 0..1 space.
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;

      const background = coverage(roundedSquareDistance(u, v), size);
      const glyph = coverage(glyphDistance(u, v), size);

      // The glyph sits on top, so its coverage wins where they overlap.
      const [r, g, b] = mix(BACKGROUND, GLYPH, glyph);
      const offset = (y * size + x) * 4;
      pixels[offset] = r;
      pixels[offset + 1] = g;
      pixels[offset + 2] = b;
      pixels[offset + 3] = Math.round(255 * background);
    }
  }

  return pixels;
}

/** Negative inside the shape. Antialiasing is one pixel wide, whatever the size. */
function coverage(distance, size) {
  const edge = 0.7 / size;
  return clamp(0.5 - distance / (2 * edge), 0, 1);
}

function roundedSquareDistance(u, v) {
  const dx = Math.abs(u - 0.5) - (0.5 - CORNER_RADIUS);
  const dy = Math.abs(v - 0.5) - (0.5 - CORNER_RADIUS);
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  return outside + Math.min(Math.max(dx, dy), 0) - CORNER_RADIUS;
}

function glyphDistance(u, v) {
  const strokes = [STEM, ...BRANCHES].map(
    (segment) => segmentDistance(u, v, segment.from, segment.to) - STROKE / 2,
  );
  const nodes = NODES.map(([cx, cy]) => Math.hypot(u - cx, v - cy) - NODE_RADIUS);
  return Math.min(...strokes, ...nodes);
}

function segmentDistance(u, v, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const length = dx * dx + dy * dy;
  const t = length === 0 ? 0 : clamp(((u - ax) * dx + (v - ay) * dy) / length, 0, 1);
  return Math.hypot(u - (ax + t * dx), v - (ay + t * dy));
}

function mix(from, to, amount) {
  return from.map((channel, index) => Math.round(channel + (to[index] - channel) * amount));
}

function clamp(value, low, high) {
  return Math.min(Math.max(value, low), high);
}

/* PNG encoding: signature, IHDR, IDAT, IEND. */

function encodePng(width, height, pixels) {
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y += 1) {
    // Filter type 0 (none) for every scanline. Filters exist to help
    // compression; four tiny icons do not need the help.
    raw[y * (width * 4 + 1)] = 0;
    pixels.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // colour type: RGBA

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

main();
