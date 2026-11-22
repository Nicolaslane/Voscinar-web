"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { bagerTypy, type BagerTyp } from "@/components/three/bager";
import { firma } from "@/config/firma";

const HeroScene = dynamic(() => import("@/components/three/hero-scene"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-[var(--bg)]" />,
});

export function Hero() {
  const [typ, setTyp] = useState<BagerTyp>("pasovy");
  return (
    <section className="relative h-dvh w-full overflow-hidden">
      <div className="absolute inset-0">
        <HeroScene typ={typ} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-end p-4 sm:p-6">
        <a
          href={`tel:${firma.telefon.replace(/\s/g, "")}`}
          className="pointer-events-auto rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-neutral-800"
        >
          Zavolať
        </a>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 px-4 pb-6">
        <p className="text-center text-sm font-medium tracking-wide text-neutral-600">{firma.podtitul} · potiahni bager a otoč si ho</p>
        <div className="pointer-events-auto flex max-w-full gap-1.5 overflow-x-auto rounded-2xl bg-white/75 p-1.5 shadow-lg ring-1 ring-black/5 backdrop-blur-md">
          {bagerTypy.map((b) => (
            <button
              key={b.id}
              onClick={() => setTyp(b.id)}
              className={`shrink-0 rounded-xl px-3.5 py-2 text-left transition ${typ === b.id ? "bg-neutral-900 text-white" : "hover:bg-black/5"}`}
            >
              <span className="block text-sm font-semibold">{b.nazov}</span>
              <span className={`block text-[11px] ${typ === b.id ? "text-white/70" : "text-neutral-500"}`}>{b.popis}</span>
            </button>
          ))}
        </div>
        <a href="#viac" className="pointer-events-auto flex flex-col items-center text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
          <span>Viac</span>
          <span className="mt-1 animate-bounce text-lg">↓</span>
        </a>
      </div>
    </section>
  );
}
