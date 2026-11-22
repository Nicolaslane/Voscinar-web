"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { sluzby } from "@/lib/sluzby";
import { firma } from "@/config/firma";

/** Tri čiarky vľavo hore → zoznam služieb. */
export function Menu({ svetle = false }: { svetle?: boolean }) {
  const [otvorene, setOtvorene] = useState(false);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOtvorene(false);
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, []);

  return (
    <>
      <button
        aria-label="Služby"
        onClick={() => setOtvorene(true)}
        className={`fixed left-4 top-4 z-40 grid h-12 w-12 place-items-center rounded-2xl backdrop-blur-md transition hover:scale-105 sm:left-6 sm:top-6 ${svetle ? "bg-white/70 shadow-lg ring-1 ring-black/5" : "bg-white/60 ring-1 ring-black/5"}`}
      >
        <span className="flex w-5 flex-col gap-[5px]">
          <span className="h-[2px] rounded bg-neutral-900" />
          <span className="h-[2px] rounded bg-neutral-900" />
          <span className="h-[2px] rounded bg-neutral-900" />
        </span>
      </button>

      <div className={`fixed inset-0 z-50 transition ${otvorene ? "pointer-events-auto" : "pointer-events-none"}`}>
        <div onClick={() => setOtvorene(false)} className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${otvorene ? "opacity-100" : "opacity-0"}`} />
        <nav
          className={`absolute left-0 top-0 flex h-full w-[min(380px,88vw)] flex-col bg-[#faf9f7] p-6 transition-[translate,box-shadow] duration-300 ease-out ${otvorene ? "translate-x-0 shadow-2xl" : "-translate-x-full shadow-none"}`}
        >
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" onClick={() => setOtvorene(false)} className="text-xl font-bold tracking-tight">
              {firma.nazov}
            </Link>
            <button aria-label="Zavrieť" onClick={() => setOtvorene(false)} className="grid h-10 w-10 place-items-center rounded-xl text-2xl hover:bg-black/5">
              ×
            </button>
          </div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Služby – nakonfiguruj si</p>
          <ul className="flex flex-col gap-2">
            {sluzby.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/sluzby/${s.slug}`}
                  onClick={() => setOtvorene(false)}
                  className="group flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span>
                    <span className="block font-semibold">{s.nazov}</span>
                    <span className="block text-sm text-neutral-500">{s.kratko}</span>
                  </span>
                  <span className="text-[var(--warm)] transition group-hover:translate-x-1">→</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto space-y-1 pt-6 text-sm text-neutral-600">
            <a href={`tel:${firma.telefon.replace(/\s/g, "")}`} className="block font-semibold text-neutral-900">{firma.telefon}</a>
            <a href={`mailto:${firma.email}`} className="block">{firma.email}</a>
          </div>
        </nav>
      </div>
    </>
  );
}
