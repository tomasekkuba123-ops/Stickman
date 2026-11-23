"""Scene 03 continuity fix: recolour the grey/brown sneaker uppers to the Stickman's red (soles, toe caps,
laces stay white). Writes images/SCENE_03.jpg (original kept as images/SCENE_03_original.jpg)."""
import pathlib, shutil, cv2, numpy as np
ROOT = pathlib.Path(__file__).resolve().parent.parent
src = ROOT / "images" / "SCENE_03_original.jpg"
if not src.exists(): shutil.copy(ROOT / "images" / "SCENE_03.jpg", src)
im = cv2.imread(str(src)); H, W = im.shape[:2]
ox, oy = 400, 820   # polygons below are in the crop (400..1020, 820..1040)
polys = [np.array([(44, 150), (60, 100), (84, 46), (165, 42), (184, 70), (190, 92), (162, 112), (122, 128), (96, 150), (62, 168)]),
         np.array([(403, 118), (404, 86), (414, 62), (428, 36), (470, 27), (502, 44), (545, 80), (550, 100), (530, 113), (484, 121), (416, 122)])]
region = np.zeros((H, W), np.uint8)
for p in polys: cv2.fillPoly(region, [p + (ox, oy)], 255)
hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV).astype(np.float32)
h, s, v = cv2.split(hsv)
white = (v > 165) & (s < 80)
m = ((region > 0) & ~white & (v > 18)).astype(np.uint8) * 255
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
alpha = cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), 1.6)[..., None]
# red with the original shading: V lifted so it matches the bright red sneakers in the other scenes
nv = np.clip(v * 1.9 + 12, 0, 230); ns = np.full_like(s, 215); nh = np.full_like(h, 178)
red = cv2.cvtColor(cv2.merge([nh, ns, nv]).astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32)
out = (im.astype(np.float32) * (1 - alpha) + red * alpha).clip(0, 255).astype(np.uint8)
cv2.imwrite(str(ROOT / "images" / "SCENE_03.jpg"), out, [cv2.IMWRITE_JPEG_QUALITY, 96])
cv2.imwrite(str(ROOT / "out" / "s03_fix_compare.png"), np.vstack([im[800:1050, 380:1040], out[800:1050, 380:1040]]))
print("scene 03 shoes recoloured")
