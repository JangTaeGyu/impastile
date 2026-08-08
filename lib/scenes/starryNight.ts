import { frac, hash, lerp, smooth } from "@/lib/engine/math";
import type { FlowFn, Scene } from "@/lib/engine/types";

// ============================================================
// 별이 빛나는 밤에 (The Starry Night, 1889)
// 색(scene)과 붓결(flow)이 같은 장(場)을 공유한다 —
// 소용돌이·물결 밴드·능선·사이프러스가 색뿐 아니라
// 스트로크의 방향까지 결정한다.
// ============================================================

// 별 (cx, cy, 크기 배율) — 좌하단 큰 별은 금성
const STARS: [number, number, number][] = [
  [0.1, 0.1, 1.3],
  [0.22, 0.05, 0.85],
  [0.31, 0.16, 1.0],
  [0.44, 0.06, 1.1],
  [0.55, 0.13, 0.8],
  [0.62, 0.05, 0.9],
  [0.75, 0.27, 1.15],
  [0.06, 0.43, 0.95],
  [0.28, 0.44, 1.75],
  [0.52, 0.3, 0.7],
];

const MOON = { x: 0.885, y: 0.115, r: 0.078 };

// 하늘의 소용돌이 두 개 — 왼쪽 대와류(반시계), 오른쪽 반류(시계)
const SW = [
  { cx: 0.4, cy: 0.3, k: 24, fall: 2.1, dir: 1, amp: 1.15 },
  { cx: 0.65, cy: 0.36, k: 28, fall: 2.6, dir: -1, amp: 0.9 },
];

// 물결 밴드 — 화면을 가로지르는 굽이치는 빛의 강
const bandY = (nx: number) => 0.33 + 0.07 * Math.sin(nx * 3.4 + 0.8);
// 원경 능선 — 오른쪽으로 갈수록 솟는다
const ridgeFar = (nx: number) =>
  0.66 - 0.05 * Math.sin(nx * 2.6 + 1.4) - smooth(0.5, 1.0, nx) * 0.13;
// 근경 마을 라인
const ridgeNear = (nx: number) => 0.78 + 0.025 * Math.sin(nx * 5 + 2);
// 사이프러스 중심선과 반폭 — 불꽃 혀처럼 넘실댄다
const cypressX = (ny: number, t: number) =>
  0.165 + 0.03 * Math.sin(ny * 3.1 + 0.6) + 0.008 * Math.sin(ny * 12 + t * 0.5);
const cypressW = (ny: number, t: number) =>
  (0.01 + Math.pow(ny, 1.1) * 0.115) *
  (0.68 + 0.32 * Math.sin(ny * 24 + t * 0.7));

