import type { Metadata } from "next";
import { Podstranka } from "@/components/podstranka";

export const metadata: Metadata = { title: "Galéria – Voščinár" };

// Fotky: vlož ich do public/galeria/ a dopíš sem (súbor + popis).
const fotky: { src: string; popis: string }[] = [];

export default function Galeria() {
  return (
    <Podstranka nadpis="Galéria" popis="Ukážky našej práce – výkopy, základy, prípojky a terénne úpravy.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(fotky.length ? fotky : Array.from({ length: 6 }, (_, i) => ({ src: "", popis: `Fotka ${i + 1}` }))).map((f, i) =>
          f.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <figure key={i} className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-black/5">
              <img src={f.src} alt={f.popis} className="aspect-[4/3] w-full object-cover" />
              <figcaption className="p-4 text-sm text-neutral-600">{f.popis}</figcaption>
            </figure>
          ) : (
            <div key={i} className="grid aspect-[4/3] place-items-center rounded-[2rem] bg-gradient-to-br from-white to-neutral-200 text-sm text-neutral-400 ring-1 ring-black/5">
              Sem príde fotka zo stavby
            </div>
          ),
        )}
      </div>
    </Podstranka>
  );
}
