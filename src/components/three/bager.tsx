"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

export type BagerTyp = "pasovy" | "mini" | "kolesovy";
export const bagerTypy: { id: BagerTyp; nazov: string; popis: string }[] = [
  { id: "pasovy", nazov: "Pásový bager", popis: "20 t – veľké výkopy" },
  { id: "mini", nazov: "Minibáger", popis: "3 t – záhrady, prípojky" },
  { id: "kolesovy", nazov: "Kolesový bager", popis: "15 t – rýchly presun" },
];

const ZLTA = "#f2a900";
const TMAVA = "#26282b";
const OCEL = "#9aa0a6";

function Mat({ c, r = 0.45, m = 0.1 }: { c: string; r?: number; m?: number }) {
  return <meshStandardMaterial color={c} roughness={r} metalness={m} />;
}

// valec medzi dvoma bodmi (hydraulika)
function Valec({ a, b, r = 0.07, c = OCEL }: { a: [number, number, number]; b: [number, number, number]; r?: number; c?: string }) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const len = va.distanceTo(vb);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  return (
    <mesh position={mid} quaternion={q} castShadow>
      <cylinderGeometry args={[r, r, len, 14]} />
      <meshStandardMaterial color={c} roughness={0.25} metalness={0.8} />
    </mesh>
  );
}

