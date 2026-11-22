"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitImpl } from "three-stdlib";
import type { Scena } from "@/lib/sluzby";
import { fmt } from "@/lib/sluzby";
import { Bager } from "./bager";
import { Tatra } from "./tatra";

type P2 = [number, number]; // (x, z)
const rect = (L: number, W: number, cx = 0, cz = 0): P2[] => [
  [cx - L / 2, cz - W / 2],
  [cx + L / 2, cz - W / 2],
  [cx + L / 2, cz + W / 2],
  [cx - L / 2, cz + W / 2],
];

// vrstvy zeminy v stene (podiel hĺbky → farba)
const VRSTVY: [number, string][] = [
  [0, "#3f2f22"],
  [0.12, "#5a4330"],
  [0.18, "#8a6440"],
  [0.55, "#9b7a52"],
  [0.8, "#8c6b45"],
  [1, "#6f5437"],
];

function steny(horne: P2[], dolne: P2[], D: number) {
  const pos: number[] = [], col: number[] = [];
  const c = new THREE.Color();
  for (let i = 0; i < horne.length; i++) {
    const j = (i + 1) % horne.length;
    for (let k = 0; k < VRSTVY.length - 1; k++) {
      const [f0, c0] = VRSTVY[k], [f1, c1] = VRSTVY[k + 1];
      const bod = (p: P2, q: P2, f: number) => [p[0] + (q[0] - p[0]) * f, -D * f, p[1] + (q[1] - p[1]) * f];
      const a = bod(horne[i], dolne[i], f0), b = bod(horne[j], dolne[j], f0);
      const a2 = bod(horne[i], dolne[i], f1), b2 = bod(horne[j], dolne[j], f1);
      pos.push(...a, ...b, ...b2, ...a, ...b2, ...a2);
      const ca = c.set(c0).toArray(), cb = new THREE.Color(c1).toArray();
      col.push(...ca, ...ca, ...cb, ...ca, ...cb, ...cb);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

const tvar = (p: P2[]) => new THREE.Shape(p.map(([x, z]) => new THREE.Vector2(x, -z)));
const otvor = (p: P2[]) => new THREE.Path(p.map(([x, z]) => new THREE.Vector2(x, -z)));

function Teren({ velkost, otvory, ostrovy = [] }: { velkost: number; otvory: P2[][]; ostrovy?: P2[][] }) {
  const geo = useMemo(() => {
    const s = tvar(rect(velkost, velkost));
    otvory.forEach((o) => s.holes.push(otvor(o)));
    const tvary = [s, ...ostrovy.map(tvar)];
    const g = new THREE.ExtrudeGeometry(tvary, { depth: 0.25, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    g.translate(0, -0.25, 0);
    return g;
  }, [velkost, otvory, ostrovy]);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial color="#ebe6dc" roughness={0.95} />
    </mesh>
  );
}

function Dno({ obrys, diera, D }: { obrys: P2[]; diera?: P2[]; D: number }) {
  const geo = useMemo(() => {
    const s = tvar(obrys);
    if (diera) s.holes.push(otvor(diera));
    const g = new THREE.ShapeGeometry(s);
    g.rotateX(-Math.PI / 2);
    g.translate(0, -D, 0);
    return g;
  }, [obrys, diera, D]);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial color="#6a5034" roughness={1} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Steny({ horne, dolne, D }: { horne: P2[]; dolne: P2[]; D: number }) {
  const geo = useMemo(() => steny(horne, dolne, D), [horne, dolne, D]);
  return (
    <mesh geometry={geo} receiveShadow castShadow>
      <meshStandardMaterial vertexColors roughness={1} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** Štítok s textom – vždy otočený ku kamere a rovnako veľký na obrazovke. */
function Stitok({ text, position }: { text: string; position: [number, number, number] }) {
  const { tex, pomer } = useMemo(() => {
    const dpr = 3, fs = 26 * dpr, padX = 22 * dpr, h = 48 * dpr;
    const c = document.createElement("canvas");
    const x = c.getContext("2d")!;
    const font = `600 ${fs}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    x.font = font;
    const w = Math.ceil(x.measureText(text).width + padX * 2);
    c.width = w + 12 * dpr;
    c.height = h + 12 * dpr;
    x.font = font;
    x.shadowColor = "rgba(0,0,0,0.18)";
    x.shadowBlur = 6 * dpr;
    x.shadowOffsetY = 2 * dpr;
    x.fillStyle = "#ffffff";
    x.beginPath();
    x.roundRect(6 * dpr, 4 * dpr, w, h, h / 2);
    x.fill();
    x.shadowColor = "transparent";
    x.fillStyle = "#161616";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(text, 6 * dpr + w / 2, 4 * dpr + h / 2 + dpr);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return { tex: t, pomer: c.width / c.height };
  }, [text]);
  const v = 0.03;
  return (
    <sprite position={position} scale={[v * pomer, v, 1]} renderOrder={10}>
      <spriteMaterial map={tex} sizeAttenuation={false} depthTest={false} transparent toneMapped={false} />
    </sprite>
  );
}

function Kota({ a, b, text, farba = "#111" }: { a: [number, number, number]; b: [number, number, number]; text: string; farba?: string }) {
  const mid: [number, number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  return (
    <group>
      <Line points={[a, b]} color={farba} lineWidth={1.5} />
      <Stitok position={mid} text={text} />
    </group>
  );
}

function Kopa({ objem, poloha, farba = "#7a5232" }: { objem: number; poloha: [number, number, number]; farba?: string }) {
  // kužeľ so sklonom ~35°: V = π r² h / 3, h = 0,7 r
  const r = Math.cbrt(objem / ((Math.PI * 0.7) / 3));
  const h = 0.7 * r;
  return (
    <mesh position={[poloha[0], h / 2, poloha[2]]} castShadow receiveShadow>
      <coneGeometry args={[r, h, 40, 1]} />
      <meshStandardMaterial color={farba} roughness={1} flatShading />
    </mesh>
  );
}

function Kamera({ R, ciel }: { R: number; ciel: [number, number, number] }) {
  const { camera, controls } = useThree();
  const cielPoz = useRef(new THREE.Vector3());
  const cielBod = useRef(new THREE.Vector3());
  const anim = useRef(1.2);
  useEffect(() => {
    cielPoz.current.set(ciel[0] + R * 0.95, R * 0.85, ciel[2] + R * 1.15);
    cielBod.current.set(...ciel);
    anim.current = 1.2;
  }, [R, ciel]);
  useFrame((_, dt) => {
    if (anim.current <= 0) return;
    anim.current -= dt;
    const k = 1 - Math.pow(0.02, dt);
    camera.position.lerp(cielPoz.current, k);
    const c = controls as unknown as OrbitImpl | null;
    if (c) {
      c.target.lerp(cielBod.current, k);
      c.update();
    }
  });
  return null;
}

export default function KonfiguratorScene({ scena, onJazda }: { scena: Scena; onJazda?: (n: number) => void }) {
  const j = scena.jama;

  // rozmery celej scény
  let sirkaX = 6, sirkaZ = 6;
  if (j?.tvar === "obdlznik") { sirkaX = j.L + 2 * j.svah; sirkaZ = j.W + 2 * j.svah; }
  if (j?.tvar === "pasy") { sirkaX = j.L; sirkaZ = j.W; }
  if (j?.tvar === "ryha") { sirkaX = j.L; sirkaZ = Math.max(j.b, 2); }
  if (scena.plocha) { sirkaX = scena.plocha.L; sirkaZ = scena.plocha.W; }
  const kopaR = scena.kopa ? Math.cbrt(scena.kopa / ((Math.PI * 0.7) / 3)) : 0;
  const tatraZ = -(sirkaZ / 2 + 3.6);
  const kopaPoloha: [number, number, number] = j || scena.plocha ? [0, 0, -(sirkaZ / 2 + kopaR + 1.5)] : [0, 0, 0];
  const R = Math.max(11, Math.max(sirkaX, sirkaZ) * 1.05 + (scena.tatra ? 6 : 0) + kopaR * 0.8);
  const velkost = Math.max(80, R * 6);

  const malyBager = (j?.tvar === "ryha" && j.b < 0.8) || sirkaX * sirkaZ < 20 || (j && j.D < 1);

  const pit = useMemo(() => {
    if (!j) return null;
    if (j.tvar === "obdlznik") {
      const top = rect(j.L + 2 * j.svah, j.W + 2 * j.svah), bot = rect(j.L, j.W);
      return { otvory: [top], ostrovy: [], steny: [{ h: top, d: bot }], dno: { obrys: bot }, D: j.D };
    }
    if (j.tvar === "ryha") {
      const r = rect(j.L, j.b);
      return { otvory: [r], ostrovy: [], steny: [{ h: r, d: r }], dno: { obrys: r }, D: j.D };
    }
    const von = rect(j.L, j.W), dnu = rect(j.L - 2 * j.b, j.W - 2 * j.b);
    return { otvory: [von], ostrovy: [dnu], steny: [{ h: von, d: von }, { h: dnu, d: dnu }], dno: { obrys: von, diera: dnu }, D: j.D };
  }, [j]);

  const cielZ = (j || scena.plocha) && (scena.tatra || kopaR) ? -Math.max(2, kopaR * 0.7) : 0;
  const ciel = useMemo<[number, number, number]>(() => [0, 0, cielZ], [cielZ]);

  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [R, R * 0.85, R * 1.2], fov: 40, near: 0.1, far: 500 }}>
      <color attach="background" args={["#f4f3f1"]} />
      <fog attach="fog" args={["#f4f3f1", R * 3, R * 6]} />
      <hemisphereLight args={["#ffffff", "#ddd6cc", 0.9]} />
      <directionalLight
        position={[R * 0.6, R * 1.4, R * 0.8]}
        intensity={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-R * 1.5}
        shadow-camera-right={R * 1.5}
        shadow-camera-top={R * 1.5}
        shadow-camera-bottom={-R * 1.5}
        shadow-bias={-0.0005}
      />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2} position={[0, 10, 5]} scale={[12, 4, 1]} rotation-x={Math.PI / 2.5} />
        <Lightformer form="rect" intensity={1} position={[-8, 3, 2]} scale={[4, 6, 1]} rotation-y={Math.PI / 2} />
      </Environment>

      {pit ? (
        <>
          <Teren velkost={velkost} otvory={pit.otvory} ostrovy={pit.ostrovy} />
          {pit.steny.map((s, i) => (
            <Steny key={i} horne={s.h} dolne={s.d} D={pit.D} />
          ))}
          <Dno obrys={pit.dno.obrys} diera={pit.dno.diera} D={pit.D} />
        </>
      ) : (
        <Teren velkost={velkost} otvory={[]} />
      )}

      {/* kóty */}
      {j?.tvar === "obdlznik" && (
        <>
          <Kota a={[-sirkaX / 2, 0.05, sirkaZ / 2 + 0.8]} b={[sirkaX / 2, 0.05, sirkaZ / 2 + 0.8]} text={`${fmt(j.L)} m`} />
          <Kota a={[-sirkaX / 2 - 0.8, 0.05, -sirkaZ / 2]} b={[-sirkaX / 2 - 0.8, 0.05, sirkaZ / 2]} text={`${fmt(j.W)} m`} />
          <Kota a={[j.L / 2, 0, -j.W / 2]} b={[j.L / 2, -j.D, -j.W / 2]} text={`hĺbka ${fmt(j.D, 2)} m`} />
        </>
      )}
      {j?.tvar === "pasy" && (
        <>
          <Kota a={[-j.L / 2, 0.05, j.W / 2 + 0.8]} b={[j.L / 2, 0.05, j.W / 2 + 0.8]} text={`${fmt(j.L)} m`} />
          <Kota a={[-j.L / 2 - 0.8, 0.05, -j.W / 2]} b={[-j.L / 2 - 0.8, 0.05, j.W / 2]} text={`${fmt(j.W)} m`} />
          <Kota a={[j.L / 2, 0, 0]} b={[j.L / 2, -j.D, 0]} text={`pás ${fmt(j.b, 2)} × ${fmt(j.D, 2)} m`} />
        </>
      )}
      {j?.tvar === "ryha" && (
        <>
          <Kota a={[-j.L / 2, 0.05, j.b / 2 + 0.8]} b={[j.L / 2, 0.05, j.b / 2 + 0.8]} text={`${fmt(j.L)} m`} />
          <Kota a={[j.L / 2, 0, -j.b / 2]} b={[j.L / 2, -j.D, -j.b / 2]} text={`${fmt(j.b, 2)} × ${fmt(j.D, 2)} m`} />
        </>
      )}

      {scena.plocha && (
        <group>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} receiveShadow>
            <planeGeometry args={[scena.plocha.L, scena.plocha.W]} />
            <meshStandardMaterial color={scena.plocha.hutnenie ? "#b9ab95" : "#a68b68"} roughness={1} />
          </mesh>
          {scena.plocha.hutnenie &&
            Array.from({ length: Math.min(40, Math.floor(scena.plocha.W / 1.2)) }, (_, i) => (
              <mesh key={i} rotation-x={-Math.PI / 2} position={[0, 0.03, -scena.plocha!.W / 2 + 0.6 + i * 1.2]}>
                <planeGeometry args={[scena.plocha!.L, 0.5]} />
                <meshStandardMaterial color="#c9bda9" roughness={1} />
              </mesh>
            ))}
          <Kota a={[-scena.plocha.L / 2, 0.05, scena.plocha.W / 2 + 0.8]} b={[scena.plocha.L / 2, 0.05, scena.plocha.W / 2 + 0.8]} text={`${fmt(scena.plocha.L)} m`} />
          <Kota a={[-scena.plocha.L / 2 - 0.8, 0.05, -scena.plocha.W / 2]} b={[-scena.plocha.L / 2 - 0.8, 0.05, scena.plocha.W / 2]} text={`${fmt(scena.plocha.W)} m`} />
        </group>
      )}

      {scena.kopa ? <Kopa objem={scena.kopa} poloha={kopaPoloha} farba={scena.tatra?.rezim === "dovoz" ? scena.tatra.farbaNakladu : "#7a5232"} /> : null}

      {scena.bager && (
        <Bager
          typ={malyBager ? "mini" : "pasovy"}
          rychlost={0.9}
          position={j || scena.plocha ? [-sirkaX / 2 - (malyBager ? 2.2 : 4.2), 0, 0] : [kopaPoloha[0] - kopaR - 4.5, 0, kopaPoloha[2]]}
        />
      )}

      {scena.tatra && (
        <Tatra
          key={`${scena.tatra.rezim}${scena.tatra.jazdy}`}
          rezim={scena.tatra.rezim}
          jazdy={scena.tatra.jazdy}
          farbaNakladu={scena.tatra.farbaNakladu}
          onJazda={onJazda}
          position={j || scena.plocha ? [0, 0, tatraZ] : scena.tatra.rezim === "dovoz" ? [0, 0, -(kopaR + 4.3)] : [-kopaR - 2, 0, -(kopaR + 3.8)]}
          rotation-y={scena.tatra.rezim === "dovoz" && !(j || scena.plocha) ? Math.PI / 2 : 0}
        />
      )}

      <OrbitControls makeDefault enableDamping maxPolarAngle={Math.PI / 2.15} minDistance={4} maxDistance={R * 4} />
      <Kamera R={R} ciel={ciel} />
    </Canvas>
  );
}
