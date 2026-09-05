import { clamp } from "@/lib/facture/math";
import type { FlowFn, RGB, Scene } from "@/lib/facture/types";

// ============================================================
// 원본 회화 샘플링 공용 모듈.
// scripts/extract-painting.py가 만든 데이터(색상 맵 + 배각 2θ
// 붓결 방향장)를 디코드하고, 쌍선형 샘플링 씬/방향장을 만든다.
// ============================================================

export interface PaintingData {
  w: number;
  h: number;
  rgb: Uint8Array;
  flowC: Int8Array;
  flowS: Int8Array;
}

function decode(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function decodePainting(
  w: number,
  h: number,
  rgbB64: string,
  flowB64: string,
): PaintingData {
  const flowRaw = decode(flowB64);
  return {
    w,
    h,
    rgb: decode(rgbB64),
    flowC: new Int8Array(flowRaw.buffer, 0, w * h),
    flowS: new Int8Array(flowRaw.buffer, w * h, w * h),
  };
}

/** (nx, ny) 지점의 붓결 각도 */
type FlowSampler = (u: number, v: number) => number;

/** 배각(2θ) 벡터를 쌍선형 보간해 스트로크 각도를 얻는다 */
function flowAt(d: PaintingData, u: number, v: number): number {
  const x = clamp(u, 0, 1) * (d.w - 1);
  const y = clamp(v, 0, 1) * (d.h - 1);
  const x0 = x | 0;
  const y0 = y | 0;
  const x1 = Math.min(x0 + 1, d.w - 1);
  const y1 = Math.min(y0 + 1, d.h - 1);
  const fx = x - x0;
  const fy = y - y0;
  const i00 = y0 * d.w + x0;
  const i01 = y0 * d.w + x1;
  const i10 = y1 * d.w + x0;
  const i11 = y1 * d.w + x1;
  const w00 = (1 - fx) * (1 - fy);
  const w01 = fx * (1 - fy);
  const w10 = (1 - fx) * fy;
  const w11 = fx * fy;
  const c =
    d.flowC[i00] * w00 +
    d.flowC[i01] * w01 +
    d.flowC[i10] * w10 +
    d.flowC[i11] * w11;
  const s =
    d.flowS[i00] * w00 +
    d.flowS[i01] * w01 +
    d.flowS[i10] * w10 +
    d.flowS[i11] * w11;
  return Math.atan2(s, c) / 2;
}

/**
 * flowAt 결과를 한 칸 기억하는 샘플러.
 *
 * 렌더러는 같은 지점에 대해 씬(색 표류에 각도가 필요하다)과 방향장을 잇달아
 * 부른다. 둘이 각자 flowAt을 돌면 같은 쌍선형 보간 + atan2를 셀마다 두 번
 * 하게 되므로, 한 벌만 계산하고 두 번째 호출은 여기서 되돌려준다.
 */
function flowSampler(d: PaintingData): FlowSampler {
  let lu = NaN;
  let lv = NaN;
  let la = 0;
  return (u, v) => {
    if (u === lu && v === lv) return la;
    lu = u;
    lv = v;
    return (la = flowAt(d, u, v));
  };
}

/**
 * 원화를 쌍선형 샘플링하는 씬.
 * 붓결 방향으로 색 샘플을 미세하게 표류시켜 물감이 흐르는 미동을 주고,
 * 스크린 표시 손실을 보상하는 채도·밝기 보정을 얹는다.
 *
 * 돌려주는 배열은 **매번 같은 것을 다시 쓴다** (Scene 규약 — types.ts 참고).
 * 프레임당 1만 번 넘게 불리므로 셀마다 새로 만들 수 없다.
 */
export function paintingScene(
  d: PaintingData,
  sat = 1.28,
  gain = 1.07,
  at: FlowSampler = flowSampler(d),
): Scene {
  const out: RGB = [0, 0, 0];
  return (nx, ny, t, ar) => {
    const a = at(nx, ny);
    const drift = 0.003 * Math.sin(t * 0.7 + nx * 13 + ny * 7);
    const u = clamp(nx + (Math.cos(a) * drift) / Math.max(ar, 1e-3), 0, 1);
    const v = clamp(ny + Math.sin(a) * drift, 0, 1);
    const x = u * (d.w - 1);
    const y = v * (d.h - 1);
    const x0 = x | 0;
    const y0 = y | 0;
    const x1 = Math.min(x0 + 1, d.w - 1);
    const y1 = Math.min(y0 + 1, d.h - 1);
    const fx = x - x0;
    const fy = y - y0;
    const i00 = (y0 * d.w + x0) * 3;
    const i01 = (y0 * d.w + x1) * 3;
    const i10 = (y1 * d.w + x0) * 3;
    const i11 = (y1 * d.w + x1) * 3;
    const w00 = (1 - fx) * (1 - fy);
    const w01 = fx * (1 - fy);
    const w10 = (1 - fx) * fy;
    const w11 = fx * fy;
    const rgb = d.rgb;
    const r =
      rgb[i00] * w00 + rgb[i01] * w01 + rgb[i10] * w10 + rgb[i11] * w11;
    const g =
      rgb[i00 + 1] * w00 +
      rgb[i01 + 1] * w01 +
      rgb[i10 + 1] * w10 +
      rgb[i11 + 1] * w11;
    const b =
      rgb[i00 + 2] * w00 +
      rgb[i01 + 2] * w01 +
      rgb[i10 + 2] * w10 +
      rgb[i11 + 2] * w11;
    const l = r * 0.3 + g * 0.6 + b * 0.1;
    out[0] = (l + (r - l) * sat) * gain;
    out[1] = (l + (g - l) * sat) * gain;
    out[2] = (l + (b - l) * sat) * gain;
    return out;
  };
}

export function paintingFlow(
  d: PaintingData,
  at: FlowSampler = flowSampler(d),
): FlowFn {
  return (nx, ny) => at(nx, ny);
}

/**
 * Work에 그대로 펼쳐 넣는 세 조각.
 * aspect가 빠지면 렌더러가 화면을 늘려 채우므로 붓결 각도까지 눕는다 —
 * 셋을 따로 두지 않고 한 번에 만드는 이유다.
 *
 * 씬과 방향장은 **같은 샘플러를 나눠 쓴다**. 렌더러가 한 지점에 대해 둘을
 * 잇달아 부르므로, 따로 만들면 방향 계산이 그대로 두 벌이 된다.
 */
export function paintingWork(d: PaintingData, sat?: number, gain?: number) {
  const at = flowSampler(d);
  return {
    scene: paintingScene(d, sat, gain, at),
    flow: paintingFlow(d, at),
    aspect: d.w / d.h,
  };
}
