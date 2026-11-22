import { cennik } from "@/config/cennik";

// ---------- polia formulára ----------
export type Pole =
  | { key: string; typ: "cislo"; label: string; jednotka: string; min: number; max: number; krok: number; predvolene: number; zobrazAk?: string }
  | { key: string; typ: "vyber"; label: string; moznosti: { value: string; label: string }[]; predvolene: string }
  | { key: string; typ: "prepinac"; label: string; popis?: string; predvolene: boolean };

export type Hodnoty = Record<string, number | string | boolean>;

// ---------- čo sa nakreslí ----------
export type Scena = {
  jama?: { tvar: "obdlznik"; L: number; W: number; D: number; svah: number } // svah = o koľko m je horná hrana širšia na každej strane
    | { tvar: "pasy"; L: number; W: number; b: number; D: number }
    | { tvar: "ryha"; L: number; b: number; D: number };
  plocha?: { L: number; W: number; hutnenie: boolean };
  kopa?: number; // m³ zeminy, ktorá ostáva na pozemku
  tatra?: { jazdy: number; rezim: "odvoz" | "dovoz"; farbaNakladu: string };
  bager?: boolean;
};

export type Riadok = { nazov: string; detail?: string; suma: number };
export type Vysledok = {
  scena: Scena;
  udaje: { label: string; hodnota: string; zvyraznit?: boolean }[];
  riadky: Riadok[];
};

export type Sluzba = {
  slug: string;
  nazov: string;
  kratko: string;
  pouzitie: string;
  polia: Pole[];
  vypocet: (h: Hodnoty) => Vysledok;
};

