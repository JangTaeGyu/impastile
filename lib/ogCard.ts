import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * 공유 카드 두 장이 함께 쓰는 것들.
 *
 *   app/opengraph-image.tsx             갤러리 카드 ('별이 빛나는 밤에')
 *   app/work/[slug]/opengraph-image.tsx 작품 낱장 카드 (마흔두 장)
 *
 * 한쪽만 고치면 같은 사이트의 카드 두 종류가 서로 다른 옷을 입는다.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export const SHADOW = "0 2px 24px rgba(0,0,0,.85)";

/**
 * UI가 놓인 모서리만 눌러 글자가 읽히게 한다 — 중앙 그림은 건드리지 않는다.
 * 좌상단 띠가 넓은 것은 워드마크 때문이다. '해바라기'처럼 밝은 작품에서는
 * 호박색 TILE이 노란 꽃 위에 얹혀 사라지는데, 글자가 놓인 폭(약 300px)까지
 * 눌러야 읽힌다.
 */
export const SCRIM =
  "radial-gradient(ellipse 760px 340px at 0% 0%, rgba(5,7,18,.9), rgba(5,7,18,.5) 44%, transparent 78%)," +
  "radial-gradient(ellipse 1080px 640px at 100% 100%, rgba(5,7,18,.93), rgba(5,7,18,.66) 52%, transparent 80%)," +
  "linear-gradient(0deg, rgba(5,7,18,.72), rgba(5,7,18,.3) 34%, transparent 62%)";

/** 로고 마크 — 카드에 얹을 수 있게 data URI로 */
export const markSrc = `data:image/svg+xml;base64,${(
  await readFile(join(process.cwd(), "app/icon.svg"))
).toString("base64")}`;

// next/og 기본 폰트에는 한글이 없다. scripts/fetch-og-font.mjs가 구워둔
// 서브셋(카드에 실제로 쓰인 글자만)을 얹는다.
const font = (weight: 400 | 700) =>
  readFile(join(process.cwd(), `assets/og/noto-sans-kr-${weight}.woff`)).then(
    (data) => ({ name: "Noto Sans KR", data, weight, style: "normal" as const }),
  );

export const fonts = await Promise.all([font(400), font(700)]);
