import { exhibits } from "@/lib/scenes";
import type { Artist } from "@/lib/scenes/types";
import { DESCRIPTION, NAME, SITE_URL, TITLE, splitSub } from "@/lib/site";

/**
 * schema.org 구조화 데이터. 화면에 그림만 있는 사이트라 크롤러가 글로 읽을 게
 * 거의 없다 — 무엇이 걸려 있는지는 여기와 `app/page.tsx`의 개요가 말한다.
 * 검사는 https://validator.schema.org 또는 리치 결과 테스트로 한다.
 */

/**
 * `JSON.stringify`는 `</script>`를 막아주지 않는다. 지금은 값이 전부 코드
 * 안에 있지만 '나의 전시관'처럼 바깥에서 들어올 문자열이 붙을 수 있으니
 * `<`를 유니코드로 바꿔 넣는다.
 */
export const jsonLdScript = (data: unknown) =>
  JSON.stringify(data).replace(/</g, "\\u003c");

const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * 같은 작가를 42번 적지 않도록 @id로 한 번만 세우고 작품에서는 가리키기만 한다.
 * NFD로 풀어 결합 문자를 떼고 슬러그를 만든다 — 안 그러면 Cézanne이
 * `paul-c-zanne`이 된다.
 */
const personId = (artist: Artist) =>
  `${SITE_URL}/#${artist.en
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, "-")}`;

const website = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: SITE_URL,
  name: NAME,
  description: DESCRIPTION,
  inLanguage: "ko-KR",
};

/** 갤러리(홈) — 전시관 전체를 ImageGallery 한 장으로 편다 */
export function galleryJsonLd() {
  const artists = exhibits.flatMap((e) => (e.artist ? [e.artist] : []));

  const artworks = exhibits.flatMap((e) => {
    const artist = e.artist;
    if (!artist) return []; // '나의 전시관'은 런타임에만 있어 여기 오지 않는다
    return e.works.map((w) => {
      const { original, year } = splitSub(w.sub);
      return {
        "@type": "VisualArtwork",
        name: w.title,
        alternateName: original,
        description: w.desc,
        artform: "Painting",
        genre: artist.movement,
        // dateCreated는 날짜 자리다. '1900–1906'·'1893년경'처럼 한 해로
        // 떨어지지 않는 작품은 미술관 목록과 같이 첫 해로 적고, 원래 표기는
        // 개요의 글에 그대로 남는다.
        dateCreated: year.match(/\d{4}/)?.[0],
        creator: { "@id": personId(artist) },
      };
    });
  });

  return {
    "@context": "https://schema.org",
    "@graph": [
      website,
      ...artists.map((a) => ({
        "@type": "Person",
        "@id": personId(a),
        name: a.en,
        alternateName: a.ko,
        jobTitle: "Painter",
      })),
      {
        "@type": "ImageGallery",
        "@id": `${SITE_URL}/#gallery`,
        url: SITE_URL,
        name: TITLE,
        description: DESCRIPTION,
        inLanguage: "ko-KR",
        isPartOf: { "@id": WEBSITE_ID },
        hasPart: artworks,
      },
    ],
  };
}

/** /about — 빵부스러기를 함께 두면 검색 결과에 갤러리 › 소개로 뜬다 */
export function aboutJsonLd(title: string, description: string) {
  const url = `${SITE_URL}/about`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      website,
      {
        "@type": "AboutPage",
        "@id": `${url}#page`,
        url,
        name: title,
        description,
        inLanguage: "ko-KR",
        isPartOf: { "@id": WEBSITE_ID },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: NAME, item: SITE_URL },
          { "@type": "ListItem", position: 2, name: title, item: url },
        ],
      },
    ],
  };
}
