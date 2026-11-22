// Cenník pre konfigurátory. Ceny sú orientačné, bez DPH – uprav podľa seba.
export const DPH = 0.23;

export const cennik = {
  presunTechniky: 80, // € – doprava stroja na miesto (raz za zákazku)
  minimalnaZakazka: 150, // € – ak vyjde menej, účtuje sa toto

  // výkop podľa zeminy (€/m³)
  vykop: {
    lahka: { nazov: "Ľahká (piesok, ornica)", cena: 8 },
    stredna: { nazov: "Stredná (hlina)", cena: 11 },
    tazka: { nazov: "Ťažká (íl, štrk)", cena: 16 },
    skalnata: { nazov: "Skalnatá", cena: 28 },
  },
  ryhaPriplatok: 1.25, // úzka ryha je pracnejšia (× cena za m³)
  zakladyPriplatok: 1.15,

  // odvoz zeminy
  nakyprenie: 1.25, // 1 m³ v zemi = 1,25 m³ na korbe
  tatraM3: 10, // koľko m³ uvezie jedna Tatra
  jazda: 35, // € za jazdu (naloženie, vyloženie)
  jazdaKm: 1.6, // € za km (tam aj späť)
  skladkaM3: 4, // € za m³ uloženia na skládke

  // dovoz materiálu (€/t, hustota t/m³)
  material: {
    strk: { nazov: "Štrk 16–32", cena: 14, hustota: 1.6 },
    piesok: { nazov: "Piesok 0–4", cena: 12, hustota: 1.5 },
    kamenivo: { nazov: "Kamenivo 0–63 (podsyp)", cena: 11, hustota: 1.8 },
    ornica: { nazov: "Ornica", cena: 9, hustota: 1.3 },
  },
  tatraT: 16, // koľko ton uvezie jedna Tatra

  // úprava terénu (€/m²)
  planirovanie: 1.8,
  hutnenie: 1.2,
} as const;
