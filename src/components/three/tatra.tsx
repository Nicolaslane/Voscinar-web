"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useExistujeModel } from "./model-bagra";

/** Diely skutočného modelu nákladiaka, ktoré sa hýbu. */
type DielyModelu = { korba: THREE.Object3D; kolesa: THREE.Object3D[]; naklad: THREE.Object3D };

/**
 * Skutočný model sklápača (public/models/tatra.glb, MAN TGA zo Sketchfabu, CC-BY-4.0).
 * Model ide dopredu v osi +Z, otočíme ho na +X. Korba sa vyklápa okolo zadnej hrany (uzol „platform“).
 */
function TatraModel({ farbaNakladu, onReady }: { farbaNakladu: string; onReady: (d: DielyModelu | null) => void }) {
  const { scene } = useGLTF("/models/tatra.glb");
  const { obj, diely } = useMemo(() => {
    const obj = scene.clone(true);
    obj.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    const korba = obj.getObjectByName("platform")!;
    const kolesa = ["wheel_back_axis1_left", "wheel_back_axis1_right", "wheel_back_axis2_left", "wheel_back_axis2_right", "wheel_front_left", "wheel_front_right"]
      .map((n) => obj.getObjectByName(n))
      .filter((o): o is THREE.Object3D => Boolean(o));
    // náklad (kopa zeminy) v korbe – súradnice korby sú v centimetroch
    const naklad = new THREE.Group();
    const kopa = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: farbaNakladu, roughness: 1 }));
    kopa.scale.set(88, 75, 205);
    kopa.castShadow = true;
    naklad.add(kopa);
    naklad.position.set(0, 2, 200);
    korba.add(naklad);
    return { obj, diely: { korba, kolesa, naklad } };
  }, [scene, farbaNakladu]);
  useEffect(() => {
    onReady(diely);
    return () => onReady(null);
  }, [diely, onReady]);
  return <primitive object={obj} rotation-y={Math.PI / 2} />;
}

useGLTF.preload?.("/models/tatra.glb");

const ORANZ = "#e8590c";
const SIVA = "#5b6168";
const TMAVA = "#1c1d1f";

function Koleso({ x, z, refs }: { x: number; z: number; refs: React.RefObject<THREE.Group[]> }) {
  return (
    <group
      position={[x, 0.62, z]}
      ref={(g) => {
        if (g && refs.current && !refs.current.includes(g)) refs.current.push(g);
      }}
    >
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.62, 0.62, 0.5, 28]} />
        <meshStandardMaterial color="#141414" roughness={0.95} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, z > 0 ? 0.26 : -0.26]}>
        <cylinderGeometry args={[0.34, 0.34, 0.02, 6]} />
        <meshStandardMaterial color={ORANZ} roughness={0.5} />
      </mesh>
    </group>
  );
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * Sklápač Tatra 6×6, čelom v smere +X. Sám sa animuje:
 * odvoz – príde prázdny, naloží sa, odíde · dovoz – príde plný, vysype, odíde.
 */
