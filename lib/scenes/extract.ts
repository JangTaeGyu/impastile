import type { PaintingData } from "./painting";

// ============================================================
// scripts/extract-painting.py의 브라우저 판(判).
// 임의의 이미지에서 색상 맵 + 붓결 방향장을 뽑아 PaintingData를 만든다.
// 파이썬 쪽은 빌드 타임에 <작품>Data.ts를 굽고, 이쪽은 런타임에 같은 것을
// 메모리에 만든다 — base64 왕복이 없을 뿐 파이프라인은 동일하다.
//
// 두 구현은 같은 결과를 내야 한다. 파이썬을 고치면 이 파일도 고친다.
// (수치 동등성은 scripts/verify-extract.mjs가 검사한다.)
//
// 아래 순수 함수들은 캔버스에 의존하지 않는다 — 타입 배열만 받고 돌려주므로
// 브라우저 밖에서도 그대로 돌릴 수 있다. 캔버스는 extractPainting()에만 있다.
// ============================================================

/** 색상 맵 최대 변 — 1080p에서 스트로크 격자가 약 149칸이라 그 언저리로 맞춘다 */
export const MAX_DIM = 144;
/** 방향장 계산용 중간 해상도. 색상 맵보다 커야 구조 텐서가 결을 잡는다 */
export const WORK_W = 432;

const clampI = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

/**
 * 분리형 가우시안 블러. 가장자리는 값을 복제해 늘린다(edge clamp).
 * numpy 판의 `np.pad(mode="edge")` + `np.convolve(mode="valid")`와 같다 —
 * 커널이 대칭이라 컨볼루션의 커널 뒤집기는 결과에 영향이 없고,
 * 축을 나눠 두 번 도는 것이 한 번에 패딩하고 도는 것과 동치다.
 */
export function gaussBlur(
  src: Float64Array,
  w: number,
  h: number,
  sigma: number,
): Float64Array {
  const rad = Math.trunc(sigma * 3) + 1;
  const k = new Float64Array(rad * 2 + 1);
  let sum = 0;
  for (let i = -rad; i <= rad; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    k[i + rad] = v;
    sum += v;
  }
  for (let i = 0; i < k.length; i++) k[i] /= sum;

  const tmp = new Float64Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let a = 0;
      for (let i = -rad; i <= rad; i++) {
        a += k[i + rad] * src[clampI(y + i, 0, h - 1) * w + x];
      }
      tmp[y * w + x] = a;
    }
  }
  const out = new Float64Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let a = 0;
      for (let i = -rad; i <= rad; i++) {
        a += k[i + rad] * tmp[row + clampI(x + i, 0, w - 1)];
      }
      out[row + x] = a;
    }
  }
  return out;
}

/** np.linspace(0, n-1, count).astype(int) — 끝점 포함, 정수 변환은 버림 */
function sampleIndices(n: number, count: number): Int32Array {
  const idx = new Int32Array(count);
  const step = (n - 1) / (count - 1);
  for (let i = 0; i < count; i++) idx[i] = Math.trunc(i * step);
  idx[count - 1] = n - 1;
  return idx;
}

/**
 * 휘도 맵에서 붓결 방향장을 뽑는다.
 *
 * 구조 텐서의 고유벡터가 그래디언트 주방향을 주고, 거기에 π를 더한 배각이
 * 등고선(=스트로크) 방향의 배각이다. 배각(2θ)으로 저장하는 이유는 스트로크가
 * 180° 대칭이기 때문 — 각도를 그대로 보간하면 뒤집힌다.
 *
 * 결이 없는 평평한 영역(하늘, 벽)은 방향이 잡히지 않는다. 코히런스로 가중한
 * 뒤 한 번 더 블러해 이웃의 방향을 끌어오게 한다.
 *
 * @param lum   0..255 휘도, lw*lh
 * @param outW  출력 방향장 가로 (색상 맵과 같은 크기)
 */
