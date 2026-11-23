"use client";

import { Suspense, useMemo } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { ContactShadows, Environment, Lightformer, PresentationControls } from "@react-three/drei";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { Bager, type BagerTyp } from "./bager";
import { ModelBagra, useExistujeModel } from "./model-bagra";
import { Studio } from "./studio";

const VELKOST = 2.6; // výška písmen
const HLBKA = 0.45; // hrúbka písmen
const ODSTUP = 0.32; // medzera medzi písmenami a stenou (tam svieti LED)

/** Žiara na stene presne podľa tvaru písmen (ako podsvietené reklamné písmená). */
function Halo({ shapes, sirka, vyska, offX, offY }: { shapes: THREE.Shape[]; sirka: number; vyska: number; offX: number; offY: number }) {
  const { tex, w, h } = useMemo(() => {
    const okraj = 1.4; // m okolo písmen
    const ppm = 120; // pixelov na meter
    const w = sirka + okraj * 2, h = vyska + okraj * 2;
    const c = document.createElement("canvas");
    c.width = Math.round(w * ppm);
    c.height = Math.round(h * ppm);
    const x = c.getContext("2d")!;
    const cesta = new Path2D();
    const bod = (p: THREE.Vector2) => [(p.x + offX + w / 2) * ppm, (h / 2 - (p.y + offY)) * ppm] as const;
    const obrys = (pts: THREE.Vector2[]) => {
      pts.forEach((p, i) => (i ? cesta.lineTo(...bod(p)) : cesta.moveTo(...bod(p))));
      cesta.closePath();
    };
    for (const sh of shapes) {
      obrys(sh.getPoints(12));
      sh.holes.forEach((hole) => obrys(hole.getPoints(12)));
    }
    // vrstvy: široká mäkká žiara + tesný jasný lem
    const vrstvy: [number, string][] = [
      [0.6, "rgba(255,150,60,0.28)"],
      [0.26, "rgba(255,170,90,0.45)"],
      [0.1, "rgba(255,205,150,0.75)"],
      [0.035, "rgba(255,242,220,0.95)"],
    ];
    for (const [rozmaz, farba] of vrstvy) {
      x.filter = `blur(${rozmaz * ppm}px)`;
      x.fillStyle = farba;
      x.fill(cesta, "evenodd");
      x.fill(cesta, "evenodd");
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { tex: t, w, h };
  }, [shapes, sirka, vyska, offX, offY]);
  return (
    <mesh position={[0, 0, -(HLBKA / 2 + ODSTUP) + 0.01]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function Pismo({ text }: { text: string }) {
  const font = useLoader(FontLoader, "/fonts/inter-bold.typeface.json");
  const { geo, shapes, sirka, vyska, offX, offY } = useMemo(() => {
    const g = new TextGeometry(text, { font, size: VELKOST, depth: HLBKA, curveSegments: 10, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 4 });
    g.computeBoundingBox();
    const b = g.boundingBox!;
    const offX = -(b.min.x + b.max.x) / 2, offY = -(b.min.y + b.max.y) / 2;
    g.translate(offX, offY, -(b.min.z + b.max.z) / 2);
    return { geo: g, shapes: font.generateShapes(text, VELKOST), sirka: b.max.x - b.min.x, vyska: b.max.y - b.min.y, offX, offY };
  }, [font, text]);
  return (
    <group>
      <Halo shapes={shapes} sirka={sirka} vyska={vyska} offX={offX} offY={offY} />
      <mesh geometry={geo}>
        {/* čelo bielej farby, boky trochu tmavšie – vyzerá ako skutočné kovové písmená */}
        <meshStandardMaterial color="#ffffff" roughness={0.35} metalness={0.05} emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// na úzkom displeji (mobil) kamera ďalej a nápis menší, aby sa všetko zmestilo
function useUzky() {
  const { size } = useThree();
  const a = size.width / size.height;
  return { k: Math.min(1.6, Math.max(1, 1.25 / a)), text: Math.min(1, Math.max(0.6, a / 0.8)) };
}

function Kamera() {
  const { camera } = useThree();
  const { k } = useUzky();
  useEffect(() => {
    camera.position.set(0, 4.6 + (k - 1) * 3, 19 * k);
    camera.lookAt(0, 2.5 + (k - 1) * 1.5, -3);
  }, [camera, k]);
  return null;
}

function Napis() {
  const { text } = useUzky();
  // písmená visia na rovnej zadnej stene štúdia (stena je v z = -12)
  return (
    <group position={[0, 7.4, -12 + ODSTUP + HLBKA / 2]} scale={[text, text, 1]}>
      <Pismo text="Voščinár" />
    </group>
  );
}

// Ak je v public/models/<typ>.glb skutočný model, použije sa; inak sa ukáže jednoduchý bager.
function BagerNaScene({ typ }: { typ: BagerTyp }) {
  const url = `/models/${typ}.glb`;
  const existuje = useExistujeModel(url);
  if (existuje === null) return null;
  if (existuje)
    return (
      <Suspense fallback={null}>
        <ModelBagra key={url} url={url} dlzka={typ === "mini" ? 6.5 : 8.2} rotation-y={1.95} />
      </Suspense>
    );
  return <Bager key={typ} typ={typ} position={[typ === "mini" ? -1.5 : -1.8, 0, 0]} scale={typ === "mini" ? 1.7 : typ === "kolesovy" ? 1.15 : 1} rychlost={0.8} />;
}

export default function HeroScene({ typ }: { typ: BagerTyp }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 4.6, 19], fov: 36 }} onCreated={({ camera }) => camera.lookAt(0, 3.1, -3)}>
      <color attach="background" args={["#f4f3f1"]} />
      <fog attach="fog" args={["#f4f3f1", 30, 60]} />
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#ffffff", "#e8e4de", 0.6]} />
      <directionalLight
        position={[6, 12, 8]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0004}
      />
      <Kamera />
      <Studio polomer={4} />
      <Suspense fallback={null}>
        <Napis />
      </Suspense>
      <PresentationControls global snap rotation={[0, Math.PI + 0.55, 0]} polar={[-0.05, 0.15]} azimuth={[-0.8, 0.8]}>
        <BagerNaScene typ={typ} />
      </PresentationControls>
      <ContactShadows position={[0, 0.01, 0]} opacity={0.45} scale={22} blur={2.4} far={6} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2.5} position={[0, 8, 6]} scale={[12, 4, 1]} rotation-x={Math.PI / 2.5} />
        <Lightformer form="rect" intensity={1.5} position={[-8, 3, 2]} scale={[4, 6, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.5} position={[8, 3, 2]} scale={[4, 6, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="ring" color="#ffb366" intensity={2} position={[0, 4, -9]} scale={6} />
      </Environment>
    </Canvas>
  );
}
