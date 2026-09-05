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

// ── 붓결을 따라 흐르는 물감 ────────────────────────────────────────────────
// 방향장은 지점마다 붓이 그어진 방향을 안다. 그 방향으로 **색을 실어 나르면**
// 스트로크는 제자리에 선 채 물감만 결을 따라 흘러간다.
//
// 스트로크 자체를 밀지 않는 이유는 둘이다. 임파스토는 굳은 물감이라 붓 자국이
// 헤엄치면 안 되고, 무엇보다 길쭉한 사각형을 제 축으로 밀어봐야 자기 위에
// 겹쳐서 아무것도 보이지 않는다 (길이의 1/4을 밀어도 3/4이 같은 자리다).
// 눈에 보이는 것은 결을 따라 흐르는 색이지 사각형의 이동이 아니다.
//
// 한 방향으로 계속 밀면 그림이 떠내려가므로 일정 거리에서 되감아야 하는데,
// 그 순간이 그대로 보이면 화면이 튄다. 그래서 반 주기 어긋난 두 벌을 나란히
// 흘리고 삼각 가중으로 겹친다 — 되감는 쪽은 가중치가 0이라 튐이 보이지 않고,
// 두 가중치의 합은 항상 1이라 밝기도 흔들리지 않는다.

/** 한 주기 동안 색이 결을 따라 나아가는 거리 (그림 높이 대비) */
const FLOW_REACH = 0.024;
/** 되감기 주기(Hz). 체감 속도는 REACH × SPEED — 초당 그림 높이의 약 1% */
const FLOW_SPEED = 0.42;

/**
 * (u, v)의 색을 쌍선형 보간해 w 가중으로 acc에 **더한다**.
 * 프레임당 2만 번 넘게 불리는 자리라 배열을 만들지 않고 받은 것에 누적한다.
 */
function addSample(d: PaintingData, u: number, v: number, w: number, acc: RGB) {
  const x = clamp(u, 0, 1) * (d.w - 1);
  const y = clamp(v, 0, 1) * (d.h - 1);
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
  const w00 = (1 - fx) * (1 - fy) * w;
  const w01 = fx * (1 - fy) * w;
  const w10 = (1 - fx) * fy * w;
  const w11 = fx * fy * w;
  const rgb = d.rgb;
  acc[0] += rgb[i00] * w00 + rgb[i01] * w01 + rgb[i10] * w10 + rgb[i11] * w11;
  acc[1] +=
    rgb[i00 + 1] * w00 +
    rgb[i01 + 1] * w01 +
    rgb[i10 + 1] * w10 +
    rgb[i11 + 1] * w11;
  acc[2] +=
    rgb[i00 + 2] * w00 +
    rgb[i01 + 2] * w01 +
    rgb[i10 + 2] * w10 +
    rgb[i11 + 2] * w11;
}

/**
 * 원화를 쌍선형 샘플링하는 씬.
 * 붓결 방향으로 색을 실어 날라 물감이 결을 따라 흐르게 하고,
 * 스크린 표시 손실을 보상하는 채도·밝기 보정을 얹는다.
 *
 * `t = 0`에서는 두 벌 중 흐르지 않은 쪽만 남으므로 원화를 그대로 샘플링한다 —
 * 서버가 굽는 공유 카드와 썸네일(`factureSvg`)이 t를 넘기지 않는 자리다.
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
  // 흐름의 위상은 t에만 달렸다 — 한 프레임의 셀 1만 개가 같은 값을 본다
  let lt = NaN;
  let o0 = 0;
  let o1 = 0;
  let w0 = 0;
  let w1 = 1;
  return (nx, ny, t, ar) => {
    if (t !== lt) {
      lt = t;
      const p = t * FLOW_SPEED;
      const f0 = p - Math.floor(p);
      const f1 = f0 < 0.5 ? f0 + 0.5 : f0 - 0.5;
      // 각 벌은 -REACH/2에서 +REACH/2까지 나아갔다가 처음으로 돌아간다
      o0 = (f0 - 0.5) * FLOW_REACH;
      o1 = (f1 - 0.5) * FLOW_REACH;
      // 되감는 순간(f=0)에 가중치가 0이라 그 벌은 보이지 않는다
      w0 = 1 - Math.abs(f0 * 2 - 1);
      w1 = 1 - w0;
    }
    const a = at(nx, ny);
    // 정규 좌표는 가로가 ar배로 눌려 있다 — 되돌려야 이동이 등방이다
    const kx = Math.cos(a) / Math.max(ar, 1e-3);
    const ky = Math.sin(a);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    addSample(d, nx + kx * o0, ny + ky * o0, w0, out);
    addSample(d, nx + kx * o1, ny + ky * o1, w1, out);
    const r = out[0];
    const g = out[1];
    const b = out[2];
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
