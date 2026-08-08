import { clamp } from "@/lib/engine/math";
import type { FlowFn, Scene } from "@/lib/engine/types";
import { FLOW_C, FLOW_S, IMG_H, IMG_W, RGB } from "./starryNightData";

// ============================================================
// 별이 빛나는 밤에 (The Starry Night, 1889)
// 원본 회화를 내장 색상 맵으로 직접 샘플링한다. 붓결 방향은
// 원화의 구조 텐서(등고선 방향)에서 추출한 방향장을 따른다 —
// 소용돌이·언덕·사이프러스 모두 반 고흐가 그은 결 그대로 흐른다.
// ============================================================

/** 배각(2θ) 벡터를 쌍선형 보간해 스트로크 각도를 얻는다 */
function flowAt(u: number, v: number): number {
  const x = clamp(u, 0, 1) * (IMG_W - 1);
  const y = clamp(v, 0, 1) * (IMG_H - 1);
  const x0 = x | 0;
  const y0 = y | 0;
  const x1 = Math.min(x0 + 1, IMG_W - 1);
  const y1 = Math.min(y0 + 1, IMG_H - 1);
  const fx = x - x0;
  const fy = y - y0;
  const i00 = y0 * IMG_W + x0;
  const i01 = y0 * IMG_W + x1;
  const i10 = y1 * IMG_W + x0;
  const i11 = y1 * IMG_W + x1;
  const w00 = (1 - fx) * (1 - fy);
  const w01 = fx * (1 - fy);
  const w10 = (1 - fx) * fy;
  const w11 = fx * fy;
  const c =
    FLOW_C[i00] * w00 + FLOW_C[i01] * w01 + FLOW_C[i10] * w10 + FLOW_C[i11] * w11;
  const s =
    FLOW_S[i00] * w00 + FLOW_S[i01] * w01 + FLOW_S[i10] * w10 + FLOW_S[i11] * w11;
  return Math.atan2(s, c) / 2;
}

export const sceneStarry: Scene = (nx, ny, t, ar) => {
  // 붓결 방향으로 아주 살짝 표류시켜 물감이 흐르는 듯한 미동을 준다
  const a = flowAt(nx, ny);
  const drift = 0.003 * Math.sin(t * 0.7 + nx * 13 + ny * 7);
  const u = clamp(nx + (Math.cos(a) * drift) / Math.max(ar, 1e-3), 0, 1);
  const v = clamp(ny + Math.sin(a) * drift, 0, 1);
  // 색상 맵 쌍선형 샘플링
  const x = u * (IMG_W - 1);
  const y = v * (IMG_H - 1);
  const x0 = x | 0;
  const y0 = y | 0;
  const x1 = Math.min(x0 + 1, IMG_W - 1);
  const y1 = Math.min(y0 + 1, IMG_H - 1);
  const fx = x - x0;
  const fy = y - y0;
  const i00 = (y0 * IMG_W + x0) * 3;
  const i01 = (y0 * IMG_W + x1) * 3;
  const i10 = (y1 * IMG_W + x0) * 3;
  const i11 = (y1 * IMG_W + x1) * 3;
  const w00 = (1 - fx) * (1 - fy);
  const w01 = fx * (1 - fy);
  const w10 = (1 - fx) * fy;
  const w11 = fx * fy;
  const r =
    RGB[i00] * w00 + RGB[i01] * w01 + RGB[i10] * w10 + RGB[i11] * w11;
  const g =
    RGB[i00 + 1] * w00 +
    RGB[i01 + 1] * w01 +
    RGB[i10 + 1] * w10 +
    RGB[i11 + 1] * w11;
  const b =
    RGB[i00 + 2] * w00 +
    RGB[i01 + 2] * w01 +
    RGB[i10 + 2] * w10 +
    RGB[i11 + 2] * w11;
  // 스크린 표시·스크림 보정: 채도와 밝기를 살짝 끌어올려 원화의 생기를 되살린다
  const l = r * 0.3 + g * 0.6 + b * 0.1;
  return [
    (l + (r - l) * 1.28) * 1.07,
    (l + (g - l) * 1.28) * 1.07,
    (l + (b - l) * 1.28) * 1.07,
  ];
};

export const flowStarry: FlowFn = (nx, ny) => flowAt(nx, ny);
