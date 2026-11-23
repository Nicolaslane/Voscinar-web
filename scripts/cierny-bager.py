# Čierny, lesklý a čistejší bager zo skenu.
# Vstup: textúra bez nápisov (oranžová, z recolor-texture.py) + pôvodná textúra AO/drsnosť.
# Výstup: farba (čierny lak, menej blata), ORM (AO + drsnosť) a maska laku (clearcoat).
# Použitie: python3 scripts/cierny-bager.py oranz.jpg img1.png vystupny_priecinok
import sys, numpy as np
from PIL import Image, ImageFilter

farba_src, orm_src, out = sys.argv[1:4]
im = Image.open(farba_src).convert("RGB")
rgb = np.asarray(im).astype(np.float32)
hsv = np.asarray(im.convert("HSV")).astype(np.float32)
H, S, V = hsv[..., 0], hsv[..., 1], hsv[..., 2]

# lak = oranžové plochy (aj tienené a ružovkasté okraje)
lak = ((H < 27) | (H > 245)) & (S > 55) & (V > 45)
lak_img = Image.fromarray(np.uint8(lak * 255)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.5))
m = np.asarray(lak_img).astype(np.float32)[..., None] / 255

# čierny lak: tmavá, takmer jednoliata farba, len jemne kopíruje pôvodný jas (hrany, tiene)
jas = (0.3 * rgb[..., 0] + 0.59 * rgb[..., 1] + 0.11 * rgb[..., 2])[..., None]
jas_hladky = np.asarray(Image.fromarray(np.uint8(np.clip(jas[..., 0], 0, 255))).filter(ImageFilter.GaussianBlur(3))).astype(np.float32)[..., None]
cierna = 20 + 0.10 * jas_hladky + np.array([0, 0.5, 1.5])  # nádych do modro-čiernej

# čistejšie: hnedé/olivové blato a tráva -> neutrálna tmavšia oceľ
blato = (H >= 18) & (H <= 70) & (S > 25) & ~lak
bm = np.asarray(Image.fromarray(np.uint8(blato * 255)).filter(ImageFilter.GaussianBlur(2))).astype(np.float32)[..., None] / 255
siva = np.repeat(jas, 3, axis=-1)
ocel = siva * 0.62 + 8
ciste = rgb * (1 - bm * 0.85) + ocel * (bm * 0.85)
# celkovo menej svetlého prachu na nelakovaných častiach
ciste = np.where(siva > 150, ciste * 0.85, ciste)

vysledok = ciste * (1 - m) + cierna * m
Image.fromarray(np.uint8(np.clip(vysledok, 0, 255))).save(f"{out}/farba.jpg", quality=92)

# ORM: R = AO (pôvodné), G = drsnosť (lak hladký, zvyšok drsný), B = kov 0
orm = np.asarray(Image.open(orm_src).convert("RGB").resize(im.size)).astype(np.float32)
m2 = m[..., 0]
drsnost = 0.88 * 255 * (1 - m2) + 0.22 * 255 * m2
orm_out = np.stack([orm[..., 0], drsnost, np.zeros_like(drsnost)], -1)
Image.fromarray(np.uint8(orm_out)).resize((2048, 2048)).save(f"{out}/orm.png")
Image.fromarray(np.uint8(m2 * 255)).resize((2048, 2048)).save(f"{out}/lak.png")
Image.fromarray(np.uint8(np.clip(vysledok, 0, 255))).resize((1024, 1024)).save(f"{out}/farba_small.jpg")
print("lak", round(float(m2.mean()), 3), "blato", round(float(blato.mean()), 3))
