"use client";

import { Suspense, useMemo } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { ContactShadows, Environment, Lightformer, PresentationControls } from "@react-three/drei";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { Bager, type BagerTyp } from "./bager";
import { Studio, Ziara } from "./studio";

function Pismo({ text }: { text: string }) {
  const font = useLoader(FontLoader, "/fonts/inter-bold.typeface.json");
  const geo = useMemo(() => {
    const g = new TextGeometry(text, { font, size: 2.3, depth: 0.7, curveSegments: 10, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.04, bevelSegments: 5 });
    g.center();
    return g;
  }, [font, text]);
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial color="#ffffff" roughness={0.4} metalness={0} emissive="#ffffff" emissiveIntensity={0.62} />
    </mesh>
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
    camera.lookAt(0, 3.1 + (k - 1) * 1.5, -3);
  }, [camera, k]);
  return null;
}

function Napis() {
  const { text } = useUzky();
  return (
    <group position={[0, 6.2, -9.6]} scale={[text, text, 1]}>
      {/* teplé podsvietenie zozadu: žiara na stene + svetlá za písmenami */}
      <Ziara farba="#ffa24a" sila={0.75} scale={[30, 11, 1]} position={[0, 0.2, -1.4]} />
      <Ziara farba="#ffc27a" sila={0.6} scale={[18, 5, 1]} position={[0, 0.2, -1.35]} />
      <pointLight position={[-5, 0.5, -0.8]} color="#ff9d42" intensity={60} distance={12} decay={2} />
      <pointLight position={[0, 0.5, -0.8]} color="#ffae5c" intensity={60} distance={12} decay={2} />
      <pointLight position={[5, 0.5, -0.8]} color="#ff9d42" intensity={60} distance={12} decay={2} />
      <Pismo text="Voščinár" />
    </group>
  );
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
      <Studio />
      <Suspense fallback={null}>
        <Napis />
      </Suspense>
      <PresentationControls global snap rotation={[0, Math.PI + 0.55, 0]} polar={[-0.05, 0.15]} azimuth={[-0.8, 0.8]}>
        <Bager key={typ} typ={typ} position={[typ === "mini" ? -1.5 : -1.8, 0, 0]} scale={typ === "mini" ? 1.7 : typ === "kolesovy" ? 1.15 : 1} rychlost={0.8} />
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
