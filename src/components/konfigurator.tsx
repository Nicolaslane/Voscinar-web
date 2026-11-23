"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DPH, cennik } from "@/config/cennik";
import { firma } from "@/config/firma";
import { Kredity } from "@/components/kredity";
import { eur, najdiSluzbu, predvolene, type Hodnoty, type Pole } from "@/lib/sluzby";

const Scena = dynamic(() => import("@/components/three/konfigurator-scene"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-neutral-400">Kreslím…</div>,
});

function PoleFormulara({ p, h, set }: { p: Pole; h: Hodnoty; set: (k: string, v: Hodnoty[string]) => void }) {
  if (p.typ === "cislo") {
    if (p.zobrazAk && !h[p.zobrazAk]) return null;
    const v = Number(h[p.key]);
    return (
      <label className="block">
        <span className="flex items-baseline justify-between text-sm font-medium">
          {p.label}
          <span className="flex items-baseline gap-1">
            <input
              type="number"
              inputMode="decimal"
              min={p.min}
              max={p.max}
              step={p.krok}
              value={Number.isFinite(v) ? v : ""}
              onChange={(e) => set(p.key, Math.min(p.max, Math.max(0, Number(e.target.value))))}
              className="w-20 rounded-lg bg-neutral-100 px-2 py-1 text-right text-base font-semibold tabular-nums outline-none focus:ring-2 focus:ring-[var(--warm)]"
            />
            <span className="w-6 text-neutral-500">{p.jednotka}</span>
          </span>
        </span>
        <input type="range" min={p.min} max={p.max} step={p.krok} value={Math.max(p.min, v || p.min)} onChange={(e) => set(p.key, Number(e.target.value))} className="mt-2 w-full accent-neutral-900" />
      </label>
    );
  }
  if (p.typ === "vyber") {
    return (
      <label className="block">
        <span className="text-sm font-medium">{p.label}</span>
        <select value={String(h[p.key])} onChange={(e) => set(p.key, e.target.value)} className="mt-1.5 w-full rounded-xl bg-neutral-100 px-3 py-2.5 outline-none focus:ring-2 focus:ring-[var(--warm)]">
          {p.moznosti.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
    );
  }
  const on = Boolean(h[p.key]);
  return (
    <button type="button" onClick={() => set(p.key, !on)} className={`flex w-full items-center justify-between gap-3 rounded-2xl p-3.5 text-left ring-1 transition ${on ? "bg-neutral-900 text-white ring-neutral-900" : "bg-white ring-black/10 hover:ring-black/20"}`}>
      <span>
        <span className="block text-sm font-semibold">{p.label}</span>
        {p.popis && <span className={`block text-xs ${on ? "text-white/70" : "text-neutral-500"}`}>{p.popis}</span>}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-[var(--warm)]" : "bg-neutral-300"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

export function Konfigurator({ slug }: { slug: string }) {
  const s = najdiSluzbu(slug)!;
  const [h, setH] = useState<Hodnoty>(() => predvolene(s));
  const [jazda, setJazda] = useState(1);
  const [kontakt, setKontakt] = useState({ meno: "", telefon: "", miesto: "" });
  const set = (k: string, v: Hodnoty[string]) => setH((x) => ({ ...x, [k]: v }));

  const v = useMemo(() => s.vypocet(h), [s, h]);
  const medzisucet = v.riadky.reduce((a, r) => a + r.suma, 0);
  const spolu = Math.max(cennik.minimalnaZakazka, medzisucet);
  const sDph = spolu * (1 + DPH);

  const mail = useMemo(() => {
    const riadky = [
      `Dobrý deň, mám záujem o: ${s.nazov}`,
      "",
      ...s.polia
        .filter((p) => !(p.typ === "cislo" && p.zobrazAk && !h[p.zobrazAk]))
        .map((p) => `${p.label}: ${p.typ === "cislo" ? `${h[p.key]} ${p.jednotka}` : p.typ === "vyber" ? p.moznosti.find((m) => m.value === h[p.key])?.label : h[p.key] ? "áno" : "nie"}`),
      "",
      ...v.udaje.map((u) => `${u.label}: ${u.hodnota}`),
      `Orientačná cena: ${eur(spolu)} bez DPH (${eur(sDph)} s DPH)`,
      "",
      `Meno: ${kontakt.meno}`,
      `Telefón: ${kontakt.telefon}`,
      `Miesto stavby: ${kontakt.miesto}`,
    ];
    return `mailto:${firma.email}?subject=${encodeURIComponent(`Dopyt z webu: ${s.nazov}`)}&body=${encodeURIComponent(riadky.join("\n"))}`;
  }, [s, h, v, spolu, sDph, kontakt]);

  return (
    <div className="lg:grid lg:h-dvh lg:grid-cols-[minmax(360px,440px)_1fr] lg:grid-rows-1">
      {/* 3D výkres */}
      <div className="relative h-[58vh] bg-[var(--bg)] lg:order-2 lg:h-dvh">
        <Scena scena={v.scena} onJazda={setJazda} />
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-end justify-between gap-2 sm:inset-x-5 sm:bottom-5">
          <div className="flex flex-wrap gap-2">
            {v.udaje
              .filter((u) => u.zvyraznit)
              .map((u) => (
                <div key={u.label} className="rounded-2xl bg-white/90 px-4 py-2.5 shadow-lg ring-1 ring-black/5 backdrop-blur">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">{u.label}</div>
                  <div className="text-2xl font-bold tabular-nums">{u.hodnota}</div>
                </div>
              ))}
          </div>
          {v.scena.tatra && (
            <div key={v.scena.tatra.jazdy} className="animate-[pop_.5s_ease-out] rounded-2xl bg-neutral-900 px-4 py-2.5 text-white shadow-xl">
              <div className="text-[11px] font-medium uppercase tracking-wider text-white/60">Tatra sa otočí</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tabular-nums text-[var(--warm)]">{v.scena.tatra.jazdy}×</span>
                <span className="text-sm tabular-nums text-white/70">
                  jazda {Math.min(jazda, v.scena.tatra.jazdy)}/{v.scena.tatra.jazdy}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* formulár */}
      <div className="bg-[#faf9f7] px-4 pb-10 pt-6 sm:px-6 lg:order-1 lg:overflow-y-auto lg:pt-24">
        <Link href="/" className="hidden text-sm text-neutral-500 hover:text-neutral-900 lg:inline">← {firma.nazov}</Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{s.nazov}</h1>
        <p className="mt-1.5 text-sm text-neutral-600">{s.pouzitie}</p>

        <div className="mt-6 space-y-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          {s.polia.map((p) => (
            <PoleFormulara key={p.key} p={p} h={h} set={set} />
          ))}
        </div>

        <div className="mt-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <dl className="space-y-1.5 text-sm">
            {v.udaje.map((u) => (
              <div key={u.label} className="flex justify-between">
                <dt className="text-neutral-500">{u.label}</dt>
                <dd className="font-semibold tabular-nums">{u.hodnota}</dd>
              </div>
            ))}
          </dl>
          <div className="my-4 h-px bg-black/5" />
          <ul className="space-y-2 text-sm">
            {v.riadky.map((r) => (
              <li key={r.nazov} className="flex justify-between gap-3">
                <span>
                  {r.nazov}
                  {r.detail && <span className="block text-xs text-neutral-500">{r.detail}</span>}
                </span>
                <span className="tabular-nums">{eur(r.suma)}</span>
              </li>
            ))}
            {medzisucet < cennik.minimalnaZakazka && (
              <li className="flex justify-between gap-3 text-neutral-500">
                <span>Minimálna zákazka</span>
                <span className="tabular-nums">{eur(cennik.minimalnaZakazka)}</span>
              </li>
            )}
          </ul>
          <div className="mt-4 flex items-end justify-between rounded-2xl bg-neutral-900 p-4 text-white">
            <span className="text-sm text-white/70">
              Orientačne
              <span className="block text-xs">s DPH {eur(sDph)}</span>
            </span>
            <span className="text-3xl font-bold tabular-nums">{eur(spolu)}</span>
          </div>
          <p className="mt-2 text-xs text-neutral-500">Cena bez DPH je orientačná. Presnú cenu potvrdíme po obhliadke.</p>
        </div>

        <div className="mt-5 space-y-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="font-semibold">Poslať dopyt</p>
          {(["meno", "telefon", "miesto"] as const).map((k) => (
            <input
              key={k}
              value={kontakt[k]}
              onChange={(e) => setKontakt((x) => ({ ...x, [k]: e.target.value }))}
              placeholder={{ meno: "Meno", telefon: "Telefón", miesto: "Miesto stavby (obec)" }[k]}
              type={k === "telefon" ? "tel" : "text"}
              className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 outline-none focus:ring-2 focus:ring-[var(--warm)]"
            />
          ))}
          <a href={mail} className="block rounded-2xl bg-[var(--warm)] py-3.5 text-center font-semibold text-neutral-900 shadow-md transition hover:brightness-105">
            Odoslať dopyt e-mailom
          </a>
          <a href={`tel:${firma.telefon.replace(/\s/g, "")}`} className="block rounded-2xl py-2 text-center text-sm font-medium text-neutral-600 hover:text-neutral-900">
            alebo zavolaj {firma.telefon}
          </a>
        </div>
        <Kredity className="mt-6" />
      </div>
    </div>
  );
}