function Lyzica() {
  // polvalec otvorený dopredu + bočnice + zuby
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, -Math.PI / 2]} position={[0.25, -0.2, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.95, 20, 1, true, 0, Math.PI]} />
        <meshStandardMaterial color={TMAVA} roughness={0.6} metalness={0.3} side={THREE.DoubleSide} />
      </mesh>
      {[-0.475, 0.475].map((z) => (
        <mesh key={z} position={[0.25, -0.2, z]} rotation={[0, 0, -Math.PI / 2]} castShadow>
          <circleGeometry args={[0.42, 20, 0, Math.PI]} />
          <meshStandardMaterial color={TMAVA} roughness={0.6} metalness={0.3} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {[-0.36, -0.12, 0.12, 0.36].map((z) => (
        <mesh key={z} position={[0.72, -0.2, z]} rotation={[0, 0, -Math.PI / 2]} castShadow>
          <coneGeometry args={[0.06, 0.18, 4]} />
          <Mat c={OCEL} r={0.3} m={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function Pasy({ guma }: { guma: boolean }) {
  return (
    <group>
      {[-1.05, 1.05].map((z) => (
        <group key={z} position={[0, 0.45, z]}>
          <RoundedBox args={[4.4, 0.9, 0.7]} radius={0.42} smoothness={6} castShadow receiveShadow>
            <Mat c={guma ? "#1b1b1b" : TMAVA} r={0.85} />
          </RoundedBox>
          {/* kolesá v páse */}
          {[-1.75, 1.75].map((x) => (
            <mesh key={x} position={[x, 0, z > 0 ? 0.36 : -0.36]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.32, 0.32, 0.04, 20]} />
              <Mat c={ZLTA} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[2.6, 0.5, 1.5]} />
        <Mat c={TMAVA} />
      </mesh>
    </group>
  );
}

function Kolesa() {
  return (
    <group>
      <RoundedBox args={[4.2, 0.6, 1.9]} radius={0.12} position={[0, 0.95, 0]} castShadow>
        <Mat c={ZLTA} />
      </RoundedBox>
      {[-1.4, 1.4].map((x) =>
        [-1.0, 1.0].map((z) => (
          <group key={`${x}${z}`} position={[x, 0.55, z]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.55, 0.55, 0.42, 28]} />
              <Mat c="#151515" r={0.9} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, z > 0 ? 0.22 : -0.22]}>
              <cylinderGeometry args={[0.3, 0.3, 0.02, 20]} />
              <Mat c={OCEL} r={0.3} m={0.7} />
            </mesh>
          </group>
        )),
      )}
      {/* radlica vzadu */}
      <mesh position={[-2.35, 0.45, 0]} castShadow>
        <boxGeometry args={[0.18, 0.6, 2.3]} />
        <Mat c={ZLTA} />
      </mesh>
    </group>
  );
}

/** Bager orientovaný dopredu v smere +X. Mierka ~ 1 jednotka = 1 m (pásový). */
export function Bager({ typ = "pasovy", kope = true, rychlost = 1, ...props }: { typ?: BagerTyp; kope?: boolean; rychlost?: number } & React.ComponentProps<"group">) {
  const vrch = useRef<THREE.Group>(null);
  const vyloznik = useRef<THREE.Group>(null);
  const rameno = useRef<THREE.Group>(null);
  const lyzica = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * rychlost;
    const f = kope ? 1 : 0.15;
    // pracovný cyklus: zaber – zdvih – otoč – vysyp – späť
    const c = (Math.sin(t * 0.9) + 1) / 2;
    if (vyloznik.current) vyloznik.current.rotation.z = 0.55 + f * 0.25 * Math.sin(t * 0.9);
    if (rameno.current) rameno.current.rotation.z = -1.55 + f * 0.55 * Math.sin(t * 0.9 + 1.2);
    if (lyzica.current) lyzica.current.rotation.z = -0.9 + f * 0.8 * (c - 0.5) * 2 * Math.sin(t * 0.9 + 2.0);
    if (vrch.current) vrch.current.rotation.y = f * 0.35 * Math.sin(t * 0.45);
  });

  const mini = typ === "mini";
  const kol = typ === "kolesovy";
  const s = mini ? 0.5 : kol ? 0.85 : 1;
  const zaklad = kol ? 1.25 : 0.95;

  return (
    <group {...props}>
      <group scale={s}>
        {kol ? <Kolesa /> : <Pasy guma={mini} />}
        {mini && (
          <group position={[2.45, 0.35, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.2, 0.6, 2.8]} />
              <Mat c={ZLTA} />
            </mesh>
            <Valec a={[-0.2, 0.3, 0]} b={[-0.9, 0.6, 0]} r={0.06} />
          </group>
        )}

        {/* otočná nadstavba */}
        <group ref={vrch} position={[0, zaklad, 0]}>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.9, 0.9, 0.16, 32]} />
            <Mat c={TMAVA} />
          </mesh>
          {/* telo */}
          <RoundedBox args={[3.1, 1.15, 2.5]} radius={0.18} smoothness={4} position={[-0.35, 0.75, 0]} castShadow receiveShadow>
            <Mat c={ZLTA} />
          </RoundedBox>
          {/* protiváha */}
          <RoundedBox args={[0.7, 1.0, 2.5]} radius={0.3} smoothness={4} position={[-1.95, 0.7, 0]} castShadow>
            <Mat c={TMAVA} r={0.5} />
          </RoundedBox>
          {/* mriežka motora */}
          {[-1.2, -0.85, -0.5].map((x) => (
            <mesh key={x} position={[x, 1.335, -0.45]}>
              <boxGeometry args={[0.18, 0.02, 1.2]} />
              <Mat c={TMAVA} />
            </mesh>
          ))}
          {/* výfuk */}
          <mesh position={[-0.4, 1.65, -0.9]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.6, 12]} />
            <Mat c="#444" m={0.6} r={0.3} />
          </mesh>

          {/* kabína */}
          {mini ? (
            <group position={[0.4, 1.32, 0.55]}>
              {[[-0.55, -0.55], [-0.55, 0.55], [0.55, -0.55], [0.55, 0.55]].map(([x, z]) => (
                <mesh key={`${x}${z}`} position={[x, 0.8, z]} castShadow>
                  <boxGeometry args={[0.08, 1.6, 0.08]} />
                  <Mat c={TMAVA} />
                </mesh>
              ))}
              <RoundedBox args={[1.3, 0.12, 1.3]} radius={0.05} position={[0, 1.65, 0]} castShadow>
                <Mat c={ZLTA} />
              </RoundedBox>
              <mesh position={[0, 0.3, 0]}>
                <boxGeometry args={[0.5, 0.6, 0.5]} />
                <Mat c="#111" />
              </mesh>
            </group>
          ) : (
            <group position={[0.55, 2.0, 0.62]}>
              <RoundedBox args={[1.25, 1.55, 1.05]} radius={0.1} smoothness={4} castShadow>
                <Mat c={ZLTA} />
              </RoundedBox>
              {/* sklá */}
              <mesh position={[0.635, 0.12, 0]}>
                <boxGeometry args={[0.02, 1.1, 0.85]} />
                <meshPhysicalMaterial color="#1d2a33" roughness={0.05} metalness={0.2} clearcoat={1} />
              </mesh>
              <mesh position={[0.05, 0.12, 0.53]}>
                <boxGeometry args={[1.0, 1.1, 0.02]} />
                <meshPhysicalMaterial color="#1d2a33" roughness={0.05} metalness={0.2} clearcoat={1} />
              </mesh>
              <mesh position={[0.05, 0.12, -0.53]}>
                <boxGeometry args={[1.0, 1.1, 0.02]} />
                <meshPhysicalMaterial color="#1d2a33" roughness={0.05} metalness={0.2} clearcoat={1} />
              </mesh>
              {/* maják */}
              <mesh position={[-0.35, 0.86, 0.3]}>
                <cylinderGeometry args={[0.08, 0.1, 0.16, 12]} />
                <meshStandardMaterial color="#ff8a00" emissive="#ff6a00" emissiveIntensity={1.5} />
              </mesh>
            </group>
          )}

          {/* výložník */}
          <group ref={vyloznik} position={[1.05, 1.0, -0.15]}>
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.55, 16]} />
              <Mat c={TMAVA} />
            </mesh>
            <RoundedBox args={[2.7, 0.5, 0.42]} radius={0.08} position={[1.3, 0, 0]} castShadow>
              <Mat c={ZLTA} />
            </RoundedBox>
            <Valec a={[0.2, -0.55, 0.3]} b={[1.6, -0.15, 0.3]} r={0.08} />
            <Valec a={[0.2, -0.55, -0.3]} b={[1.6, -0.15, -0.3]} r={0.08} />
            <group position={[2.6, 0, 0]} rotation={[0, 0, -0.95]}>
              <RoundedBox args={[2.3, 0.46, 0.4]} radius={0.08} position={[1.1, 0, 0]} castShadow>
                <Mat c={ZLTA} />
              </RoundedBox>
              <Valec a={[0.1, 0.3, 0]} b={[1.9, 0.3, 0]} r={0.07} />
              {/* rameno */}
              <group ref={rameno} position={[2.2, 0, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.15, 0.15, 0.5, 16]} />
                  <Mat c={TMAVA} />
                </mesh>
                <RoundedBox args={[2.2, 0.34, 0.32]} radius={0.06} position={[1.0, 0, 0]} castShadow>
                  <Mat c={ZLTA} />
                </RoundedBox>
                <Valec a={[-0.2, 0.22, 0]} b={[1.6, 0.22, 0]} r={0.06} />
                <group ref={lyzica} position={[2.05, 0, 0]}>
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.1, 0.1, 0.45, 12]} />
                    <Mat c={TMAVA} />
                  </mesh>
                  <Lyzica />
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
