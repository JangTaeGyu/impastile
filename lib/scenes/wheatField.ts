import { lerp, smooth } from "@/lib/engine/math";
import type { Scene } from "@/lib/engine/types";

// 구름 소용돌이 (cx, cy, 반경)
const CLOUDS: [number, number, number][] = [
  [0.25, 0.18, 0.2],
  [0.55, 0.12, 0.16],
  [0.82, 0.24, 0.13],
  [0.42, 0.32, 0.12],
];

// 덤불 (cx, cy, 반경)
const BUSHES: [number, number, number][] = [
  [0.18, 0.72, 0.07],
  [0.3, 0.68, 0.05],
  [0.07, 0.77, 0.06],
  [0.48, 0.7, 0.045],
];

/** 밀밭의 사이프러스 (Wheat Field with Cypresses, 1889) */
export const sceneWheat: Scene = (nx, ny, t, ar) => {
  // 하늘 — 옅은 청록 위 크림빛 구름 소용돌이
  let r = 138 + ny * 30;
  let g = 172 + ny * 24;
  let b = 205;
  for (let i = 0; i < CLOUDS.length; i++) {
    const C = CLOUDS[i];
    const dx = (nx - C[0]) * ar;
    const dy = (ny - C[1]) * 1.6;
    const dd = Math.hypot(dx, dy);
    const swv = Math.sin(Math.atan2(dy, dx) * 2 - dd * 26 + t * 0.7);
    const k = smooth(C[2], C[2] * 0.2, dd) * (0.6 + 0.4 * swv);
    r = lerp(r, 244, k);
    g = lerp(g, 242, k);
    b = lerp(b, 228, k);
  }
  // 산맥 — 청보라 능선
  const ridge = 0.54 + 0.04 * Math.sin(nx * 6 + 1) + 0.015 * Math.sin(nx * 17);
  if (ny > ridge) {
    const tg = smooth(ridge, ridge + 0.09, ny);
    r = 96 - tg * 12;
    g = 112 - tg * 6;
    b = 156 - tg * 18;
  }
  // 밀밭 — 바람에 눕는 황금 물결
  const field = ridge + 0.09;
  if (ny > field) {
    const wave =
      Math.sin(nx * 26 + ny * 18 + t * 1.3) * 0.5 +
      Math.sin(nx * 53 - ny * 31 + t * 0.9) * 0.3;
    const tg = (ny - field) / (1 - field);
    r = 212 + wave * 22;
    g = 168 + wave * 20 - tg * 18;
    b = 66 + wave * 10;
    // 덤불 — 어두운 초록 관목
    for (let i = 0; i < BUSHES.length; i++) {
      const B = BUSHES[i];
      const dd = Math.hypot((nx - B[0]) * ar, (ny - B[1]) * 1.8);
      if (dd < B[2]) {
        const e = smooth(B[2], B[2] * 0.4, dd);
        const st = 0.5 + 0.5 * Math.sin(nx * 40 + ny * 30 + i);
        r = lerp(r, 50 + st * 24, e);
        g = lerp(g, 84 + st * 22, e);
        b = lerp(b, 40 + st * 12, e);
      }
    }
  }
  // 사이프러스 — 오른쪽의 검은 불꽃 (큰 것과 작은 것)
  for (let i = 0; i < 2; i++) {
    const baseX = i === 0 ? 0.76 : 0.685;
    const top = i === 0 ? 0.08 : 0.48;
    const bot = i === 0 ? 0.84 : 0.8;
    if (ny > top && ny < bot) {
      const cxp = baseX + 0.022 * Math.sin(ny * 7 + t * 0.5 + i * 2);
      // 불꽃처럼 폭이 넘실거리며 위로 갈수록 좁아진다
      const wob = 0.72 + 0.28 * Math.sin(ny * 26 + t * 0.8 + i * 3);
      const w =
        ((i === 0 ? 0.014 : 0.006) + (ny - top) * (i === 0 ? 0.034 : 0.026)) *
        wob;
      const cd = Math.abs(nx - cxp);
      if (cd < w) {
        const e = smooth(w, w * 0.5, cd);
        const flame = 0.5 + 0.5 * Math.sin(ny * 36 + t * 1.1 + nx * 24);
        r = lerp(r, 24 + flame * 24, e);
        g = lerp(g, 50 + flame * 26, e);
        b = lerp(b, 28 + flame * 14, e);
      }
    }
  }
  return [r, g, b];
};
