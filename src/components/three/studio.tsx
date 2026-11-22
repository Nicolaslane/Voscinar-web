"use client";

import { useMemo } from "react";
import * as THREE from "three";

/** Biele fotoštúdio – podlaha plynulo prechádza do zadnej steny (bez rohu). */
export function Studio({ sirka = 90, polomer = 10, stenaZ = -12, farba = "#f4f3f1" }: { sirka?: number; polomer?: number; stenaZ?: number; farba?: string }) {
  const geo = useMemo(() => {
    const podlaha = 40; // dĺžka podlahy pred oblúkom
    const oblúk = (Math.PI / 2) * polomer;
    const stena = 40;
    const spolu = podlaha + oblúk + stena;
    const g = new THREE.PlaneGeometry(sirka, spolu, 1, 120);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      // v = 0 vpredu, spolu = hore na stene
      const v = pos.getY(i) + spolu / 2;
      let y = 0, z = 0;
      if (v <= podlaha) {
        y = 0;
        z = stenaZ + polomer + (podlaha - v);
      } else if (v <= podlaha + oblúk) {
        const a = (v - podlaha) / polomer;
        y = polomer - Math.cos(a) * polomer;
        z = stenaZ + polomer - Math.sin(a) * polomer;
      } else {
        y = polomer + (v - podlaha - oblúk);
        z = stenaZ;
      }
      pos.setXYZ(i, pos.getX(i), y, z);
    }
    g.computeVertexNormals();
    return g;
  }, [sirka, polomer, stenaZ]);

  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial color={farba} roughness={0.92} metalness={0} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** Mäkká teplá žiara (radiálny prechod), napr. za nápisom. */
export function Ziara({ farba = "#ffb35c", sila = 1, ...props }: { farba?: string; sila?: number } & React.ComponentProps<"mesh">) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const x = c.getContext("2d")!;
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <mesh {...props}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} color={farba} transparent opacity={sila} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
