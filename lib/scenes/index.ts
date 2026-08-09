import type { Artist, Exhibit } from "./types";
import type { WorkEntry } from "@/lib/facture/types";
import { paintingWork } from "./painting";

// 작품 데이터(색상 맵 + 방향장)는 한 점당 gzip 약 75KB다. 12점을 모두 번들에
// 넣으면 첫 화면에서 900KB를 받고 시작한다. 그래서 여기에는 글로 된 정보만 두고
// 무거운 쪽은 load()의 동적 import로 미룬다 — 지금 보는 작품부터 받고 나머지는
// 뒤에서 한 점씩 따라온다 (lib/scenes/load.ts).
//
// aspect는 손으로 적은 값이다. 데이터를 다시 뽑았는데 여기를 안 고치면
// loadWork가 개발 모드에서 경고한다.

/** 타일 한 변의 CSS 픽셀 크기 — 갤러리 안에서 붓터치 크기가 흔들리지 않게 */
const CELL = 11;

// 색 보정은 네 작가 모두 기본값(sat 1.28 / gain 1.07)을 쓴다. autoTone의 대역을
// 벗어나는 작품이 몇 점 있지만(루앙 대성당·인상 해돋이가 특히 옅다) 일부러 두었다 —
// 대역은 아무 이미지나 받아내는 안전망이지 회화를 맞춰 넣을 기준이 아니고,
// 옅은 그림을 억지로 올리면 원화에 없는 색을 만들게 된다.

export const ARTIST: Artist = {
  ko: "빈센트 반 고흐",
  en: "Vincent van Gogh",
  era: "1853–1890",
  movement: "후기 인상주의",
};

export const MONET: Artist = {
  ko: "클로드 모네",
  en: "Claude Monet",
  era: "1840–1926",
  movement: "인상주의",
};

export const MUNCH: Artist = {
  ko: "에드바르 뭉크",
  en: "Edvard Munch",
  era: "1863–1944",
  movement: "표현주의",
};

