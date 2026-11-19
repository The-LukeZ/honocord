// Generates public/og.png and public/favicon.ico from src/assets/logo.svg.
// Run with `pnpm icons`; the outputs are committed.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = new URL("../", import.meta.url);
const svg = await readFile(new URL("src/assets/logo.svg", root));

// Social image: 1200x630, logo 360px tall, centered on Discord dark.
const logo = await sharp(svg, { density: 600 }).resize({ height: 360 }).png().toBuffer();
await sharp({
  create: { width: 1200, height: 630, channels: 4, background: "#313338" },
})
  .composite([{ input: logo, gravity: "center" }])
  .png()
  .toFile(fileURLToPath(new URL("public/og.png", root)));

// favicon.ico: sharp cannot write ICO, so build the container by hand.
const sizes = [16, 32, 48];
const frames = await Promise.all(
  sizes.map((size) => sharp(svg, { density: 600 }).resize(size, size).png().toBuffer()),
);
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(frames.length, 4);
let offset = 6 + 16 * frames.length;
const entries = frames.map((png, i) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(sizes[i], 0); // width
  entry.writeUInt8(sizes[i], 1); // height
  entry.writeUInt8(0, 2); // palette colors
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += png.length;
  return entry;
});
await writeFile(new URL("public/favicon.ico", root), Buffer.concat([header, ...entries, ...frames]));
console.log("Wrote public/og.png and public/favicon.ico");