export const sceneStarry: Scene = (nx, ny, t, ar) => {
  // ---- 하늘 — 군청 바탕 ----
  let r = 24 + ny * 16;
  let g = 34 + ny * 24;
  let b = 88 + ny * 40;
  const skyMask = smooth(0.8, 0.45, ny);
  // 소용돌이 + 물결 밴드 + 잔결이 만드는 빛의 흐름
  let lum = 0;
  for (let i = 0; i < SW.length; i++) {
    const s = SW[i];
    const dx = (nx - s.cx) * ar;
    const dy = ny - s.cy;
    const rad = Math.hypot(dx, dy);
    const ph = Math.atan2(dy, dx) * 2 * s.dir - rad * s.k + t * 0.5;
    lum += Math.sin(ph) * Math.exp(-rad * s.fall) * s.amp;
  }
  const bw = Math.exp(-Math.pow((ny - bandY(nx)) * 9, 2));
  lum += bw * (0.55 + 0.45 * Math.sin(nx * 16 + t * 0.6));
  lum += Math.sin(nx * 26 - ny * 8 + t * 0.4) * 0.14;
  lum *= skyMask;
  // 중간톤 터키석 → 밝은 청백 → 깊은 군청 골, 세 켜로 칠한다
  const L = smooth(0.16, 1.05, lum);
  const M = smooth(-0.05, 0.5, lum) * (1 - L);
  r = lerp(r, 78, M * 0.8);
  g = lerp(g, 120, M * 0.8);
  b = lerp(b, 185, M * 0.8);
  r = lerp(r, 190, L);
  g = lerp(g, 208, L);
  b = lerp(b, 226, L);
  const D = smooth(-0.15, -0.85, lum) * skyMask;
  r = lerp(r, 20, D * 0.5);
  g = lerp(g, 30, D * 0.5);
  b = lerp(b, 78, D * 0.5);

  // ---- 달 — 주황 초승달과 맥동하는 광륜 ----
  const dm = Math.hypot((nx - MOON.x) * ar, ny - MOON.y);
  const ring = 0.85 + 0.15 * Math.sin(dm * 90 - t * 1.2);
  const glow = smooth(0.2, 0.05, dm) * ring;
  r += glow * 95;
  g += glow * 80;
  b += glow * 20;
  const disk = smooth(MOON.r, MOON.r * 0.88, dm);
  r = lerp(r, 236, disk);
  g = lerp(g, 214, disk);
  b = lerp(b, 130, disk);
  const dmc = Math.hypot((nx - MOON.x + 0.022) * ar, ny - MOON.y - 0.012);
  const cres = disk * (1 - smooth(0.058, 0.046, dmc));
  r = lerp(r, 252, cres);
  g = lerp(g, 198, cres);
  b = lerp(b, 74, cres);

  // ---- 별 — 동심원 링이 감도는 광륜 ----
  for (let i = 0; i < STARS.length; i++) {
    const S = STARS[i];
    const ds = Math.hypot((nx - S[0]) * ar, ny - S[1]) / S[2];
    const tw = 0.85 + 0.15 * Math.sin(t * 1.6 + i * 1.9);
    const rip = 0.82 + 0.18 * Math.sin(ds * 150 - t * 2 - i);
    const gl = smooth(0.095, 0.018, ds) * tw * rip;
    const core = smooth(0.024, 0.006, ds);
    r += gl * 120;
    g += gl * 100;
    b += gl * 26;
    r = lerp(r, 255, core);
    g = lerp(g, 238, core);
    b = lerp(b, 155, core);
  }

  // ---- 원경 능선 — 등고선 결이 흐르는 짙푸른 언덕 ----
  const rf = ridgeFar(nx);
  if (ny > rf) {
    const tg = smooth(rf, rf + 0.2, ny);
    const contour =
      0.5 + 0.5 * Math.sin(nx * 26 + Math.sin(nx * 4) * 3 + ny * 30 + t * 0.2);
    r = 46 - tg * 12 + contour * 24;
    g = 64 - tg * 14 + contour * 28;
    b = 128 - tg * 24 + contour * 34;
  }

  // ---- 마을 — 어두운 집들과 따뜻한 창 ----
  const rn = ridgeNear(nx);
  if (ny > rn) {
    const hxI = (nx * 16) | 0;
    const hh = hash(hxI, 11);
    r = 26 + hh * 14;
    g = 36 + hh * 14;
    b = 64 + hh * 18;
    // 지붕의 어두운 경사
    if (frac(nx * 16) < 0.22 || frac(ny * 24) < 0.2) {
      r -= 8;
      g -= 9;
      b -= 10;
    }
    // 불 켜진 창 — 능선 가까이에만
    if (
      ny < rn + 0.11 &&
      frac(nx * 16) > 0.32 &&
      frac(nx * 16) < 0.52 &&
      frac(ny * 30) < 0.45 &&
      hash(hxI, (ny * 30) | 0) > 0.84
    ) {
      r = 232;
      g = 186;
      b = 84;
    }
    // 좌하단 올리브 덤불
    const bush = smooth(0.45, 0.1, nx) * smooth(0.82, 0.95, ny);
    if (bush > 0.01) {
      const st = 0.5 + 0.5 * Math.sin(nx * 40 + ny * 50 + t * 0.3);
      r = lerp(r, 44 + st * 20, bush);
      g = lerp(g, 64 + st * 22, bush);
      b = lerp(b, 34 + st * 12, bush);
    }
  }

  // ---- 교회 첨탑 ----
  const spx = 0.475;
  if (ny > 0.56 && ny < 0.8) {
    const wSp = ny < 0.64 ? (ny - 0.555) * 0.1 : 0.01 + (ny - 0.64) * 0.02;
    if (Math.abs(nx - spx) < wSp) {
      r = 18;
      g = 26;
      b = 46;
    }
  }

  // ---- 사이프러스 — 최전경의 검은 불꽃 ----
  const cxp = cypressX(ny, t);
  const wC = cypressW(ny, t);
  const cd = Math.abs(nx - cxp);
  if (ny > 0.015 && cd < wC) {
    const e = smooth(wC, wC * 0.35, cd);
    const st = 0.5 + 0.5 * Math.sin(ny * 60 + cd * 200 + t * 1.1);
    r = lerp(r, 8 + st * 14, e);
    g = lerp(g, 17 + st * 17, e);
    b = lerp(b, 10 + st * 8, e);
  }
  // 왼쪽으로 갈라져 나온 작은 혀
  const cd2 = Math.abs(nx - (cxp - 0.062) - 0.01 * Math.sin(ny * 9 + t * 0.6));
  if (ny > 0.34 && cd2 < wC * 0.4) {
    const e = smooth(wC * 0.4, wC * 0.14, cd2);
    const st = 0.5 + 0.5 * Math.sin(ny * 54 + t * 1.3);
    r = lerp(r, 10 + st * 16, e);
    g = lerp(g, 20 + st * 20, e);
    b = lerp(b, 12 + st * 10, e);
  }
  return [r, g, b];
};

