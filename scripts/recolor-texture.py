# Úprava textúry skenu bagra: zmaže biele nápisy na oranžovej (napr. HITACHI) a voliteľne prefarbí oranžovú na žltú.
# Použitie: python3 scripts/recolor-texture.py textura.jpg vystup.jpg zlta|oranzova
import sys, numpy as np
from PIL import Image, ImageFilter
src, out, mode = sys.argv[1], sys.argv[2], sys.argv[3]  # mode: zlta | oranzova
im = Image.open(src).convert("RGB")
hsv = np.asarray(im.convert("HSV")).astype(np.float32)
H, Sa, V = hsv[..., 0], hsv[..., 1], hsv[..., 2]
oranz = ((H < 22) | (H > 248)) & (Sa > 110) & (V > 70)
om = Image.fromarray((oranz * 255).astype(np.uint8))
# nápisy: biele/svetlé pixely obklopené oranžovou
okolie = np.asarray(om.filter(ImageFilter.BoxBlur(18))).astype(np.float32) / 255
biele = (Sa < 125) & (V > 140) & (okolie > 0.4)
bm = Image.fromarray((biele * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(11))
bmask = np.asarray(bm) > 0
rgb = np.asarray(im).astype(np.float32)
# zaplnenie nápisov priemernou farbou okolitej oranžovej (rozmazanie len z oranžových pixelov)
w = (oranz & ~bmask).astype(np.float32)
num = np.stack([np.asarray(Image.fromarray(np.uint8(np.clip(rgb[..., c] * w, 0, 255))).filter(ImageFilter.GaussianBlur(14))).astype(np.float32) for c in range(3)], -1)
den = np.asarray(Image.fromarray(np.uint8(w * 255)).filter(ImageFilter.GaussianBlur(14))).astype(np.float32)[..., None] / 255
fill = num / np.maximum(den, 1e-3)
# trocha šumu, aby výplň nebola plochá
fill += np.random.normal(0, 4, fill.shape)
soft = np.asarray(bm.filter(ImageFilter.GaussianBlur(2))).astype(np.float32)[..., None] / 255
rgb = rgb * (1 - soft) + fill * soft
im2 = Image.fromarray(np.uint8(np.clip(rgb, 0, 255)))
if mode == "zlta":
    hsv2 = np.asarray(im2.convert("HSV")).astype(np.float32)
    H2, S2 = hsv2[..., 0], hsv2[..., 1]
    m = ((H2 < 27) | (H2 > 245)) & (S2 > 55) & (hsv2[..., 2] > 60)
    mm = np.asarray(Image.fromarray(np.uint8(m * 255)).filter(ImageFilter.GaussianBlur(1.5))).astype(np.float32) / 255
    Hn = np.where(H2 > 200, H2 - 256, H2)
    hsv2[..., 0] = np.mod(Hn + (31 - 12) * mm, 256)  # oranžová ~12 -> žltá ~31
    hsv2[..., 1] = np.clip(S2 * (1 + 0.05 * mm), 0, 255)
    hsv2[..., 2] = np.clip(hsv2[..., 2] * (1 + 0.12 * mm), 0, 255)
    im2 = Image.fromarray(np.uint8(hsv2), "HSV").convert("RGB")
im2.save(out, quality=92)
im2.resize((1024, 1024)).save(out.replace(".jpg", "_small.jpg"))
print("ok", bmask.mean())
