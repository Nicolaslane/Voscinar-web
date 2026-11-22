import type { Metadata } from "next";
import Link from "next/link";
import { Podstranka } from "@/components/podstranka";
import { firma } from "@/config/firma";

export const metadata: Metadata = { title: "Kontakt – Voščinár" };

export default function Kontakt() {
  const tel = firma.telefon.replace(/\s/g, "");
  return (
    <Podstranka nadpis="Kontakt" popis="Zavolaj alebo napíš – dohodneme obhliadku a presnú cenu.">
      <div className="grid gap-4 sm:grid-cols-3">
        <a href={`tel:${tel}`} className="kocka rounded-[2rem] p-7">
          <span className="text-sm text-neutral-500">Telefón</span>
          <span className="mt-2 block text-2xl font-bold">{firma.telefon}</span>
        </a>
        <a href={`mailto:${firma.email}`} className="kocka rounded-[2rem] p-7">
          <span className="text-sm text-neutral-500">E-mail</span>
          <span className="mt-2 block break-all text-2xl font-bold">{firma.email}</span>
        </a>
        <a href={`https://wa.me/${tel.replace("+", "")}`} className="kocka rounded-[2rem] p-7">
          <span className="text-sm text-neutral-500">WhatsApp</span>
          <span className="mt-2 block text-2xl font-bold">Napísať správu</span>
        </a>
      </div>
      <div className="mt-8 rounded-[2rem] bg-white p-7 text-neutral-600 shadow-sm ring-1 ring-black/5">
        <p className="font-semibold text-neutral-900">{firma.nazov} – {firma.podtitul}</p>
        <p>{firma.adresa}</p>
        {firma.ico && <p>IČO: {firma.ico}</p>}
        <p className="mt-4">
          Chceš vedieť cenu hneď? <Link href="/sluzby/vykop-jamy" className="font-semibold text-neutral-900 underline decoration-[var(--warm)] decoration-2 underline-offset-4">Vyskúšaj konfigurátor</Link>.
        </p>
      </div>
    </Podstranka>
  );
}
