import { hash, smooth } from "@/lib/engine/math";
import type { Scene } from "@/lib/engine/types";

// cx, cy, 반경, 시듦 정도(0..1)
const FLOWERS: [number, number, number, number][] = [
  [0.5, 0.18, 0.115, 0.0],
  [0.33, 0.25, 0.1, 0.35],
  [0.67, 0.25, 0.1, 0.2],
  [0.235, 0.39, 0.085, 0.6],
  [0.45, 0.345, 0.1, 0.0],
  [0.585, 0.37, 0.092, 0.15],
  [0.755, 0.42, 0.082, 0.5],
  [0.355, 0.49, 0.082, 0.45],
  [0.535, 0.5, 0.088, 0.7],
  [0.665, 0.52, 0.075, 0.3],
  [0.29, 0.155, 0.072, 0.5],
];

/** 해바라기 (Sunflowers, 1888) */
export const sceneSun: Scene = (nx, ny, _t, ar) => {
  // 배경: 옅은 황록색 벽 아래 황토색 테이블
  const horizon = 0.66;
  let r: number, g: number, b: number;
  if (ny < horizon) {
    r = 196 + 10 * Math.sin(nx * 6 + ny * 4);
    g = 204;
    b = 120;
  } else {
    r = 192;
    g = 150;
    b = 58;
  }
  // 테이블 모서리 선
  if (Math.abs(ny - horizon) < 0.006) {
    r = 150;
    g = 110;
    b = 40;
  }
  // ---- 중앙의 화병 ----
  const vx = 0.5;
  const vtop = 0.6;
  const vbot = 0.92;
  const mid = 0.74;
  if (ny > vtop && ny < vbot) {
    const tt = (ny - vtop) / (vbot - vtop);
    const half = 0.075 + 0.075 * Math.sin(tt * Math.PI * 0.92 + 0.16); // 배 부른 몸통
    if (Math.abs(nx - vx) < half) {
      if (ny < mid) {
        r = 236;
        g = 206;
        b = 92;
      } else {
        r = 198;
        g = 150;
        b = 44;
      }
      if (Math.abs(ny - mid) < 0.006) {
        r = 150;
        g = 108;
        b = 36;
      } // 투톤 경계선
      if (Math.abs(ny - (vtop + 0.01)) < 0.012) {
        r = 224;
        g = 176;
        b = 70;
      } // 입구 테두리
      const sh = smooth(half * 0.4, half, Math.abs(nx - vx)); // 둥근 음영
      r -= sh * 45;
      g -= sh * 45;
      b -= sh * 20;
    }
  }
  // ---- 해바라기 머리 ----
  for (let i = 0; i < FLOWERS.length; i++) {
    const F = FLOWERS[i];
    const dx = (nx - F[0]) * ar;
    const dy = ny - F[1];
    const dd = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx);
    const petal = F[2] * (0.8 + 0.2 * Math.abs(Math.sin(ang * 13 + i)));
    if (dd < petal) {
      const wilt = F[3];
      if (dd < F[2] * 0.46) {
        // 씨앗 원반
        const sp = hash((nx * 90) | 0, (ny * 90) | 0);
        r = 66 + sp * 40;
        g = 44 + sp * 26;
        b = 18 + sp * 12;
      } else {
        // 꽃잎 — 크롬 옐로, 시들수록 앰버로
        const pr = smooth(petal, F[2] * 0.46, dd); // 끝으로 갈수록 밝게
        r = 232 + pr * 20;
        g = 192 - wilt * 70 + pr * 10;
        b = 34 + wilt * 8;
        const ridge = 0.5 + 0.5 * Math.sin(ang * 13 + i);
        r -= ridge * 22;
        g -= ridge * 30; // 꽃잎 갈래 구분
      }
    }
  }
  // 화병으로 잠기는 줄기 몇 가닥
  for (let i = 0; i < 3; i++) {
    const sxp = 0.42 + i * 0.08;
    const dd = Math.abs(nx - sxp);
    if (ny > 0.5 && ny < 0.62 && dd < 0.006) {
      r = 120;
      g = 120;
      b = 40;
    }
  }
  return [r, g, b];
};
