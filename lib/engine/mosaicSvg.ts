import { clamp, hash, smooth } from "./math";
import { DEFAULT_FLOW } from "./renderer";
import type { FlowFn, Scene } from "./types";

// ============================================================
// 캔버스 없이 한 프레임을 SVG 문자열로 굽는다.
// OG 이미지(next/og)는 서버에서 생성되므로 CanvasRenderingContext2D를
// 쓸 수 없다. 스트로크 기하·색 보정 규칙은 renderer.ts와 같게 유지한다.
// ============================================================

const BG = "#0a0c19";

export interface MosaicSvgOptions {
  scene: Scene;
  flow?: FlowFn;
  width: number;
  height: number;
  /** 타일 한 변의 픽셀 크기 */
  cell: number;
  /** 샘플링할 시각(초) — 정지 이미지이므로 기본 0 */
  t?: number;
}

/** 소수점 둘째 자리까지 — 문자열 길이를 줄인다 */
const n = (v: number) => Math.round(v * 100) / 100;

export function mosaicSvg({
  scene,
  flow = DEFAULT_FLOW,
  width,
  height,
  cell,
  t = 0,
}: MosaicSvgOptions): string {
  const ar = width / height;
  const cols = Math.ceil(width / cell) + 1;
  const rows = Math.ceil(height / cell) + 1;
  const out: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="${BG}"/>`,
  ];

  // 회전 스트로크가 가장자리를 비우지 않도록 한 셀 바깥부터 그린다
  for (let rI = -1; rI < rows; rI++) {
    for (let cI = -1; cI < cols; cI++) {
      const nx = ((cI + 0.5) * cell) / width;
      const ny = ((rI + 0.5) * cell) / height;
      const c = scene(nx, ny, t, ar);
      const a = flow(nx, ny, t, ar);
      let rr = c[0];
      let gg = c[1];
      let bb = c[2];
      // 임파스토: 셀별 붓값 + 밝은 셀 블룸 (미동은 정지 이미지에서 생략)
      const lum = (rr * 0.3 + gg * 0.6 + bb * 0.1) / 255;
      const brush = 1 + (hash(cI, rI) - 0.5) * 0.16;
      const bright = brush * (1 + 0.5 * smooth(0.62, 1.0, lum));
      rr = clamp(rr * bright, 0, 255) | 0;
      gg = clamp(gg * bright, 0, 255) | 0;
      bb = clamp(bb * bright, 0, 255) | 0;
      // 스트로크 기하 — 길이·폭·위치가 셀마다 조금씩 다르다
      const len = cell * (1.7 + hash(cI, rI + 13) * 0.6);
      const wdt = cell * (0.5 + hash(cI + 5, rI) * 0.26);
      const px = cI * cell + cell / 2 + (hash(cI, rI + 7) - 0.5) * cell * 0.5;
      const py = rI * cell + cell / 2 + (hash(cI + 3, rI) - 0.5) * cell * 0.5;
      const deg = (a * 180) / Math.PI;

      out.push(
        `<g transform="translate(${n(px)} ${n(py)}) rotate(${n(deg)})">`,
        `<rect x="${n(-len / 2)}" y="${n(-wdt / 2)}" width="${n(len)}" height="${n(wdt)}" fill="rgb(${rr},${gg},${bb})"/>`,
      );
      // 물감이 솟은 릿지 — 어두운 셀에서는 보이지 않으므로 생략
      if (lum > 0.1) {
        const hr = clamp(rr * 1.18 + 14, 0, 255) | 0;
        const hg = clamp(gg * 1.18 + 14, 0, 255) | 0;
        const hb = clamp(bb * 1.14 + 10, 0, 255) | 0;
        out.push(
          `<rect x="${n(-len / 2 + len * 0.08)}" y="${n(-wdt / 2)}" width="${n(len * 0.84)}" height="${n(wdt * 0.3)}" fill="rgb(${hr},${hg},${hb})"/>`,
        );
      }
      out.push("</g>");
    }
  }

  out.push("</svg>");
  return out.join("");
}