const num = (h: Hodnoty, k: string) => Number(h[k]) || 0;
export const fmt = (n: number, d = 1) => n.toLocaleString("sk-SK", { maximumFractionDigits: d, minimumFractionDigits: 0 });
export const eur = (n: number) => n.toLocaleString("sk-SK", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

const zeminy = Object.entries(cennik.vykop).map(([value, z]) => ({ value, label: `${z.nazov} – ${z.cena} €/m³` }));
const zeminaPole: Pole = { key: "zemina", typ: "vyber", label: "Druh zeminy", moznosti: zeminy, predvolene: "stredna" };
const odvozPolia: Pole[] = [
  { key: "odvoz", typ: "prepinac", label: "Odvoz zeminy", popis: "Pristavíme Tatru a zeminu odvezieme", predvolene: false },
  { key: "km", typ: "cislo", label: "Vzdialenosť na skládku", jednotka: "km", min: 1, max: 80, krok: 1, predvolene: 10, zobrazAk: "odvoz" },
];

// odvoz: koľko jázd a za koľko
function odvoz(objem: number, km: number) {
  const naKorbe = objem * cennik.nakyprenie;
  const jazdy = Math.max(1, Math.ceil(naKorbe / cennik.tatraM3));
  const doprava = jazdy * (cennik.jazda + km * 2 * cennik.jazdaKm);
  const skladka = naKorbe * cennik.skladkaM3;
  return { naKorbe, jazdy, doprava, skladka };
}

function vykopSOdvozom(h: Hodnoty, objem: number, priplatok: number, nazovPrace: string, scena: Scena): Vysledok {
  const z = cennik.vykop[(h.zemina as keyof typeof cennik.vykop) ?? "stredna"] ?? cennik.vykop.stredna;
  const riadky: Riadok[] = [
    { nazov: nazovPrace, detail: `${fmt(objem)} m³ × ${fmt(z.cena * priplatok, 2)} €`, suma: objem * z.cena * priplatok },
    { nazov: "Presun techniky", suma: cennik.presunTechniky },
  ];
  const udaje: Vysledok["udaje"] = [{ label: "Vykopaná zemina", hodnota: `${fmt(objem)} m³`, zvyraznit: true }];
  if (h.odvoz) {
    const o = odvoz(objem, num(h, "km"));
    riadky.push(
      { nazov: "Odvoz Tatrou", detail: `${o.jazdy} × jazda, ${num(h, "km")} km`, suma: o.doprava },
      { nazov: "Uloženie na skládke", detail: `${fmt(o.naKorbe)} m³ nakyprenej zeminy`, suma: o.skladka },
    );
    udaje.push({ label: "Na korbe (nakyprená)", hodnota: `${fmt(o.naKorbe)} m³` }, { label: "Jazdy Tatrou", hodnota: `${o.jazdy}×`, zvyraznit: true });
    scena.tatra = { jazdy: o.jazdy, rezim: "odvoz", farbaNakladu: "#7a5232" };
  } else {
    scena.kopa = objem * cennik.nakyprenie;
    udaje.push({ label: "Zemina ostáva na pozemku", hodnota: `${fmt(objem * cennik.nakyprenie)} m³` });
  }
  return { scena, udaje, riadky };
}

export const sluzby: Sluzba[] = [
  {
    slug: "vykop-jamy",
    nazov: "Výkop jamy",
    kratko: "Pivnica, bazén, žumpa, jazierko",
    pouzitie: "Zadaj rozmery jamy – hneď uvidíš, ako bude vyzerať, koľko zeminy sa vykope a koľko to bude stáť.",
    polia: [
      { key: "L", typ: "cislo", label: "Dĺžka", jednotka: "m", min: 1, max: 40, krok: 0.5, predvolene: 8 },
      { key: "W", typ: "cislo", label: "Šírka", jednotka: "m", min: 1, max: 30, krok: 0.5, predvolene: 4 },
      { key: "D", typ: "cislo", label: "Hĺbka", jednotka: "m", min: 0.3, max: 6, krok: 0.1, predvolene: 1.8 },
      { key: "svah", typ: "prepinac", label: "Šikmé steny (svah)", popis: "Bezpečnejšie pri hlbších jamách – steny 1 : 1", predvolene: false },
      zeminaPole,
      ...odvozPolia,
    ],
    vypocet(h) {
      const L = num(h, "L"), W = num(h, "W"), D = num(h, "D");
      const s = h.svah ? D : 0;
      // objem zrezaného ihlana (prizmatoid)
      const A1 = L * W, A2 = (L + 2 * s) * (W + 2 * s), Am = (L + s) * (W + s);
      const objem = (D / 6) * (A1 + 4 * Am + A2);
      return vykopSOdvozom(h, objem, 1, "Strojný výkop jamy", { jama: { tvar: "obdlznik", L, W, D, svah: s }, bager: true });
    },
  },
  {
    slug: "vykop-zakladov",
    nazov: "Výkop základov",
    kratko: "Základové pásy pre dom, garáž, plot",
    pouzitie: "Zadaj vonkajšie rozmery stavby a profil pásu – nakreslíme obvodové pásy a spočítame objem.",
    polia: [
      { key: "L", typ: "cislo", label: "Dĺžka stavby", jednotka: "m", min: 3, max: 40, krok: 0.5, predvolene: 12 },
      { key: "W", typ: "cislo", label: "Šírka stavby", jednotka: "m", min: 3, max: 30, krok: 0.5, predvolene: 9 },
      { key: "b", typ: "cislo", label: "Šírka pásu", jednotka: "m", min: 0.3, max: 1.2, krok: 0.05, predvolene: 0.6 },
      { key: "D", typ: "cislo", label: "Hĺbka pásu", jednotka: "m", min: 0.4, max: 2, krok: 0.05, predvolene: 1.2 },
      zeminaPole,
      ...odvozPolia,
    ],
    vypocet(h) {
      const L = num(h, "L"), W = num(h, "W"), b = Math.min(num(h, "b"), Math.min(L, W) / 3), D = num(h, "D");
      const objem = (L * W - (L - 2 * b) * (W - 2 * b)) * D;
      const v = vykopSOdvozom(h, objem, cennik.zakladyPriplatok, "Výkop základových pásov", { jama: { tvar: "pasy", L, W, b, D }, bager: true });
      v.udaje.splice(1, 0, { label: "Dĺžka pásov (os)", hodnota: `${fmt(2 * (L + W) - 4 * b)} m` });
      return v;
    },
  },
  {
    slug: "vykop-ryhy",
    nazov: "Výkop ryhy",
    kratko: "Prípojky vody, kanalizácie, elektriky",
    pouzitie: "Dĺžka, šírka a hĺbka ryhy – uvidíš ju na pozemku aj s cenou.",
    polia: [
      { key: "L", typ: "cislo", label: "Dĺžka ryhy", jednotka: "m", min: 1, max: 150, krok: 1, predvolene: 25 },
      { key: "b", typ: "cislo", label: "Šírka", jednotka: "m", min: 0.2, max: 1.5, krok: 0.05, predvolene: 0.5 },
      { key: "D", typ: "cislo", label: "Hĺbka", jednotka: "m", min: 0.3, max: 3, krok: 0.05, predvolene: 1.2 },
      zeminaPole,
      { key: "zasyp", typ: "prepinac", label: "Zasypanie ryhy", popis: "Po uložení potrubia ryhu zasypeme a zhutníme", predvolene: true },
      ...odvozPolia,
    ],
    vypocet(h) {
      const L = num(h, "L"), b = num(h, "b"), D = num(h, "D");
      const objem = L * b * D;
      const v = vykopSOdvozom(h, objem, cennik.ryhaPriplatok, "Výkop ryhy", { jama: { tvar: "ryha", L, b, D }, bager: true });
      if (h.zasyp) v.riadky.splice(1, 0, { nazov: "Zásyp a zhutnenie", detail: `${fmt(objem)} m³`, suma: objem * 6 });
      return v;
    },
  },
  {
    slug: "odvoz-zeminy",
    nazov: "Odvoz zeminy",
    kratko: "Odvezieme zeminu, sutinu, výkopok",
    pouzitie: "Koľko zeminy treba odviezť a ako ďaleko – spočítame, koľkokrát sa Tatra otočí.",
    polia: [
      { key: "V", typ: "cislo", label: "Objem zeminy (v zemi)", jednotka: "m³", min: 1, max: 1000, krok: 1, predvolene: 45 },
      { key: "km", typ: "cislo", label: "Vzdialenosť na skládku", jednotka: "km", min: 1, max: 80, krok: 1, predvolene: 10 },
      { key: "nakladka", typ: "prepinac", label: "Naloženie bagrom", popis: "Zeminu na kope naložíme naším bagrom", predvolene: true },
    ],
    vypocet(h) {
      const V = num(h, "V"), km = num(h, "km");
      const o = odvoz(V, km);
      const riadky: Riadok[] = [
        { nazov: "Odvoz Tatrou", detail: `${o.jazdy} × jazda, ${km} km`, suma: o.doprava },
        { nazov: "Uloženie na skládke", detail: `${fmt(o.naKorbe)} m³`, suma: o.skladka },
      ];
      if (h.nakladka) riadky.push({ nazov: "Naloženie bagrom", detail: `${fmt(V)} m³ × 3 €`, suma: V * 3 }, { nazov: "Presun techniky", suma: cennik.presunTechniky });
      return {
        scena: { kopa: o.naKorbe, tatra: { jazdy: o.jazdy, rezim: "odvoz", farbaNakladu: "#7a5232" }, bager: Boolean(h.nakladka) },
        udaje: [
          { label: "Na korbe (nakyprená)", hodnota: `${fmt(o.naKorbe)} m³` },
          { label: "Jazdy Tatrou", hodnota: `${o.jazdy}×`, zvyraznit: true },
          { label: "Najazdené km", hodnota: `${fmt(o.jazdy * km * 2, 0)} km` },
        ],
        riadky,
      };
    },
  },
  {
    slug: "dovoz-materialu",
    nazov: "Dovoz materiálu",
    kratko: "Štrk, piesok, kamenivo, ornica",
    pouzitie: "Vyber materiál a množstvo – privezieme ho Tatrou a vysypeme, kam potrebuješ.",
    polia: [
      { key: "mat", typ: "vyber", label: "Materiál", moznosti: Object.entries(cennik.material).map(([value, m]) => ({ value, label: `${m.nazov} – ${m.cena} €/t` })), predvolene: "strk" },
      { key: "V", typ: "cislo", label: "Množstvo", jednotka: "m³", min: 1, max: 300, krok: 1, predvolene: 12 },
      { key: "km", typ: "cislo", label: "Vzdialenosť k vám", jednotka: "km", min: 1, max: 80, krok: 1, predvolene: 15 },
      { key: "rozhrnutie", typ: "prepinac", label: "Rozhrnutie bagrom", popis: "Materiál po vysypaní rozhrnieme", predvolene: false },
    ],
    vypocet(h) {
      const m = cennik.material[(h.mat as keyof typeof cennik.material) ?? "strk"] ?? cennik.material.strk;
      const V = num(h, "V"), km = num(h, "km");
      const t = V * m.hustota;
      const jazdy = Math.max(1, Math.ceil(t / cennik.tatraT));
      const riadky: Riadok[] = [
        { nazov: m.nazov, detail: `${fmt(t)} t × ${m.cena} €`, suma: t * m.cena },
        { nazov: "Doprava Tatrou", detail: `${jazdy} × jazda, ${km} km`, suma: jazdy * (cennik.jazda + km * 2 * cennik.jazdaKm) },
      ];
      if (h.rozhrnutie) riadky.push({ nazov: "Rozhrnutie bagrom", detail: `${fmt(V)} m³ × 4 €`, suma: V * 4 }, { nazov: "Presun techniky", suma: cennik.presunTechniky });
      const farba = { strk: "#a8a29e", piesok: "#e8c98a", kamenivo: "#8b8680", ornica: "#4a3424" }[h.mat as string] ?? "#a8a29e";
      return {
        scena: { kopa: V, tatra: { jazdy, rezim: "dovoz", farbaNakladu: farba }, bager: Boolean(h.rozhrnutie) },
        udaje: [
          { label: "Hmotnosť", hodnota: `${fmt(t)} t` },
          { label: "Jazdy Tatrou", hodnota: `${jazdy}×`, zvyraznit: true },
        ],
        riadky,
      };
    },
  },
  {
    slug: "uprava-terenu",
    nazov: "Úprava terénu",
    kratko: "Planírovanie, zarovnanie, hutnenie",
    pouzitie: "Zadaj rozmery plochy – zarovnáme ju pod trávnik, dlažbu alebo základovú dosku.",
    polia: [
      { key: "L", typ: "cislo", label: "Dĺžka plochy", jednotka: "m", min: 2, max: 100, krok: 1, predvolene: 20 },
      { key: "W", typ: "cislo", label: "Šírka plochy", jednotka: "m", min: 2, max: 100, krok: 1, predvolene: 15 },
      { key: "hutnenie", typ: "prepinac", label: "Hutnenie", popis: "Zhutnenie vibračnou doskou / valcom", predvolene: false },
    ],
    vypocet(h) {
      const L = num(h, "L"), W = num(h, "W");
      const A = L * W;
      const riadky: Riadok[] = [
        { nazov: "Planírovanie bagrom", detail: `${fmt(A, 0)} m² × ${cennik.planirovanie} €`, suma: A * cennik.planirovanie },
        { nazov: "Presun techniky", suma: cennik.presunTechniky },
      ];
      if (h.hutnenie) riadky.splice(1, 0, { nazov: "Hutnenie", detail: `${fmt(A, 0)} m² × ${cennik.hutnenie} €`, suma: A * cennik.hutnenie });
      return { scena: { plocha: { L, W, hutnenie: Boolean(h.hutnenie) }, bager: true }, udaje: [{ label: "Plocha", hodnota: `${fmt(A, 0)} m²`, zvyraznit: true }], riadky };
    },
  },
];

export const najdiSluzbu = (slug: string) => sluzby.find((s) => s.slug === slug);
export const predvolene = (s: Sluzba): Hodnoty => Object.fromEntries(s.polia.map((p) => [p.key, p.predvolene]));
