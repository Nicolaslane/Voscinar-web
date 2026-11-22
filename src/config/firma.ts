// Údaje firmy na webe. Všetko, čo treba doplniť, je označené DOPLNIŤ.
export const firma = {
  nazov: "Voščinár",
  podtitul: "Zemné a výkopové práce",
  telefon: "+421 900 000 000", // DOPLNIŤ
  email: "info@voscinar.sk", // DOPLNIŤ
  adresa: "Slovensko", // DOPLNIŤ – sídlo / prevádzka
  ico: "", // DOPLNIŤ
  // stred oblasti, kde pôsobíme, a polomer v km (mapa)
  oblast: {
    nazov: "Stredné Slovensko", // DOPLNIŤ
    lat: 48.7363, // DOPLNIŤ
    lng: 19.1462, // DOPLNIŤ
    polomerKm: 50,
    mesta: ["Banská Bystrica", "Zvolen", "Brezno", "Žiar nad Hronom"], // DOPLNIŤ
  },
} as const;
