// Prevedie Inter Bold (TTF) na typeface JSON pre three.js – iba znaky, ktoré potrebujeme (aj č, š, ž, ľ, á…).
import fs from "node:fs";
import opentype from "opentype.js";

const src = new URL("../../src/lib/pdf/fonts/Inter_700Bold.ttf", import.meta.url);
const font = opentype.parse(fs.readFileSync(src).buffer);
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽáäčďéíĺľňóôŕšťúýž0123456789 .,-&";
const scale = (100000) / ((font.unitsPerEm || 2048) * 72);
const glyphs = {};
for (const ch of chars) {
  const g = font.charToGlyph(ch);
  const token = { ha: Math.round(g.advanceWidth * scale), x_min: 0, x_max: 0, o: "" };
  if (g.xMin !== undefined) { token.x_min = Math.round(g.xMin * scale); token.x_max = Math.round(g.xMax * scale); }
  for (const c of g.path.commands) {
    const r = (v) => Math.round(v * scale);
    if (c.type === "M") token.o += `m ${r(c.x)} ${r(c.y)} `;
    else if (c.type === "L") token.o += `l ${r(c.x)} ${r(c.y)} `;
    else if (c.type === "Q") token.o += `q ${r(c.x)} ${r(c.y)} ${r(c.x1)} ${r(c.y1)} `;
    else if (c.type === "C") token.o += `b ${r(c.x)} ${r(c.y)} ${r(c.x1)} ${r(c.y1)} ${r(c.x2)} ${r(c.y2)} `;
  }
  glyphs[ch] = token;
}
const out = {
  glyphs,
  familyName: "Inter",
  ascender: Math.round(font.ascender * scale),
  descender: Math.round(font.descender * scale),
  underlinePosition: Math.round(font.tables.post.underlinePosition * scale),
  underlineThickness: Math.round(font.tables.post.underlineThickness * scale),
  boundingBox: {
    yMin: Math.round(font.tables.head.yMin * scale), xMin: Math.round(font.tables.head.xMin * scale),
    yMax: Math.round(font.tables.head.yMax * scale), xMax: Math.round(font.tables.head.xMax * scale),
  },
  resolution: 1000,
  original_font_information: font.tables.name,
};
fs.writeFileSync(new URL("../public/fonts/inter-bold.typeface.json", import.meta.url), JSON.stringify(out));
console.log("ok", Object.keys(glyphs).length, "znakov");
