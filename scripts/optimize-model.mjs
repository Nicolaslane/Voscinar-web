// Zmenší 3D model pre web: textúry na WebP a menšie rozlíšenie, menej trojuholníkov, kompresia meshopt.
// Použitie: node scripts/optimize-model.mjs vstup.glb vystup.glb [maxTextura=2048] [podielTrojuholnikov=1]
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTMeshoptCompression } from "@gltf-transform/extensions";
import { dedup, prune, resample, simplify, textureCompress, weld, meshopt } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";

const [vstup, vystup, tex = "2048", podiel = "1"] = process.argv.slice(2);
await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
const doc = await io.read(vstup);
const kroky = [dedup(), prune(), resample()];
if (Number(podiel) < 1) kroky.push(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: Number(podiel), error: 0.0008 }));
kroky.push(textureCompress({ encoder: sharp, targetFormat: "webp", resize: [Number(tex), Number(tex)], quality: 82 }), meshopt({ encoder: MeshoptEncoder, level: "medium" }));
await doc.transform(...kroky);
await io.write(vystup, doc);
console.log("hotovo", vystup);
