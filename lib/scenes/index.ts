import type { Artist, Exhibit } from "./types";
import type { WorkEntry } from "@/lib/engine/types";
import { paintingWork } from "./painting";

// 작품 데이터(색상 맵 + 방향장)는 한 점당 gzip 약 75KB다. 12점을 모두 번들에
// 넣으면 첫 화면에서 900KB를 받고 시작한다. 그래서 여기에는 글로 된 정보만 두고
// 무거운 쪽은 load()의 동적 import로 미룬다 — 지금 보는 작품부터 받고 나머지는
// 뒤에서 한 점씩 따라온다 (lib/scenes/load.ts).
//
// aspect는 손으로 적은 값이다. 데이터를 다시 뽑았는데 여기를 안 고치면
// loadWork가 개발 모드에서 경고한다.

/** 타일 한 변의 CSS 픽셀 크기 — 갤러리 안에서 붓터치 크기가 흔들리지 않게 */
const CELL = 13;

export const ARTIST: Artist = {
  ko: "빈센트 반 고흐",
  en: "Vincent van Gogh",
  era: "1853–1890",
  movement: "후기 인상주의",
};

export const baseWorks: WorkEntry[] = [
  {
    title: "별이 빛나는 밤에",
    sub: "The Starry Night · 1889 · 뉴욕 현대미술관",
    desc: "생레미 요양원 창밖의 새벽. 소용돌이치는 밤하늘 아래 사이프러스가 검은 불꽃처럼 솟는다.",
    cell: CELL,
    aspect: 144 / 107,
    load: () => import("./starryNightData").then((m) => paintingWork(m.data)),
  },
  {
    title: "해바라기",
    sub: "Sunflowers · 1888 · 런던 내셔널 갤러리",
    desc: "아를에서 고갱을 기다리며 그린 연작. 크롬 옐로만으로 빚어낸 열다섯 송이의 태양.",
    cell: CELL,
    aspect: 114 / 144,
    load: () => import("./sunflowersData").then((m) => paintingWork(m.data)),
  },
  {
    title: "밤의 카페 테라스",
    sub: "Café Terrace at Night · 1888 · 크뢸러뮐러 미술관",
    desc: "검정 없이 그린 밤. 가스등의 노랑과 코발트 밤하늘이 테라스에서 맞닿는다.",
    cell: CELL,
    aspect: 115 / 144,
    load: () => import("./cafeTerraceData").then((m) => paintingWork(m.data)),
  },
  {
    title: "아를의 침실",
    sub: "Bedroom in Arles · 1888 · 반 고흐 미술관",
    desc: "아를 노란 집의 침실. 기울어진 원근과 보색의 병치가 '완전한 휴식'을 그린다.",
    cell: CELL,
    aspect: 144 / 114,
    load: () => import("./bedroomData").then((m) => paintingWork(m.data)),
  },
  {
    title: "자화상",
    sub: "Self-Portrait · 1887 · 시카고 미술관",
    desc: "파리 시절의 자화상. 점묘로 소용돌이치는 청록 위, 불꽃 같은 붉은 수염의 응시.",
    cell: CELL,
    aspect: 114 / 144,
    load: () => import("./selfPortraitData").then((m) => paintingWork(m.data)),
  },
  {
    title: "밀밭의 사이프러스",
    sub: "Wheat Field with Cypresses · 1889 · 메트로폴리탄 미술관",
    desc: "생레미의 여름. 바람에 눕는 황금 밀밭 위로 크림빛 구름이 소용돌이친다.",
    cell: CELL,
    aspect: 144 / 113,
    load: () => import("./wheatFieldData").then((m) => paintingWork(m.data)),
  },
  {
    title: "론강의 별이 빛나는 밤",
    sub: "Starry Night Over the Rhône · 1888 · 오르세 미술관",
    desc: "아를의 강가에서 본 밤. 가스등이 물 위로 길게 늘어지고 북두칠성이 그 위에 걸린다.",
    cell: CELL,
    aspect: 144 / 112,
    load: () => import("./starryRhoneData").then((m) => paintingWork(m.data)),
  },
  {
    title: "붓꽃",
    sub: "Irises · 1889 · 게티 센터",
    desc: "생레미에 도착한 첫 주에 그린 정원. 붉은 흙과 보랏빛 무리 사이에 흰 붓꽃 한 송이가 서 있다.",
    cell: CELL,
    aspect: 144 / 110,
    load: () => import("./irisesData").then((m) => paintingWork(m.data)),
  },
  {
    title: "밤의 카페",
    sub: "The Night Café · 1888 · 예일 대학교 미술관",
    desc: "아를의 밤샘 카페. 붉은 벽과 초록 천장을 맞부딪쳐 \"사람이 파멸할 수 있는 곳\"을 그렸다.",
    cell: CELL,
    aspect: 144 / 114,
    load: () => import("./nightCafeData").then((m) => paintingWork(m.data)),
  },
  {
    title: "노란 집",
    sub: "The Yellow House · 1888 · 반 고흐 미술관",
    desc: "라마르틴 광장 2번지. 고갱과 함께 지낼 '남쪽의 화실'을 꿈꾸며 빌린 집이다.",
    cell: CELL,
    aspect: 144 / 112,
    load: () => import("./yellowHouseData").then((m) => paintingWork(m.data)),
  },
  {
    title: "아몬드 꽃",
    sub: "Almond Blossom · 1890 · 반 고흐 미술관",
    desc: "조카가 태어났다는 소식에 그린 선물. 일본 판화를 닮은 구도로 하늘을 배경 삼아 가지를 올렸다.",
    cell: CELL,
    aspect: 144 / 114,
    load: () => import("./almondBlossomData").then((m) => paintingWork(m.data)),
  },
  {
    title: "까마귀가 나는 밀밭",
    sub: "Wheatfield with Crows · 1890 · 반 고흐 미술관",
    desc: "오베르의 여름. 세 갈래 길이 흩어지고 폭풍 하늘 아래로 까마귀 떼가 낮게 난다.",
    cell: CELL,
    aspect: 144 / 68,
    load: () => import("./wheatCrowsData").then((m) => paintingWork(m.data)),
  },
];

/** 전시관 목록. 작가가 늘면 여기에 추가한다. */
export const exhibits: Exhibit[] = [
  { name: "빈센트 반 고흐 전시관", artist: ARTIST, works: baseWorks },
];

/** 사용자가 올린 이미지가 담기는 전시관 이름 */
export const MY_EXHIBIT = "나의 전시관";
