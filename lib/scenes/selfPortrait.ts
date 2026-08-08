import { smooth } from "@/lib/engine/math";
import type { Scene } from "@/lib/engine/types";

/** 자화상 (Self-Portrait, 1889) */
export const scenePortrait: Scene = (nx, ny, t, ar) => {
  // 배경 — 머리를 중심으로 소용돌이치는 청록
  const dxh = (nx - 0.5) * ar;
  const dyh = ny - 0.4;
  const ang = Math.atan2(dyh, dxh);
  const rad = Math.hypot(dxh, dyh);
  const sw =
    Math.sin(ang * 3 + rad * 22 - t * 0.9) * 0.5 +
    Math.sin(rad * 34 - t * 0.6) * 0.3;
  let r = 92 + sw * 26;
  let g = 140 + sw * 30;
  let b = 148 + sw * 26;
  // 어깨와 자켓 — 짙은 청록, 같은 결로 굽이친다
  const shoulder = 0.62 - 0.16 * Math.exp(-Math.pow(dxh * 2.6, 2));
  if (ny > shoulder) {
    r = 56 + sw * 14;
    g = 88 + sw * 16;
    b = 96 + sw * 16;
    // 라펠 V
    if (Math.abs(dxh) < (ny - 0.6) * 0.4) {
      r = 40;
      g = 66;
      b = 74;
    }
  }
  // 머리 — 타원 좌표 (hx, hy)로 얼굴 내부를 그린다
  const hx = dxh / 0.145;
  const hy = (ny - 0.4) / 0.185;
  const hd = hx * hx + hy * hy;
  if (hd < 1) {
    // 피부 — 가장자리와 오른쪽으로 갈수록 초록빛 음영
    const sh = smooth(0.3, 1.0, hd) * 0.5 + Math.max(0, hx) * 0.2;
    r = 214 - sh * 60 + 6 * Math.sin(hx * 6 + hy * 14);
    g = 176 - sh * 56 + 6 * Math.sin(hx * 7 - hy * 11);
    b = 138 - sh * 60;
    // 이마 위 머리카락 — 불꽃 같은 주황
    if (hy < -0.45) {
      const st = 0.5 + 0.5 * Math.sin(hx * 14 + hy * 6 + t * 0.3);
      r = 158 + st * 30;
      g = 88 + st * 18;
      b = 36;
    }
    // 수염 — 붉은 오렌지, 결 따라 어둡게
    if (hy > 0.35 && Math.abs(hx) < 0.85) {
      const st = 0.5 + 0.5 * Math.sin(hx * 18 + hy * 8);
      r = 176 - st * 26;
      g = 84 - st * 16;
      b = 34;
    }
    // 눈썹
    if (hy > -0.28 && hy < -0.18 && Math.abs(Math.abs(hx) - 0.36) < 0.18) {
      r = 150;
      g = 96;
      b = 46;
    }
    // 눈 — 청록빛 응시
    for (let i = -1; i <= 1; i += 2) {
      const de = Math.hypot(hx - i * 0.34, (hy + 0.04) * 1.4);
      if (de < 0.11) {
        r = 44;
        g = 64;
        b = 64;
      }
    }
    // 콧대 음영
    if (Math.abs(hx - 0.05) < 0.07 && hy > -0.1 && hy < 0.3) {
      r -= 18;
      g -= 16;
      b -= 8;
    }
  }
  return [r, g, b];
};
