import { exhibits } from "@/lib/scenes";

/**
 * 사이트 전체가 함께 보는 값들. 제목·설명은 <head>와 JSON-LD와 숨은 개요가
 * 같은 문장을 써야 하고, 주소는 canonical·robots.txt·sitemap.xml·JSON-LD가
 * 모두 같은 곳을 가리켜야 한다 — 한 군데서 어긋나면 검색엔진이 다른 문서로 센다.
 */

/**
 * 절대 URL의 기준. 배포 도메인이 기본값이고, 프리뷰·로컬에서 다른 주소를
 * 쓰려면 NEXT_PUBLIC_SITE_URL로 덮는다. 뒤의 슬래시는 떼어 둔다 —
 * 아래에서 `${SITE_URL}/...`로 이어 붙이므로 남으면 `//`가 된다.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://impastile.jubrolab.dev"
).replace(/\/+$/, "");

export const NAME = "Impastile";

// 작품 수는 세지 않고 전시관에서 받는다 — 작가가 늘면 카피도 따라 는다.
// (공유 카드 문구가 {count}를 다루는 방식과 같다. 카드 쪽은 lib/ogCopy.json이다.)
export const COUNT = exhibits.reduce((n, e) => n + e.works.length, 0);

// 제목에 작가를 박지 않는다. 한 사람을 가리키면 나머지 전시관이 지워지고,
// 이름을 다 적으면 작가가 늘 때마다 여기도 고쳐야 한다. 대신 무엇을 하는
// 갤러리인지를 적고, 작가는 설명과 공유 카드의 kicker가 맡는다.
export const TITLE = "Impastile — Directional Impasto";

/** 전시관에 실제로 걸린 작가 이름 — 작가가 늘면 설명과 검색어가 같이 는다 */
const ARTIST_NAMES = exhibits.flatMap((e) => (e.artist ? [e.artist] : []));

export const DESCRIPTION =
  `${ARTIST_NAMES.map((a) => a.ko).join(" · ")}의 회화 ${COUNT}점을 원화가 ` +
  "실제로 그어진 붓결 방향을 따라 임파스토 붓터치 하나하나로 다시 그리는 웹 갤러리";

/**
 * <meta name="keywords">. 구글은 오래전에 무시하지만 네이버·다음 쪽에서는
 * 아직 읽는 자리라 작가 이름만이라도 한글·영문으로 함께 남겨둔다.
 */
export const KEYWORDS = [
  "임파스토",
  "붓터치",
  "명화 갤러리",
  "인상주의",
  "후기 인상주의",
  "제너러티브 아트",
  "impasto",
  "brushstroke",
  "generative art",
  ...ARTIST_NAMES.flatMap((a) => [a.ko, a.en]),
];

/**
 * WorkEntry.sub는 `원제 · 연도 · 소장처` 한 줄이다.
 * 구조화 데이터와 개요에서는 이걸 셋으로 갈라 쓴다.
 */
export function splitSub(sub: string) {
  const [original = "", year = "", holder = ""] = sub.split(" · ");
  return { original, year, holder };
}
