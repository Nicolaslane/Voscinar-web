# Voščinár – web so službami a 3D konfigurátormi

Samostatný web (Next.js + three.js) – nezávislý od aplikácie Stavebný Jarvis v nadradenom priečinku.

- **Úvod:** biele 3D štúdio, v strede bager (na výber pásový / minibáger / kolesový – dá sa potiahnuť a otočiť), vzadu 3D nápis „Voščinár“ podsvietený teplým svetlom.
- **Nižšie:** tri kocky s oblými hranami – Galéria, Kontakt, Kde pôsobíme (mapa).
- **Menu (3 čiarky vľavo hore):** zoznam služieb → každá otvorí konfigurátor.
- **Konfigurátory:** výkop jamy, výkop základov, výkop ryhy, odvoz zeminy, dovoz materiálu, úprava terénu.
  Z rozmerov sa hneď nakreslí 3D výkres s kótami, spočíta sa objem (m³) a cena; pri odvoze/dovoze
  príde animovaná Tatra a ukáže, koľkokrát sa otočí. Dopyt sa odošle e-mailom.

## Čo upraviť

| Súbor | Čo tam je |
|---|---|
| `src/config/firma.ts` | telefón, e-mail, adresa, IČO, oblasť na mape (všetko označené DOPLNIŤ) |
| `src/config/cennik.ts` | ceny za m³, jazdy Tatrou, skládka, materiál, minimálna zákazka, DPH |
| `src/lib/sluzby.ts` | služby, polia formulára a výpočty – nová služba = nový záznam v zozname |
| `src/app/galeria/page.tsx` | fotky do galérie (súbory do `public/galeria/`) |

## Spustenie

```bash
cd voscinar-web
npm install
npm run dev        # http://localhost:3000
```

## Nasadenie na Vercel

Nový projekt na Verceli z tohto repozitára, **Root Directory = `voscinar-web`**, potom pripojiť doménu (napr. voscinar.sk).

`npm run font` znovu vytvorí 3D písmo (`public/fonts/inter-bold.typeface.json`) z Inter Bold – treba len pri zmene písma.
