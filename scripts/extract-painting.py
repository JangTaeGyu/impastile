"""원본 회화 이미지에서 색상 맵 + 붓결 방향장을 추출해 TS 모듈로 내보낸다.

- 색: 다운스케일한 RGB (base64)
- 방향: 구조 텐서의 등고선(스트로크) 방향을 배각(2θ) 벡터로 저장 —
  배각 벡터는 ±180° 모호성 없이 안전하게 보간된다.
"""
import base64
import numpy as np
from PIL import Image, ImageFilter

SRC = "/Users/jangtaegyu/.claude/image-cache/518f6ca9-6a73-47fa-844e-f81abea45a43/3.png"
OUT = "/Users/jangtaegyu/Desktop/ToyProject/impastile/lib/scenes/starryNightData.ts"
W, H = 144, 104          # 내장 색상 맵 해상도
WORK_W = 432             # 방향장 계산용 중간 해상도

img = Image.open(SRC).convert("RGB")
w0, h0 = img.size
# 좌하단 구글 렌즈 아이콘 제거 — 하단 7% 크롭
img = img.crop((0, 0, w0, int(h0 * 0.93)))

# ---- 색상 맵 ----
color = img.resize((W, H), Image.LANCZOS)
rgb = np.asarray(color, dtype=np.uint8)
rgb_b64 = base64.b64encode(rgb.tobytes()).decode()

# ---- 방향장: 구조 텐서 ----
work = img.resize((WORK_W, int(WORK_W * img.size[1] / img.size[0])), Image.LANCZOS)
work = work.filter(ImageFilter.GaussianBlur(1.2))
L = np.asarray(work.convert("L"), dtype=np.float64)
gy, gx = np.gradient(L)

Jxx, Jyy, Jxy = gx * gx, gy * gy, gx * gy

def gauss(a, sigma):
    # 분리형 가우시안 컨볼루션 (PIL F-mode blur 미지원 대체)
    rad = int(sigma * 3) + 1
    x = np.arange(-rad, rad + 1)
    k = np.exp(-(x ** 2) / (2 * sigma ** 2))
    k /= k.sum()
    p = np.pad(a, ((rad, rad), (rad, rad)), mode="edge")
    p = np.apply_along_axis(lambda m: np.convolve(m, k, mode="valid"), 0, p)
    p = np.apply_along_axis(lambda m: np.convolve(m, k, mode="valid"), 1, p)
    return p

S = 5.0  # 방향을 붓결 스케일로 뭉갠다
Jxx, Jyy, Jxy = gauss(Jxx, S), gauss(Jyy, S), gauss(Jxy, S)

# 그래디언트 주방향의 배각 = atan2(2Jxy, Jxx-Jyy); 스트로크는 그 수직 → 배각에 π를 더한다
two_theta = np.arctan2(2 * Jxy, Jxx - Jyy) + np.pi
c2, s2 = np.cos(two_theta), np.sin(two_theta)

# 등방(코히런스 낮은) 영역은 이웃 방향으로 자연스럽게 채워지도록 코히런스로 가중 후 재블러
coh = np.sqrt((Jxx - Jyy) ** 2 + 4 * Jxy ** 2) / (Jxx + Jyy + 1e-9)
c2w, s2w = gauss(c2 * coh, 4.0), gauss(s2 * coh, 4.0)
norm = np.sqrt(c2w ** 2 + s2w ** 2) + 1e-9
c2n, s2n = c2w / norm, s2w / norm

def down(a):
    # 단순 격자 샘플링 다운스케일 (충분히 뭉개진 필드라 안전)
    ys = (np.linspace(0, a.shape[0] - 1, H)).astype(int)
    xs = (np.linspace(0, a.shape[1] - 1, W)).astype(int)
    return a[np.ix_(ys, xs)]

c2d, s2d = down(c2n), down(s2n)
n2 = np.sqrt(c2d ** 2 + s2d ** 2) + 1e-9
c2d, s2d = c2d / n2, s2d / n2

# int8 양자화 (-127..127)
cq = np.clip(np.round(c2d * 127), -127, 127).astype(np.int8)
sq = np.clip(np.round(s2d * 127), -127, 127).astype(np.int8)
flow_b64 = base64.b64encode(cq.tobytes() + sq.tobytes()).decode()

def chunk(s, n=100):
    return "\n".join(f'  "{s[i:i+n]}" +' for i in range(0, len(s), n)).rstrip("+").rstrip()

ts = f"""// 자동 생성 — scratchpad/extract.py가 원본 회화에서 추출한 데이터.
// 색상 맵 {W}x{H} RGB, 붓결 방향장은 배각(2θ) 벡터 int8 x 2.
export const IMG_W = {W};
export const IMG_H = {H};

const RGB_B64 =
{chunk(rgb_b64)};

const FLOW_B64 =
{chunk(flow_b64)};

function decode(b64: string): Uint8Array {{
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}}

export const RGB: Uint8Array = decode(RGB_B64);
const FLOW_RAW = decode(FLOW_B64);
/** cos2θ (-127..127) */
export const FLOW_C: Int8Array = new Int8Array(
  FLOW_RAW.buffer,
  0,
  IMG_W * IMG_H,
);
/** sin2θ (-127..127) */
export const FLOW_S: Int8Array = new Int8Array(
  FLOW_RAW.buffer,
  IMG_W * IMG_H,
  IMG_W * IMG_H,
);
"""
with open(OUT, "w") as f:
    f.write(ts)
print(f"wrote {OUT}: rgb {len(rgb_b64)}B b64, flow {len(flow_b64)}B b64")