export const CEZANNE: Artist = {
  ko: "폴 세잔",
  en: "Paul Cézanne",
  era: "1839–1906",
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

export const monetWorks: WorkEntry[] = [
  {
    title: "인상, 해돋이",
    sub: "Impression, soleil levant · 1872 · 마르모탕 모네 미술관",
    desc: "르아브르 항구의 안개 낀 새벽. 한 평론가가 이 제목을 비꼬아 쓴 말에서 '인상주의'가 나왔다.",
    cell: CELL,
    aspect: 144 / 112,
    load: () => import("./monetSunriseData").then((m) => paintingWork(m.data)),
  },
  {
    title: "수련",
    sub: "Water Lilies · 1906 · 시카고 미술관",
    desc: "지베르니의 연못. 하늘도 물가도 화면에서 지우고 수면만 남겨, 위아래가 사라진 그림이 됐다.",
    cell: CELL,
    aspect: 144 / 139,
    load: () => import("./monetLiliesData").then((m) => paintingWork(m.data)),
  },
  {
    title: "루앙 대성당, 서쪽 정면",
    sub: "Rouen Cathedral, West Façade, Sunlight · 1894 · 워싱턴 내셔널 갤러리",
    desc: "같은 정면을 시간과 날씨를 바꿔 서른 점 넘게 그렸다. 주제는 돌이 아니라 그 위에 얹힌 빛이다.",
    cell: CELL,
    aspect: 94 / 144,
    load: () => import("./monetRouenData").then((m) => paintingWork(m.data)),
  },
  {
    title: "까치",
    sub: "La Pie · 1868–69 · 오르세 미술관",
    desc: "눈 덮인 울타리에 까치 한 마리. 그림자를 검정이 아니라 푸른 빛으로 칠해 살롱에서 떨어졌다.",
    cell: CELL,
    aspect: 144 / 98,
    load: () => import("./monetMagpieData").then((m) => paintingWork(m.data)),
  },
  {
    title: "라 그르누예르",
    sub: "La Grenouillère · 1869 · 메트로폴리탄 미술관",
    desc: "센강의 물놀이터. 르누아르와 나란히 이젤을 세우고 같은 수면을 그렸다.",
    cell: CELL,
    aspect: 144 / 108,
    load: () =>
      import("./monetGrenouillereData").then((m) => paintingWork(m.data)),
  },
  {
    title: "양산을 쓴 여인",
    sub: "Woman with a Parasol · 1875 · 워싱턴 내셔널 갤러리",
    desc: "언덕 위의 아내와 아들. 바람이 베일과 풀을 한 방향으로 눕힌다.",
    cell: CELL,
    aspect: 116 / 144,
    load: () => import("./monetParasolData").then((m) => paintingWork(m.data)),
  },
  {
    title: "생라자르 역",
    sub: "La Gare Saint-Lazare · 1877 · 오르세 미술관",
    desc: "유리 지붕 아래 증기가 차오른다. 기차가 아니라 빛이 지나는 공기를 그렸다.",
    cell: CELL,
    aspect: 144 / 107,
    load: () =>
      import("./monetGareSaintLazareData").then((m) => paintingWork(m.data)),
  },
  {
    title: "짚가리",
    sub: "Meules, fin de l'été · 1890–91 · 시카고 미술관",
    desc: "같은 짚가리를 스물다섯 번 그렸다. 형태는 핑계고 시간마다 갈리는 색이 주제다.",
    cell: CELL,
    aspect: 144 / 85,
    load: () =>
      import("./monetHaystacksData").then((m) => paintingWork(m.data)),
  },
  {
    title: "포플러",
    sub: "Peupliers · 1891 · 필라델피아 미술관",
    desc: "엡트 강가의 포플러. 베어 팔릴 나무를 사들여 다 그릴 때까지 세워두었다.",
    cell: CELL,
    aspect: 114 / 144,
    load: () => import("./monetPoplarsData").then((m) => paintingWork(m.data)),
  },
  {
    title: "수련 연못과 일본식 다리",
    sub: "Bridge over a Pond of Water Lilies · 1899 · 메트로폴리탄 미술관",
    desc: "지베르니에 손수 판 연못. 일본 판화에서 본 다리를 그 위에 놓았다.",
    cell: CELL,
    aspect: 115 / 144,
    load: () =>
      import("./monetWaterLilyPondData").then((m) => paintingWork(m.data)),
  },
];

export const munchWorks: WorkEntry[] = [
  {
    title: "절규",
    sub: "The Scream · 1893 · 노르웨이 국립미술관",
    desc: "핏빛으로 타는 하늘 아래 다리 위. 비명을 지르는 것은 인물이 아니라 자연이라고 뭉크는 일기에 적었다.",
    cell: CELL,
    aspect: 116 / 144,
    load: () => import("./munchScreamData").then((m) => paintingWork(m.data)),
  },
  {
    title: "별이 빛나는 밤",
    sub: "Starry Night · 1893 · 게티 센터",
    desc: "오스고르스트란의 여름밤. 반 고흐가 같은 제목을 그린 지 네 해 뒤인데, 소용돌이 대신 적막이 있다.",
    cell: CELL,
    aspect: 144 / 140,
    load: () => import("./munchStarryData").then((m) => paintingWork(m.data)),
  },
  {
    title: "삶의 춤",
    sub: "The Dance of Life · 1899–1900 · 노르웨이 국립미술관",
    desc: "하지의 해변. 흰옷·붉은옷·검은옷의 세 여인은 서로 다른 사람이 아니라 한 사람의 세 시절이다.",
    cell: CELL,
    aspect: 144 / 94,
    load: () => import("./munchDanceData").then((m) => paintingWork(m.data)),
  },
  {
    title: "병든 아이",
    sub: "Det syke barn · 1885–86 · 노르웨이 국립미술관",
    desc: "열다섯에 죽은 누나 소피에. 긁어내고 다시 칠하기를 되풀이해 표면이 상처처럼 남았다.",
    cell: CELL,
    aspect: 142 / 144,
    load: () =>
      import("./munchSickChildData").then((m) => paintingWork(m.data)),
  },
  {
    title: "칼 요한 거리의 저녁",
    sub: "Aften på Karl Johan · 1892 · KODE 베르겐",
    desc: "오슬로의 큰길. 마주 오는 얼굴들이 하나같이 가면처럼 창백하다.",
    cell: CELL,
    aspect: 144 / 100,
    load: () =>
      import("./munchKarlJohanData").then((m) => paintingWork(m.data)),
  },
  {
    title: "불안",
    sub: "Angst · 1894 · 뭉크 미술관",
    desc: "절규와 같은 다리, 같은 하늘. 비명 대신 굳은 얼굴들이 정면으로 걸어 나온다.",
    cell: CELL,
    aspect: 112 / 144,
    load: () => import("./munchAnxietyData").then((m) => paintingWork(m.data)),
  },
  {
    title: "재",
    sub: "Aske · 1894–95 · 노르웨이 국립미술관",
    desc: "숲에서 나온 여자가 머리를 풀어헤치고, 남자는 등을 돌려 웅크린다.",
    cell: CELL,
    aspect: 144 / 123,
    load: () => import("./munchAshesData").then((m) => paintingWork(m.data)),
  },
  {
    title: "마돈나",
    sub: "Madonna · 1894–95 · 노르웨이 국립미술관",
    desc: "눈을 감고 뒤로 젖힌 상반신. 성모의 이름을 붙였으나 후광 자리에 붉은 띠가 돈다.",
    cell: CELL,
    aspect: 111 / 144,
    load: () => import("./munchMadonnaData").then((m) => paintingWork(m.data)),
  },
  {
    title: "사춘기",
    sub: "Pubertet · 1894–95 · 노르웨이 국립미술관",
    desc: "침대 끝에 앉은 소녀. 뒤로 드리운 그림자가 몸보다 크게 부풀어 있다.",
    cell: CELL,
    aspect: 105 / 144,
    load: () => import("./munchPubertyData").then((m) => paintingWork(m.data)),
  },
  {
    title: "흡혈귀",
    sub: "Vampyr · 1895 · 뭉크 미술관",
    desc: "붉은 머리칼이 남자의 목을 덮는다. 뭉크 자신은 이 그림을 '사랑과 고통'이라 불렀다.",
    cell: CELL,
    aspect: 144 / 120,
    load: () => import("./munchVampireData").then((m) => paintingWork(m.data)),
  },
];

export const cezanneWorks: WorkEntry[] = [
  {
    title: "생빅투아르산",
    sub: "La Montagne Sainte-Victoire vue des Lauves · 1906 · 푸시킨 미술관",
    desc: "말년에 레 로브의 언덕에서 같은 산을 되풀이해 그렸다. 붓자국이 한 방향으로 나란히 눕는 구성적 필촉.",
    cell: CELL,
    aspect: 144 / 118,
    load: () =>
      import("./cezanneVictoireData").then((m) => paintingWork(m.data)),
  },
  {
    title: "카드 놀이하는 사람들",
    sub: "Les Joueurs de cartes · 1890–1895 · 오르세 미술관",
    desc: "엑스의 농부 둘이 마주 앉았다. 다섯 판 연작 중 인물이 가장 적고 가장 조용한 축이다.",
    cell: CELL,
    aspect: 144 / 118,
    load: () => import("./cezanneCardsData").then((m) => paintingWork(m.data)),
  },
  {
    title: "사과 바구니",
    sub: "Le panier de pommes · 1893년경 · 시카고 미술관",
    desc: "탁자도 병도 서로 다른 시점에서 보고 그렸다. 어긋난 눈높이를 사과와 천이 이어 붙인다.",
    cell: CELL,
    aspect: 144 / 115,
    load: () => import("./cezanneApplesData").then((m) => paintingWork(m.data)),
  },
  {
    title: "목맨 사람의 집",
    sub: "La Maison du pendu · 1873 · 오르세 미술관",
    desc: "오베르의 비탈길. 피사로 곁에서 익힌 밝은 색을 흙손처럼 두껍게 올렸다.",
    cell: CELL,
    aspect: 144 / 121,
    load: () =>
      import("./cezanneHangedManData").then((m) => paintingWork(m.data)),
  },
  {
    title: "붉은 안락의자의 세잔 부인",
    sub: "Madame Cézanne in a Red Armchair · 1877년경 · 보스턴 미술관",
    desc: "오르탕스를 그린 스물몇 점 중 하나. 치마의 무늬와 벽지가 같은 무게로 놓인다.",
    cell: CELL,
    aspect: 111 / 144,
    load: () =>
      import("./cezanneMadameRedChairData").then((m) => paintingWork(m.data)),
  },
  {
    title: "에스타크에서 본 마르세유 만",
    sub: "Le Golfe de Marseille vu de L'Estaque · 1885년경 · 시카고 미술관",
    desc: "지붕 너머의 바다. 물을 수평 붓질로만 채워 벽처럼 세웠다.",
    cell: CELL,
    aspect: 144 / 115,
    load: () => import("./cezanneEstaqueData").then((m) => paintingWork(m.data)),
  },
  {
    title: "생빅투아르산과 큰 소나무",
    sub: "Mont Sainte-Victoire with Large Pine · 1887년경 · 코톨드 갤러리",
    desc: "소나무 가지가 산을 가로질러 액자처럼 걸린다. 골짜기의 집들도 산과 같은 붓결이다.",
    cell: CELL,
    aspect: 144 / 104,
    load: () =>
      import("./cezanneSainteVictoireData").then((m) => paintingWork(m.data)),
  },
  {
    title: "사과와 오렌지가 있는 정물",
    sub: "Nature morte aux pommes et aux oranges · 1899년경 · 오르세 미술관",
    desc: "탁자보의 주름이 화면을 대각으로 가른다. 접시는 위에서, 병은 옆에서 봤다.",
    cell: CELL,
    aspect: 144 / 113,
    load: () =>
      import("./cezanneApplesOrangesData").then((m) => paintingWork(m.data)),
  },
  {
    title: "앙브루아즈 볼라르의 초상",
    sub: "Portrait d'Ambroise Vollard · 1899 · 프티 팔레",
    desc: "화상 볼라르를 백 번 넘게 앉혔다. 얼굴도 정물처럼 면을 쌓아 세웠다.",
    cell: CELL,
    aspect: 117 / 144,
    load: () => import("./cezanneVollardData").then((m) => paintingWork(m.data)),
  },
  {
    title: "대수욕도",
    sub: "Les Grandes Baigneuses · 1900–1906 · 필라델피아 미술관",
    desc: "일곱 해를 붙들고 끝내 미완으로 남긴 최대작. 나무가 아치를 이뤄 인물을 감싼다.",
    cell: CELL,
    aspect: 144 / 120,
    load: () => import("./cezanneBathersData").then((m) => paintingWork(m.data)),
  },
];

/** 전시관 목록. 작가가 늘면 여기에 추가한다. */
export const exhibits: Exhibit[] = [
  { name: "빈센트 반 고흐 전시관", artist: ARTIST, works: baseWorks },
  { name: "클로드 모네 전시관", artist: MONET, works: monetWorks },
  { name: "에드바르 뭉크 전시관", artist: MUNCH, works: munchWorks },
  { name: "폴 세잔 전시관", artist: CEZANNE, works: cezanneWorks },
];

/** 사용자가 올린 이미지가 담기는 전시관 이름 */
export const MY_EXHIBIT = "나의 전시관";
