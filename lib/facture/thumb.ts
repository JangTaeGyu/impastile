import { factureSvg } from "./factureSvg";
import type { Work, WorkEntry } from "./types";

// 썸네일도 같은 붓결로 굽는다.
// 스트로크 기하를 세 번째로 베끼지 않으려고 factureSvg를 그대로 쓴다 —
// 이미 renderer.ts와 규칙을 맞춰 관리하는 코드다.

/** 띠에 놓이는 썸네일 높이(CSS px) */
export const THUMB_H = 72;
/** 썸네일 셀 — 본 화면(13)보다 잘게 썰어야 이 크기에서 형태가 남는다 */
const THUMB_CELL = 4;

// 작품 객체는 한 번 만들어지면 그대로라 신원으로 캐시한다
const cache = new WeakMap<Work, string>();

/** 작품의 썸네일 data URI. 작품마다 한 번만 굽는다. */
export function thumbSrc(work: Work): string {
  const hit = cache.get(work);
  if (hit) return hit;
  // 상자를 작품 비율에 맞추므로 썸네일 안에는 여백이 생기지 않는다
  const aspect = work.aspect ?? 1.4;
  const svg = factureSvg({
    scene: work.scene,
    flow: work.flow,
    aspect,
    width: thumbWidth(aspect),
    height: THUMB_H,
    cell: THUMB_CELL,
  });
  const src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  cache.set(work, src);
  return src;
}

/**
 * 썸네일 상자 너비. 데이터를 받기 전에도 WorkEntry.aspect로 구할 수 있어
 * 자리를 미리 잡아둔다 — 나중에 채우면 띠가 덜컹거린다.
 */
export function thumbWidth(aspectOrEntry: number | WorkEntry): number {
  const a =
    typeof aspectOrEntry === "number" ? aspectOrEntry : aspectOrEntry.aspect;
  return Math.max(24, Math.round(THUMB_H * a));
}
