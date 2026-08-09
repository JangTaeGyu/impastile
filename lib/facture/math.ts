export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const clamp = (v: number, a: number, b: number) =>
  v < a ? a : v > b ? b : v;

export const frac = (x: number) => x - Math.floor(x);

export function smooth(e0: number, e1: number, x: number) {
  x = clamp((x - e0) / (e1 - e0), 0, 1);
  return x * x * (3 - 2 * x);
}

/** 셀 좌표 (a, b) → 0..1 의 결정적 의사 난수 */
export function hash(a: number, b: number) {
  return frac(Math.sin(a * 12.9898 + b * 78.233 + 9.17) * 43758.5453);
}

/** 문자열 → 31진 롤링 해시 (compose 시드용) */
export function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