export function Tatra({
  rezim = "odvoz",
  farbaNakladu = "#7a5232",
  jazdy = 1,
  onJazda,
  staticky = false,
  ...props
}: {
  rezim?: "odvoz" | "dovoz";
  farbaNakladu?: string;
  jazdy?: number;
  onJazda?: (n: number) => void;
  staticky?: boolean;
} & React.ComponentProps<"group">) {
  const auto = useRef<THREE.Group>(null);
  const korba = useRef<THREE.Group>(null);
  const naklad = useRef<THREE.Group>(null);
  const kolesa = useRef<THREE.Group[]>([]);
  const stav = useRef({ t: 0, jazda: 1, x: rezim === "dovoz" ? 28 : -28 });
  const model = useRef<DielyModelu | null>(null);
  const maModel = useExistujeModel("/models/tatra.glb");
  const nastavModel = useMemo(() => (d: DielyModelu | null) => (model.current = d), []);

  useFrame((_, dt) => {
    if (!auto.current) return;
    if (staticky) return;
    const s = stav.current;
    s.t += Math.min(dt, 0.05);
    const T = { prichod: 3.2, praca: 3.0, korbaDole: 1.0, odchod: 2.8 };
    const cyklus = T.prichod + T.praca + T.korbaDole + T.odchod;
    if (s.t > cyklus) {
      s.t = 0;
      s.jazda = s.jazda >= jazdy ? 1 : s.jazda + 1;
      onJazda?.(s.jazda);
    }
    let x = 0, tilt = 0, plne = rezim === "odvoz" ? 0 : 1;
    const t = s.t;
    // odvoz: príde dopredu zľava · dovoz: cúva k hromade zozadu
    const odkial = rezim === "dovoz" ? 28 : -28;
    if (t < T.prichod) {
      x = odkial * (1 - ease(t / T.prichod));
    } else if (t < T.prichod + T.praca) {
      const p = (t - T.prichod) / T.praca;
      if (rezim === "odvoz") plne = ease(p);
      else {
        tilt = 0.85 * ease(Math.min(1, p * 1.6));
        plne = 1 - ease(Math.min(1, Math.max(0, p * 1.4 - 0.2)));
      }
    } else if (t < T.prichod + T.praca + T.korbaDole) {
      const p = (t - T.prichod - T.praca) / T.korbaDole;
      plne = rezim === "odvoz" ? 1 : 0;
      tilt = rezim === "dovoz" ? 0.85 * (1 - ease(p)) : 0;
    } else {
      const p = (t - T.prichod - T.praca - T.korbaDole) / T.odchod;
      plne = rezim === "odvoz" ? 1 : 0;
      x = 32 * ease(p);
    }
    const dx = x - s.x;
    s.x = x;
    auto.current.position.x = x;
    const m = model.current;
    if (m) {
      // model: korba sa dvíha prednou časťou hore (rotácia okolo osi X), kolesá polomer ~0,4 m
      m.korba.rotation.x = -tilt * 0.75;
      m.naklad.scale.set(1, Math.max(0.001, plne), 1);
      m.naklad.visible = plne > 0.01;
      for (const k of m.kolesa) k.rotation.x += dx / 0.405;
    } else if (korba.current && naklad.current) {
      korba.current.rotation.z = tilt;
      naklad.current.scale.set(1, Math.max(0.001, plne), 1);
      naklad.current.visible = plne > 0.01;
      for (const k of kolesa.current) k.rotation.z -= dx / 0.62;
    }
  });

  return (
    <group {...props}>
      <group ref={auto}>
        {maModel && (
          <Suspense fallback={null}>
            <TatraModel farbaNakladu={farbaNakladu} onReady={nastavModel} />
          </Suspense>
        )}
        {maModel === false && (
        <>
        {/* rám */}
        <mesh position={[0, 1.05, 0]} castShadow>
          <boxGeometry args={[7.6, 0.35, 1.0]} />
          <meshStandardMaterial color={TMAVA} roughness={0.6} />
        </mesh>
        {/* kabína */}
        <group position={[2.85, 2.05, 0]}>
          <RoundedBox args={[1.8, 1.9, 2.45]} radius={0.22} smoothness={5} castShadow receiveShadow>
            <meshStandardMaterial color={ORANZ} roughness={0.35} metalness={0.15} />
          </RoundedBox>
          <mesh position={[0.91, 0.35, 0]}>
            <boxGeometry args={[0.02, 0.8, 2.1]} />
            <meshPhysicalMaterial color="#17232b" roughness={0.05} clearcoat={1} />
          </mesh>
          {[-1.23, 1.23].map((z) => (
            <mesh key={z} position={[0.2, 0.35, z]}>
              <boxGeometry args={[1.1, 0.75, 0.02]} />
              <meshPhysicalMaterial color="#17232b" roughness={0.05} clearcoat={1} />
            </mesh>
          ))}
          {/* nárazník a svetlá */}
          <mesh position={[0.95, -0.75, 0]} castShadow>
            <boxGeometry args={[0.2, 0.35, 2.5]} />
            <meshStandardMaterial color={TMAVA} />
          </mesh>
          {[-0.95, 0.95].map((z) => (
            <mesh key={z} position={[0.92, -0.3, z]}>
              <boxGeometry args={[0.04, 0.18, 0.35]} />
              <meshStandardMaterial color="#fff6e0" emissive="#ffd27a" emissiveIntensity={1.2} />
            </mesh>
          ))}
          <mesh position={[0, 1.0, 0]}>
            <boxGeometry args={[0.3, 0.1, 1.2]} />
            <meshStandardMaterial color="#ff9a1f" emissive="#ff7a00" emissiveIntensity={1.4} />
          </mesh>
        </group>
        {/* korba – otáča sa okolo zadnej hrany */}
        <group ref={korba} position={[-3.75, 1.3, 0]}>
          <group position={[2.35, 0, 0]}>
            <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
              <boxGeometry args={[4.7, 0.12, 2.45]} />
              <meshStandardMaterial color={SIVA} roughness={0.5} metalness={0.4} />
            </mesh>
            {[-1.2, 1.2].map((z) => (
              <mesh key={z} position={[0, 0.75, z]} castShadow>
                <boxGeometry args={[4.7, 1.35, 0.08]} />
                <meshStandardMaterial color={SIVA} roughness={0.5} metalness={0.4} />
              </mesh>
            ))}
            <mesh position={[2.33, 0.95, 0]} castShadow>
              <boxGeometry args={[0.08, 1.75, 2.45]} />
              <meshStandardMaterial color={SIVA} roughness={0.5} metalness={0.4} />
            </mesh>
            <mesh position={[-2.33, 0.6, 0]} castShadow>
              <boxGeometry args={[0.08, 1.05, 2.45]} />
              <meshStandardMaterial color={SIVA} roughness={0.5} metalness={0.4} />
            </mesh>
            {/* náklad */}
            <group ref={naklad} position={[0, 0.12, 0]}>
              <mesh scale={[2.25, 1.15, 1.15]} castShadow>
                <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color={farbaNakladu} roughness={1} />
              </mesh>
            </group>
          </group>
        </group>
        <Koleso x={2.75} z={1.0} refs={kolesa} />
        <Koleso x={2.75} z={-1.0} refs={kolesa} />
        <Koleso x={-1.35} z={1.0} refs={kolesa} />
        <Koleso x={-1.35} z={-1.0} refs={kolesa} />
        <Koleso x={-2.75} z={1.0} refs={kolesa} />
        <Koleso x={-2.75} z={-1.0} refs={kolesa} />
        </>
        )}
      </group>
    </group>
  );
}
