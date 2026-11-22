import type { Metadata } from "next";
import { Podstranka } from "@/components/podstranka";
import { Mapa } from "@/components/mapa-wrap";
import { firma } from "@/config/firma";

export const metadata: Metadata = { title: "Kde pôsobíme – Voščinár" };

export default function MapaPage() {
  return (
    <Podstranka nadpis="Kde pôsobíme" popis={`${firma.oblast.nazov} a okolie do ${firma.oblast.polomerKm} km. Ďalej po dohode.`}>
      <Mapa />
      <div className="mt-6 flex flex-wrap gap-2">
        {firma.oblast.mesta.map((m) => (
          <span key={m} className="rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-black/5">{m}</span>
        ))}
      </div>
    </Podstranka>
  );
}
