import Link from "next/link";
import { Hero } from "@/components/hero";
import { Menu } from "@/components/menu";
import { firma } from "@/config/firma";
import { sluzby } from "@/lib/sluzby";
import { Kredity } from "@/components/kredity";

const kocky = [
  {
    href: "/galeria",
    nazov: "Galéria",
    popis: "Naše výkopy, základy a terénne úpravy",
    ikona: (
      <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <circle cx="9" cy="10" r="2" />
        <path d="m21 16-5-5-9 9" />
      </svg>
    ),
  },
  {
    href: "/kontakt",
    nazov: "Kontakt",
    popis: "Zavolaj, napíš, dohodneme obhliadku",
    ikona: (
      <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
      </svg>
    ),
  },
  {
    href: "/mapa",
    nazov: "Kde pôsobíme",
    popis: `${firma.oblast.nazov} a okolie do ${firma.oblast.polomerKm} km`,
    ikona: (
      <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <main>
      <Menu />
      <Hero />

      <section id="viac" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="grid gap-6 [perspective:1200px] sm:grid-cols-3 sm:gap-8">
          {kocky.map((k) => (
            <Link key={k.href} href={k.href} className="kocka group flex aspect-square flex-col justify-between rounded-[2.5rem] p-7 sm:p-8">
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-neutral-900 shadow-md ring-1 ring-black/5 transition group-hover:text-[var(--warm)]">{k.ikona}</span>
              <span>
                <span className="block text-2xl font-bold tracking-tight">{k.nazov}</span>
                <span className="mt-1 block text-sm text-neutral-500">{k.popis}</span>
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-24">
          <h2 className="text-3xl font-bold tracking-tight">Nakonfiguruj si prácu</h2>
          <p className="mt-2 text-neutral-600">Zadaj rozmery, uvidíš výkres, objem aj cenu. Potom nám to jedným klikom pošleš.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sluzby.map((s) => (
              <Link key={s.slug} href={`/sluzby/${s.slug}`} className="group rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-lg">
                <span className="flex items-center justify-between font-semibold">
                  {s.nazov}
                  <span className="text-[var(--warm)] transition group-hover:translate-x-1">→</span>
                </span>
                <span className="mt-1 block text-sm text-neutral-500">{s.kratko}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-black/5 py-8 text-center text-sm text-neutral-500">
        © {new Date().getFullYear()} {firma.nazov} · {firma.podtitul}
        <Kredity className="mt-2" />
      </footer>
    </main>
  );
}
