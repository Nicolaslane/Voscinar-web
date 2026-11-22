"use client";

import { useEffect, useMemo, useState } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

/**
 * Skutočný 3D model (GLB) – napr. kúpený model alebo sken vlastného bagra z iPhonu.
 * Model sa sám zmenší na ~dĺžku `dlzka` metrov, postaví na zem a vycentruje.
 */
export function ModelBagra({ url, dlzka = 9.5, ...props }: { url: string; dlzka?: number } & React.ComponentProps<"group">) {
  const { scene } = useGLTF(url);
  const { obj, mierka, posun } = useMemo(() => {
    const obj = scene.clone(true);
    obj.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    const box = new THREE.Box3().setFromObject(obj);
    const v = box.getSize(new THREE.Vector3());
    const mierka = dlzka / Math.max(v.x, v.z);
    const c = box.getCenter(new THREE.Vector3());
    return { obj, mierka, posun: new THREE.Vector3(-c.x, -box.min.y, -c.z) };
  }, [scene, dlzka]);
  return (
    <group {...props}>
      <group scale={mierka}>
        <primitive object={obj} position={posun} />
      </group>
    </group>
  );
}

/** Zistí, či v public/models/ je súbor modelu (napr. pasovy.glb). */
export function useExistujeModel(url: string) {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    let zrusene = false;
    fetch(url, { method: "HEAD" })
      .then((r) => !zrusene && setOk(r.ok && !(r.headers.get("content-type") ?? "").includes("text/html")))
      .catch(() => !zrusene && setOk(false));
    return () => {
      zrusene = true;
    };
  }, [url]);
  return ok;
}
