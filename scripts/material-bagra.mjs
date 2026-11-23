// Nastaví bagru novú farbu, drsnosť a lesklý lak (clearcoat) – napr. čierny lesklý bager.
// Použitie: node scripts/material-bagra.mjs vstup.glb farba.jpg orm.png lak.png vystup.glb
import fs from "node:fs";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, KHRMaterialsClearcoat } from "@gltf-transform/extensions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";

const [vstup, farba, orm, lak, vystup] = process.argv.slice(2);
await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder });
const doc = await io.read(vstup);
const cc = doc.createExtension(KHRMaterialsClearcoat);
const img = (p) => new Uint8Array(fs.readFileSync(p));
for (const mat of doc.getRoot().listMaterials()) {
  const t = mat.getBaseColorTexture();
  if (!t) continue;
  t.setImage(img(farba)).setMimeType("image/jpeg");
  mat.setBaseColorFactor([1, 1, 1, 1]);
  // sken mal farbu aj ako vlastné svetlo (plochý vzhľad) – stlmíme, aby vynikol lesk a tiene
  mat.setEmissiveFactor([0.12, 0.12, 0.12]);
  const mr = mat.getMetallicRoughnessTexture();
  if (mr) mr.setImage(img(orm)).setMimeType("image/png"); // zdieľaná aj s AO (kanál R)
  mat.setRoughnessFactor(1).setMetallicFactor(0);
  // sken mal vypnuté odlesky (specular 0) – zapneme, inak lak nemôže svietiť
  mat.setExtension("KHR_materials_specular", null);
  const lakTex = doc.createTexture("lak").setImage(img(lak)).setMimeType("image/png");
  mat.setExtension("KHR_materials_clearcoat", cc.createClearcoat().setClearcoatFactor(1).setClearcoatTexture(lakTex).setClearcoatRoughnessFactor(0.08));
}
await io.write(vystup, doc);
console.log("hotovo", vystup);
