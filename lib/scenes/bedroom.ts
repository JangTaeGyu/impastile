import { frac, hash } from "@/lib/engine/math";
import type { Scene } from "@/lib/engine/types";

// 벽에 걸린 액자들 (cx, cy, 반폭, 반높이)
const FRAMES: [number, number, number, number][] = [
  [0.62, 0.16, 0.04, 0.055],
  [0.74, 0.12, 0.03, 0.045],
  [0.84, 0.18, 0.035, 0.05],
  [0.15, 0.18, 0.03, 0.05],
];

/** 아를의 침실 (Bedroom in Arles, 1888) */
export const sceneBedroom: Scene = (nx, ny, _t, ar) => {
  const wallLine = 0.56 + 0.03 * Math.sin(nx * 3); // 벽-바닥 경계, 살짝 비뚤게
  let r: number, g: number, b: number;
  if (ny < wallLine) {
    // 벽 — 옅은 청보라, 성근 붓결
    r = 126 + 8 * Math.sin(nx * 12 + ny * 9);
    g = 156 + 8 * Math.sin(nx * 9 - ny * 7);
    b = 186;
  } else {
    // 바닥 — 초록빛 도는 널판
    const tg = (ny - wallLine) / (1 - wallLine);
    r = 138 + tg * 26;
    g = 112 + tg * 18;
    b = 64;
    if (frac((nx * 0.5 + (ny - wallLine) * 1.6) * 7) < 0.07) {
      r *= 0.82;
      g *= 0.82;
      b *= 0.82;
    }
  }
  // 벽-바닥 경계선
  if (Math.abs(ny - wallLine) < 0.006) {
    r = 70;
    g = 80;
    b = 90;
  }
  // 왼쪽 문 — 회녹색 패널
  if (nx < 0.09 && ny > 0.04 && ny < wallLine) {
    r = 108;
    g = 130;
    b = 118;
    if (Math.abs(nx - 0.045) < 0.004 || Math.abs(ny - 0.3) < 0.004) {
      r = 88;
      g = 108;
      b = 98;
    }
  }
  // 뒷벽 창문 — 초록 덧문과 어두운 청록 유리
  if (nx > 0.3 && nx < 0.46 && ny > 0.08 && ny < 0.36) {
    r = 96;
    g = 130;
    b = 96;
    if (nx > 0.325 && nx < 0.435 && ny > 0.1 && ny < 0.34) {
      r = 58 + 14 * Math.sin(nx * 40 + ny * 30);
      g = 96;
      b = 110;
      if (Math.abs(nx - 0.38) < 0.006 || Math.abs(ny - 0.22) < 0.006) {
        r = 120;
        g = 140;
        b = 110;
      }
    }
  }
  // 액자들 — 황토 테두리에 뭉개진 초상 빛깔
  for (let i = 0; i < FRAMES.length; i++) {
    const F = FRAMES[i];
    const dx = Math.abs(nx - F[0]);
    const dy = Math.abs(ny - F[1]);
    if (dx < F[2] && dy < F[3]) {
      if (dx > F[2] - 0.008 || dy > F[3] - 0.008) {
        r = 170;
        g = 132;
        b = 66;
      } else {
        const sp = hash(i * 7 + ((nx * 60) | 0), (ny * 60) | 0);
        r = 120 + sp * 70;
        g = 100 + sp * 50;
        b = 80 + sp * 40;
      }
    }
  }
  // 침대 — 오른쪽, 앞으로 올수록 왼쪽 모서리가 벌어진다
  const bedL = 0.5 + (0.85 - ny) * 0.1;
  if (ny > 0.4 && ny < 0.88 && nx > bedL) {
    r = 208;
    g = 158;
    b = 54; // 노란 나무
    if (ny < 0.46 || ny > 0.8) {
      r = 188;
      g = 136;
      b = 44; // 헤드보드·풋보드
    }
    // 붉은 담요 — 주름결
    if (ny > 0.5 && ny < 0.74 && nx > bedL + 0.02) {
      const fold = 0.5 + 0.5 * Math.sin(nx * 34 + ny * 10);
      r = 176 - fold * 26;
      g = 62 - fold * 10;
      b = 46;
    }
    // 베개 두 개 — 미색
    for (let i = 0; i < 2; i++) {
      const dp = Math.hypot((nx - (0.74 + i * 0.13)) * ar * 1.3, (ny - 0.475) * 3.2);
      if (dp < 0.14) {
        r = 236;
        g = 226;
        b = 196;
      }
    }
  }
  // 침대 다리
  if (
    ny >= 0.88 &&
    ny < 0.95 &&
    (Math.abs(nx - 0.53) < 0.012 || Math.abs(nx - 0.94) < 0.012)
  ) {
    r = 150;
    g = 104;
    b = 36;
  }
  // 협탁 — 침대 곁의 주황 나무
  if (nx > 0.4 && nx < 0.52 && ny > 0.46 && ny < 0.64) {
    r = 172;
    g = 112;
    b = 50;
    if (Math.abs(ny - 0.475) < 0.008) {
      r = 210;
      g = 150;
      b = 70; // 상판
    }
  }
  // 협탁 위 물병
  if (nx > 0.44 && nx < 0.47 && ny > 0.42 && ny < 0.465) {
    r = 190;
    g = 205;
    b = 210; // 물병
  }
  // 의자 — 왼쪽 앞의 노란 밀짚 의자
  if (nx > 0.1 && nx < 0.26 && ny > 0.52 && ny < 0.84) {
    if (ny < 0.66) {
      // 등받이 — 세로살 사이로 벽이 비친다
      if (frac((nx - 0.1) * 19) < 0.5) {
        r = 206;
        g = 160;
        b = 60;
      }
    } else if (ny < 0.73) {
      r = 216;
      g = 176;
      b = 88; // 밀짚 방석
      if (frac(nx * 60) < 0.2) {
        r = 196;
        g = 152;
        b = 62;
      }
    } else if (Math.abs(nx - 0.125) < 0.012 || Math.abs(nx - 0.245) < 0.012) {
      r = 190;
      g = 142;
      b = 50; // 다리
    }
  }
  return [r, g, b];
};
