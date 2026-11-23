// Vymení hlavnú textúru (farbu) 3D modelu za upravený obrázok – napr. iná farba bagra, bez nápisov.
// Použitie: node scripts/retexture.mjs vstup.glb textura.jpg vystup.glb
import fs from "node:fs";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";

const [vstup, obrazok, vystup] = process.argv.slice(2);
await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder });
const doc = await io.read(vstup);
const mime = obrazok.endsWith(".png") ? "image/png" : "image/jpeg";
let n = 0;
for (const mat of doc.getRoot().listMaterials()) {
  const t = mat.getBaseColorTexture();
  if (t) {
    t.setImage(new Uint8Array(fs.readFileSync(obrazok))).setMimeType(mime);
    n++;
  }
}
await io.write(vystup, doc);
console.log("vymenené textúry:", n);