export function buildFlowField(
  lum: Float64Array,
  lw: number,
  lh: number,
  outW: number,
  outH: number,
): { c: Int8Array; s: Int8Array } {
  const n = lw * lh;
  const L = gaussBlur(lum, lw, lh, 1.2);

  // np.gradient — 내부는 중앙차분, 양끝은 한쪽차분
  const gx = new Float64Array(n);
  const gy = new Float64Array(n);
  for (let y = 0; y < lh; y++) {
    const row = y * lw;
    for (let x = 0; x < lw; x++) {
      gx[row + x] =
        x === 0
          ? L[row + 1] - L[row]
          : x === lw - 1
            ? L[row + x] - L[row + x - 1]
            : (L[row + x + 1] - L[row + x - 1]) / 2;
      gy[row + x] =
        y === 0
          ? L[lw + x] - L[x]
          : y === lh - 1
            ? L[row + x] - L[row - lw + x]
            : (L[row + lw + x] - L[row - lw + x]) / 2;
    }
  }

  const xx = new Float64Array(n);
  const yy = new Float64Array(n);
  const xy = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    xx[i] = gx[i] * gx[i];
    yy[i] = gy[i] * gy[i];
    xy[i] = gx[i] * gy[i];
  }
  const Jxx = gaussBlur(xx, lw, lh, 5);
  const Jyy = gaussBlur(yy, lw, lh, 5);
  const Jxy = gaussBlur(xy, lw, lh, 5);

  // 코히런스로 가중한 배각 벡터 — 방향이 뚜렷한 곳이 흐릿한 곳으로 번진다
  const cw = new Float64Array(n);
  const sw = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const d = Jxx[i] - Jyy[i];
    const twoTheta = Math.atan2(2 * Jxy[i], d) + Math.PI;
    const coh =
      Math.sqrt(d * d + 4 * Jxy[i] * Jxy[i]) / (Jxx[i] + Jyy[i] + 1e-9);
    cw[i] = Math.cos(twoTheta) * coh;
    sw[i] = Math.sin(twoTheta) * coh;
  }
  const c2 = gaussBlur(cw, lw, lh, 4);
  const s2 = gaussBlur(sw, lw, lh, 4);

  const ys = sampleIndices(lh, outH);
  const xs = sampleIndices(lw, outW);
  const c = new Int8Array(outW * outH);
  const s = new Int8Array(outW * outH);
  for (let j = 0; j < outH; j++) {
    const row = ys[j] * lw;
    for (let i = 0; i < outW; i++) {
      const src = row + xs[i];
      const norm = Math.sqrt(c2[src] * c2[src] + s2[src] * s2[src]) + 1e-9;
      const o = j * outW + i;
      c[o] = clampI(Math.round((c2[src] / norm) * 127), -127, 127);
      s[o] = clampI(Math.round((s2[src] / norm) * 127), -127, 127);
    }
  }
  return { c, s };
}

/** PIL의 `convert("L")`과 같은 ITU-R 601-2 가중치 */
export function luminance(
  rgba: Uint8ClampedArray,
  n: number,
): Float64Array {
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const p = i * 4;
    out[i] = rgba[p] * 0.299 + rgba[p + 1] * 0.587 + rgba[p + 2] * 0.114;
  }
  return out;
}

/** RGBA 픽셀에서 알파를 떼어낸다 — 씬은 불투명 RGB만 다룬다 */
export function stripAlpha(rgba: Uint8ClampedArray, n: number): Uint8Array {
  const out = new Uint8Array(n * 3);
  for (let i = 0; i < n; i++) {
    const p = i * 4;
    out[i * 3] = rgba[p];
    out[i * 3 + 1] = rgba[p + 1];
    out[i * 3 + 2] = rgba[p + 2];
  }
  return out;
}

/** 종횡비를 유지하며 최대 변을 maxDim으로 맞춘 색상 맵 크기 */
export function colorMapSize(
  w: number,
  h: number,
  maxDim = MAX_DIM,
): { w: number; h: number } {
  return w >= h
    ? { w: maxDim, h: Math.max(2, Math.round((maxDim * h) / w)) }
    : { w: Math.max(2, Math.round((maxDim * w) / h)), h: maxDim };
}

