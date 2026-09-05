// OG 카드에 쓰는 한글 폰트 서브셋을 굽는다.
//
// 한글 전체를 담은 폰트는 수 MB라 리포에 두기 부담스럽고, next/og 기본 폰트에는
// 한글 글리프가 없어 그대로 두면 두부(□)가 된다. 그래서 카드에 실제로 쓰인 글자만
// Google Fonts의 `text=` 서브셋으로 받는다.
//
//   node scripts/fetch-og-font.mjs
//
// 글자는 두 곳에서 온다.
//
//   lib/ogCopy.json      루트 카드의 문구
//   lib/scenes/index.ts  작품 낱장 카드에 실리는 제목·원제·소장처·작가 이름
//                        (title / sub / name — 키 이름을 고치면 아래 pick도 고친다)
//
// 둘 중 하나라도 고치면 다시 돌린다 — 빠뜨리면 새 글자가 카드에서 두부로 나온다.
// 결과물은 커밋해서 빌드가 네트워크 없이도 되게 한다.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COPY = join(ROOT, "lib/ogCopy.json");
const SCENES = join(ROOT, "lib/scenes/index.ts");
const OUT_DIR = join(ROOT, "assets/og");
const FAMILY = "Noto Sans KR";
const WEIGHTS = [400, 700];

// satori는 woff2를 못 읽는다. woff2를 모르는 옛 UA로 요청해야 woff를 준다.
const LEGACY_UA =
  "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.116 Safari/537.36";

/** 문자열·배열·객체 어디에 있든 모든 문자를 긁어모은다 */
const flatten = (v) =>
  Array.isArray(v)
    ? v.map(flatten).join("")
    : v && typeof v === "object"
      ? Object.values(v).map(flatten).join("")
      : String(v);

const copy = JSON.parse(await readFile(COPY, "utf8"));

// 작품 낱장 카드(app/work/[slug]/opengraph-image.tsx)는 작가 이름과 제목과 sub를
// 그대로 얹는다. 레지스트리를 import할 수는 없어서(TS에 무거운 지연 import가 딸려
// 있다) 글자만 훑어 긁는다. 갯수를 세어두는 것은 파일 모양이 바뀌면 조용히
// 빈손으로 끝나기 때문이다 — 그 경우 카드가 통째로 두부가 된다.
const scenes = await readFile(SCENES, "utf8");
const pick = (key, least) => {
  const found = [...scenes.matchAll(new RegExp(`\\b${key}: "((?:[^"\\\\]|\\\\.)*)"`, "g"))];
  if (found.length < least) {
    throw new Error(`lib/scenes/index.ts에서 ${key}를 ${least}개 이상 기대했으나 ${found.length}개`);
  }
  return found.map((m) => m[1]).join("");
};
const fromScenes = pick("title", 42) + pick("sub", 42) + pick("name", 4);

// {count} 자리에 어떤 숫자가 오든 렌더되도록 0–9는 항상 포함한다
const chars = [...new Set(flatten(copy) + fromScenes + "0123456789")]
  .sort()
  .join("");

const cssUrl =
  `https://fonts.googleapis.com/css2?family=${encodeURIComponent(FAMILY)}` +
  `:wght@${WEIGHTS.join(";")}&text=${encodeURIComponent(chars)}`;

const css = await fetch(cssUrl, { headers: { "User-Agent": LEGACY_UA } }).then(
  (r) => {
    if (!r.ok) throw new Error(`css ${r.status} ${r.statusText}`);
    return r.text();
  },
);

const faces = [...css.matchAll(/font-weight:\s*(\d+);\s*src:\s*url\(([^)]+)\)/g)];
if (faces.length !== WEIGHTS.length) {
  throw new Error(`@font-face ${WEIGHTS.length}개를 기대했으나 ${faces.length}개`);
}

await mkdir(OUT_DIR, { recursive: true });
for (const [, weight, url] of faces) {
  const buf = Buffer.from(
    await fetch(url, { headers: { "User-Agent": LEGACY_UA } }).then((r) => {
      if (!r.ok) throw new Error(`font ${r.status} ${r.statusText}`);
      return r.arrayBuffer();
    }),
  );
  const name = `noto-sans-kr-${weight}.woff`;
  await writeFile(join(OUT_DIR, name), buf);
  console.log(`${name}  ${(buf.length / 1024).toFixed(1)} KB`);
}

console.log(`글리프 ${chars.length}자`);