// ---- 붓결 방향장 — 색의 장과 같은 구조를 따라 흐른다 ----
export const flowStarry: FlowFn = (nx, ny, t, ar) => {
  // 기본: 완만히 굽이치는 수평 바람
  const a0 = 0.18 * Math.sin(ny * 7 + nx * 4 + t * 0.1);
  let vx = 0.35 * Math.cos(a0);
  let vy = 0.35 * Math.sin(a0);
  const skyMask = smooth(0.85, 0.5, ny);
  // 소용돌이 접선
  for (let i = 0; i < SW.length; i++) {
    const s = SW[i];
    const dx = (nx - s.cx) * ar;
    const dy = ny - s.cy;
    const rad = Math.hypot(dx, dy) + 1e-4;
    const w = Math.exp(-rad * s.fall) * 2.4 * skyMask;
    vx += (-dy / rad) * s.dir * w;
    vy += (dx / rad) * s.dir * w;
  }
  // 물결 밴드 — 곡선의 기울기를 따라
  const slope = 0.07 * 3.4 * Math.cos(nx * 3.4 + 0.8);
  const bwF = Math.exp(-Math.pow((ny - bandY(nx)) * 9, 2)) * skyMask * 1.6;
  const aB = Math.atan2(slope, ar);
  vx += Math.cos(aB) * bwF;
  vy += Math.sin(aB) * bwF;
  // 달과 큰 별 주위의 원환
  const dmx = (nx - MOON.x) * ar;
  const dmy = ny - MOON.y;
  const dm = Math.hypot(dmx, dmy) + 1e-4;
  const wM = smooth(0.24, 0.06, dm) * 2.6;
  vx += (-dmy / dm) * wM;
  vy += (dmx / dm) * wM;
  for (let i = 0; i < STARS.length; i++) {
    const S = STARS[i];
    if (S[2] < 1.05) continue; // 큰 별만 소용돌이를 만든다
    const dx = (nx - S[0]) * ar;
    const dy = ny - S[1];
    const ds = Math.hypot(dx, dy) + 1e-4;
    const w = smooth(0.11 * S[2], 0.02, ds) * 2.0;
    vx += (-dy / ds) * w;
    vy += (dx / ds) * w;
  }
  // 언덕 — 등고선 방향 (하늘을 덮어쓸 만큼 무겁게)
  const rf = ridgeFar(nx);
  if (ny > rf) {
    const sl = -0.13 * Math.cos(nx * 2.6 + 1.4);
    const aH = Math.atan2(sl, ar);
    vx += Math.cos(aH) * 3;
    vy += Math.sin(aH) * 3;
  }
  // 마을 — 수평
  if (ny > ridgeNear(nx)) vx += 2;
  // 사이프러스 — 수직 불꽃결 (가장 무겁다)
  const cxp = cypressX(ny, t);
  const cdF = Math.abs(nx - cxp);
  if (cdF < 0.13 && ny > 0.03) {
    const w = smooth(0.13, 0.05, cdF) * 5;
    const aC = Math.PI / 2 + 0.3 * Math.sin(ny * 9 + t * 0.5);
    vx += Math.cos(aC) * w;
    vy += Math.sin(aC) * w;
  }
  return Math.atan2(vy, vx);
};