// ---- 여기부터는 브라우저 전용 (캔버스 필요) ----

/** 각 변에서 잘라낼 비율 (0..1) */
export interface Crop {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ExtractOptions {
  /** 액자 테두리·워터마크 잘라내기 */
  crop?: Crop;
  /** 색상 맵 최대 변. 키우면 디테일이 살지만 렌더러 셀도 같이 줄여야 한다 */
  maxDim?: number;
}

function makeCtx(w: number, h: number): CanvasRenderingContext2D {
  let cv: OffscreenCanvas | HTMLCanvasElement;
  if (typeof OffscreenCanvas !== "undefined") {
    cv = new OffscreenCanvas(w, h);
  } else {
    cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
  }
  const ctx = cv.getContext("2d") as CanvasRenderingContext2D | null;
  if (!ctx) throw new Error("2d context unavailable");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return ctx;
}

/**
 * 잘라낸 영역을 w×h로 축소해 픽셀을 읽는다.
 *
 * 한 번에 크게 줄이면 캔버스 필터가 원본 픽셀을 듬성듬성 집어 계단현상이
 * 남는다. 방향장은 그래디언트를 먹고 살기 때문에 그 앨리어싱이 그대로
 * 가짜 결로 둔갑한다. 한 단계에 최대 절반씩만 줄여 면적 평균에 가깝게 간다.
 */
function scaledPixels(
  src: ImageBitmap,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  w: number,
  h: number,
): Uint8ClampedArray {
  let tw = Math.max(w, sw >> 1);
  let th = Math.max(h, sh >> 1);
  let ctx = makeCtx(tw, th);
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, tw, th);

  while (tw > w || th > h) {
    const nw = Math.max(w, tw >> 1);
    const nh = Math.max(h, th >> 1);
    const next = makeCtx(nw, nh);
    next.drawImage(ctx.canvas, 0, 0, tw, th, 0, 0, nw, nh);
    ctx = next;
    tw = nw;
    th = nh;
  }
  return ctx.getImageData(0, 0, w, h).data;
}

/**
 * 임의의 이미지에서 PaintingData를 만든다.
 * 결과는 paintingScene()/paintingFlow()에 그대로 넣으면 된다.
 *
 * 원본 크기와 무관하게 색상 맵(≤144px)과 방향장(432px 중간 버퍼)만 다루므로
 * 비용은 입력 해상도에 거의 좌우되지 않는다.
 */
export async function extractPainting(
  source: ImageBitmapSource,
  opts: ExtractOptions = {},
): Promise<PaintingData> {
  const { crop, maxDim = MAX_DIM } = opts;
  const full = await createImageBitmap(source);
  try {
    // 경계는 버림으로 — 파이썬 판의 PIL crop()과 같은 픽셀을 잡는다
    const sx = Math.trunc(full.width * (crop?.left ?? 0));
    const sy = Math.trunc(full.height * (crop?.top ?? 0));
    const sw = Math.max(
      1,
      Math.trunc(full.width * (1 - (crop?.right ?? 0))) - sx,
    );
    const sh = Math.max(
      1,
      Math.trunc(full.height * (1 - (crop?.bottom ?? 0))) - sy,
    );

    const { w, h } = colorMapSize(sw, sh, maxDim);
    const rgb = stripAlpha(scaledPixels(full, sx, sy, sw, sh, w, h), w * h);

    // 방향장은 색상 맵보다 큰 버퍼에서 잡는다 — 144px에서는 결이 뭉개진다
    const lw = WORK_W;
    const lh = Math.max(2, Math.trunc((WORK_W * sh) / sw));
    const lum = luminance(scaledPixels(full, sx, sy, sw, sh, lw, lh), lw * lh);

    const { c, s } = buildFlowField(lum, lw, lh, w, h);
    return { w, h, rgb, flowC: c, flowS: s };
  } finally {
    full.close();
  }
}
