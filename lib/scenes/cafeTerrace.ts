import { frac, hash, lerp, smooth } from "@/lib/engine/math";
import type { Scene } from "@/lib/engine/types";

// 별 위치 — 어닝을 피해 왼쪽 하늘에
const STARS: [number, number][] = [
  [0.07, 0.09],
  [0.17, 0.17],
  [0.3, 0.07],
  [0.4, 0.2],
  [0.12, 0.3],
  [0.27, 0.33],
  [0.46, 0.11],
  [0.36, 0.32],
];

// 테라스 테이블 실루엣 (cx, cy)
const TABLES: [number, number][] = [
  [0.56, 0.52],
  [0.63, 0.55],
  [0.7, 0.5],
  [0.585, 0.585],
];

/** 밤의 카페 테라스 (Café Terrace at Night, 1888) */
export const sceneCafe: Scene = (nx, ny, t, ar) => {
  // 코발트 밤하늘 — 아래로 갈수록 살짝 밝게
  let r = 18 + ny * 16;
  let g = 32 + ny * 22;
  let b = 90 + ny * 30;
  // 별 — 희고 큰 광륜
  for (let i = 0; i < STARS.length; i++) {
    const tw = 0.8 + 0.2 * Math.sin(t * 1.6 + i * 2.1);
    const ds = Math.hypot((nx - STARS[i][0]) * ar, ny - STARS[i][1]);
    const core = smooth(0.013, 0, ds);
    const gl = smooth(0.045, 0.01, ds) * tw;
    r = lerp(r, 240, core);
    g = lerp(g, 245, core);
    b = lerp(b, 255, core);
    r += gl * 70;
    g += gl * 80;
    b += gl * 60;
  }
  // 왼쪽 건물 — 어두운 파사드, 드문드문 켜진 창
  if (nx < 0.26 && ny > 0.16 + nx * 0.3 && ny < 0.62) {
    r = 24 + nx * 20;
    g = 30 + nx * 20;
    b = 58 + nx * 40;
    const wx = (nx * 14) | 0;
    const wy = (ny * 18) | 0;
    if (frac(nx * 14) < 0.4 && frac(ny * 18) < 0.5 && hash(wx, wy) > 0.82) {
      r += 140;
      g += 100;
      b += 20;
    }
  }
  // 카페 — 오른쪽의 노란 온기
  const aE = 0.3 - (nx - 0.52) * 0.12; // 어닝 아랫단, 오른쪽으로 갈수록 살짝 올라간다
  if (nx > 0.52 && ny < 0.6) {
    if (ny < aE) {
      // 어닝 밑면 — 가스등 빛을 머금은 노랑, 골 주름
      r = 246;
      g = 212;
      b = 92;
      const rib = 0.5 + 0.5 * Math.sin(nx * 48 + ny * 6);
      r -= rib * 18;
      g -= rib * 24;
      // 가장자리의 주황 띠
      if (aE - ny < 0.015) {
        r = 222;
        g = 142;
        b = 48;
      }
    } else {
      // 카페 벽과 테라스 바닥 — 따뜻한 크롬 옐로
      r = 232 + 10 * Math.sin(nx * 30 + ny * 20);
      g = 184;
      b = 74;
      // 문과 창 — 어두운 세로 사각형
      if (nx > 0.8 && nx < 0.92 && ny > 0.3) {
        r = 152;
        g = 98;
        b = 40;
      }
      if (nx > 0.6 && nx < 0.7 && ny > 0.26 && ny < 0.44) {
        r = 128;
        g = 112;
        b = 58;
      }
      // 가스등 — 어닝 아래에서 이글거리는 점
      const dl = Math.hypot((nx - 0.72) * ar, ny - (aE + 0.035));
      const lamp = smooth(0.035, 0, dl) * (0.9 + 0.1 * Math.sin(t * 3));
      r = lerp(r, 255, lamp);
      g = lerp(g, 244, lamp);
      b = lerp(b, 190, lamp);
      // 테라스 테이블 실루엣
      for (let i = 0; i < TABLES.length; i++) {
        const dd = Math.hypot((nx - TABLES[i][0]) * ar, (ny - TABLES[i][1]) * 1.6);
        if (dd < 0.028) {
          r = 46;
          g = 44;
          b = 62;
        }
      }
    }
  }
  // 자갈길 — 청보라 돌에 카페 불빛이 번진다
  if (ny >= 0.6) {
    const gx = (nx * 18) | 0;
    const gy = ((ny - 0.6) * 20) | 0;
    const sp = hash(gx, gy);
    r = 66 + sp * 26;
    g = 60 + sp * 22;
    b = 104 + sp * 26;
    const lk = smooth(
      0.75,
      0.15,
      Math.hypot((nx - 0.7) * ar * 0.8, (ny - 0.58) * 1.4),
    );
    r = lerp(r, 214 + sp * 20, lk);
    g = lerp(g, 168 + sp * 16, lk);
    b = lerp(b, 84, lk);
    // 돌 사이의 어두운 골
    if (frac(nx * 18) < 0.12 || frac((ny - 0.6) * 20) < 0.15) {
      r *= 0.8;
      g *= 0.8;
      b *= 0.85;
    }
  }
  return [r, g, b];
};
