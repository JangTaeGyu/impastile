"""원본 회화 이미지에서 색상 맵 + 붓결 방향장을 추출해 TS 모듈로 내보낸다.

사용법:
  python extract-painting.py --src IMG --out lib/scenes/xxxData.ts \
      [--crop top,right,bottom,left]  # 각 변 크롭 비율 (0..1)

- 색: 최대 변 144px로 다운스케일한 RGB (base64)
- 방향: 구조 텐서의 등고선(스트로크) 방향을 배각(2θ) 벡터 int8로 저장 —
  배각 벡터는 ±180° 모호성 없이 안전하게 보간된다.
- 출력 모듈은 lib/scenes/painting.ts의 decodePainting으로 디코드된다.

의존성: pillow, numpy (venv 권장)
"""
import argparse
import base64
import numpy as np
from PIL import Image

MAX_DIM = 144   # 내장 색상 맵 최대 변
WORK_W = 432    # 방향장 계산용 중간 해상도


def gauss(a, sigma):
    rad = int(sigma * 3) + 1
    x = np.arange(-rad, rad + 1)
    k = np.exp(-(x ** 2) / (2 * sigma ** 2))
    k /= k.sum()
    p = np.pad(a, ((rad, rad), (rad, rad)), mode="edge")
    p = np.apply_along_axis(lambda m: np.convolve(m, k, mode="valid"), 0, p)
    p = np.apply_along_axis(lambda m: np.convolve(m, k, mode="valid"), 1, p)
    return p


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--crop", default="0,0,0,0", help="top,right,bottom,left 비율")
    ap.add_argument(
        "--dump",
        help="중간 버퍼를 이 디렉터리에 raw로 떨군다 (scripts/verify-extract.mjs 전용)",
    )
    args = ap.parse_args()

    ct, cr, cb, cl = (float(v) for v in args.crop.split(","))
    img = Image.open(args.src).convert("RGB")
    w0, h0 = img.size
    img = img.crop(
        (int(w0 * cl), int(h0 * ct), int(w0 * (1 - cr)), int(h0 * (1 - cb)))
    )

    # 색상 맵 크기 — 종횡비 유지, 최대 변 MAX_DIM
    w1, h1 = img.size
    if w1 >= h1:
        W, H = MAX_DIM, max(2, round(MAX_DIM * h1 / w1))
    else:
        W, H = max(2, round(MAX_DIM * w1 / h1)), MAX_DIM

    color = img.resize((W, H), Image.LANCZOS)
    rgb = np.asarray(color, dtype=np.uint8)
    rgb_b64 = base64.b64encode(rgb.tobytes()).decode()

    # ---- 방향장: 구조 텐서 ----
    work = img.resize((WORK_W, max(2, int(WORK_W * h1 / w1))), Image.LANCZOS)
    lum = np.asarray(work.convert("L"), dtype=np.float64)
    L = gauss(lum, 1.2)
    gy, gx = np.gradient(L)
    Jxx, Jyy, Jxy = gauss(gx * gx, 5.0), gauss(gy * gy, 5.0), gauss(gx * gy, 5.0)

    # 그래디언트 주방향 배각 + π = 스트로크(등고선) 방향의 배각
    two_theta = np.arctan2(2 * Jxy, Jxx - Jyy) + np.pi
    c2, s2 = np.cos(two_theta), np.sin(two_theta)
    # 등방 영역은 코히런스 가중 후 재블러로 이웃 방향을 이어받는다
    coh = np.sqrt((Jxx - Jyy) ** 2 + 4 * Jxy ** 2) / (Jxx + Jyy + 1e-9)
    c2w, s2w = gauss(c2 * coh, 4.0), gauss(s2 * coh, 4.0)
    norm = np.sqrt(c2w ** 2 + s2w ** 2) + 1e-9
    c2n, s2n = c2w / norm, s2w / norm

    ys = np.linspace(0, c2n.shape[0] - 1, H).astype(int)
    xs = np.linspace(0, c2n.shape[1] - 1, W).astype(int)
    c2d, s2d = c2n[np.ix_(ys, xs)], s2n[np.ix_(ys, xs)]
    cq = np.clip(np.round(c2d * 127), -127, 127).astype(np.int8)
    sq = np.clip(np.round(s2d * 127), -127, 127).astype(np.int8)
    flow_b64 = base64.b64encode(cq.tobytes() + sq.tobytes()).decode()

    # TS 판(lib/scenes/extract.ts)과 대조하기 위한 중간 버퍼 덤프.
    # 휘도 버퍼를 넘겨줘야 리사이즈 알고리즘 차이(LANCZOS vs 캔버스)를 빼고
    # 구조 텐서 계산만 비교할 수 있다.
    if args.dump:
        import json
        import os

        os.makedirs(args.dump, exist_ok=True)
        lum.tofile(os.path.join(args.dump, "lum.f64"))
        with open(os.path.join(args.dump, "flow.i8"), "wb") as f:
            f.write(cq.tobytes() + sq.tobytes())
        with open(os.path.join(args.dump, "meta.json"), "w") as f:
            json.dump(
                {"lw": lum.shape[1], "lh": lum.shape[0], "w": W, "h": H}, f
            )
        print(f"dump: {args.dump} (lum {lum.shape[1]}x{lum.shape[0]})")

    def chunk(s, n=100):
        return "\n".join(f'  "{s[i:i+n]}" +' for i in range(0, len(s), n)).rstrip("+").rstrip()

    ts = f"""// 자동 생성 — scripts/extract-painting.py가 원본 회화에서 추출한 데이터.
import {{ decodePainting }} from "./painting";

const RGB_B64 =
{chunk(rgb_b64)};

const FLOW_B64 =
{chunk(flow_b64)};

export const data = decodePainting({W}, {H}, RGB_B64, FLOW_B64);
"""
    with open(args.out, "w") as f:
        f.write(ts)
    print(f"{args.out}: {W}x{H}, rgb {len(rgb_b64)}B, flow {len(flow_b64)}B")


if __name__ == "__main__":
    main()
