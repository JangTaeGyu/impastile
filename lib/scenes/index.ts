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
  name: "Vincent van Gogh",
  era: "1853–1890",
  movement: "Post-Impressionism",
};

export const MONET: Artist = {
  name: "Claude Monet",
  era: "1840–1926",
  movement: "Impressionism",
};

export const MUNCH: Artist = {
  name: "Edvard Munch",
  era: "1863–1944",
  movement: "Expressionism",
};

export const CEZANNE: Artist = {
  name: "Paul Cézanne",
  era: "1839–1906",
  movement: "Post-Impressionism",
};

export const baseWorks: WorkEntry[] = [
  {
    title: "The Starry Night",
    sub: "The Starry Night · 1889 · Museum of Modern Art, New York",
    desc: "Dawn beyond the asylum window at Saint-Rémy. Under a churning sky a cypress climbs like black flame.",
    cell: CELL,
    aspect: 144 / 107,
    load: () => import("./starryNightData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Sunflowers",
    sub: "Sunflowers · 1888 · National Gallery, London",
    desc: "Painted at Arles while waiting for Gauguin. Fifteen suns conjured out of chrome yellow alone.",
    cell: CELL,
    aspect: 114 / 144,
    load: () => import("./sunflowersData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Café Terrace at Night",
    sub: "Café Terrace at Night · 1888 · Kröller-Müller Museum",
    desc: "A night painted without black. Gaslight yellow meets a cobalt sky at the edge of the terrace.",
    cell: CELL,
    aspect: 115 / 144,
    load: () => import("./cafeTerraceData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Bedroom in Arles",
    sub: "Bedroom in Arles · 1888 · Van Gogh Museum",
    desc: "His bedroom in the Yellow House at Arles. Tilted perspective and paired complements picture 'absolute rest'.",
    cell: CELL,
    aspect: 144 / 114,
    load: () => import("./bedroomData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Self-Portrait",
    sub: "Self-Portrait · 1887 · Art Institute of Chicago",
    desc: "From the Paris years. A flame-red beard stares out of swirling, pointillist blue-green.",
    cell: CELL,
    aspect: 114 / 144,
    load: () => import("./selfPortraitData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Wheat Field with Cypresses",
    sub: "Wheat Field with Cypresses · 1889 · Metropolitan Museum of Art",
    desc: "Summer at Saint-Rémy. Cream-coloured cloud churns above golden wheat laid flat by the wind.",
    cell: CELL,
    aspect: 144 / 113,
    load: () => import("./wheatFieldData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Starry Night Over the Rhône",
    sub: "Starry Night Over the Rhône · 1888 · Musée d'Orsay",
    desc: "Night from the riverbank at Arles. Gaslight stretches long across the water with the Plough hung above it.",
    cell: CELL,
    aspect: 144 / 112,
    load: () => import("./starryRhoneData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Irises",
    sub: "Irises · 1889 · Getty Center",
    desc: "The garden he painted in his first week at Saint-Rémy. One white iris stands among the violet crowd and red earth.",
    cell: CELL,
    aspect: 144 / 110,
    load: () => import("./irisesData").then((m) => paintingWork(m.data)),
  },
  {
    title: "The Night Café",
    sub: "The Night Café · 1888 · Yale University Art Gallery",
    desc: "The all-night café at Arles. Red walls struck against a green ceiling to paint 'a place where one can ruin oneself'.",
    cell: CELL,
    aspect: 144 / 114,
    load: () => import("./nightCafeData").then((m) => paintingWork(m.data)),
  },
  {
    title: "The Yellow House",
    sub: "The Yellow House · 1888 · Van Gogh Museum",
    desc: "Number 2, Place Lamartine. He rented it dreaming of a 'studio of the South' to share with Gauguin.",
    cell: CELL,
    aspect: 144 / 112,
    load: () => import("./yellowHouseData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Almond Blossom",
    sub: "Almond Blossom · 1890 · Van Gogh Museum",
    desc: "A gift painted on news of his nephew's birth. Branches lifted against open sky, composed after a Japanese print.",
    cell: CELL,
    aspect: 144 / 114,
    load: () => import("./almondBlossomData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Wheatfield with Crows",
    sub: "Wheatfield with Crows · 1890 · Van Gogh Museum",
    desc: "Summer at Auvers. Three paths scatter and a flock of crows flies low under a storming sky.",
    cell: CELL,
    aspect: 144 / 68,
    load: () => import("./wheatCrowsData").then((m) => paintingWork(m.data)),
  },
];

export const monetWorks: WorkEntry[] = [
  {
    title: "Impression, Sunrise",
    sub: "Impression, soleil levant · 1872 · Musée Marmottan Monet",
    desc: "A misty dawn in the harbour at Le Havre. 'Impressionism' came from a critic's sneer at this title.",
    cell: CELL,
    aspect: 144 / 112,
    load: () => import("./monetSunriseData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Water Lilies",
    sub: "Water Lilies · 1906 · Art Institute of Chicago",
    desc: "The pond at Giverny. Sky and bank erased from the frame, leaving only the surface — a painting with no up or down.",
    cell: CELL,
    aspect: 144 / 139,
    load: () => import("./monetLiliesData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Rouen Cathedral, West Façade",
    sub: "Rouen Cathedral, West Façade, Sunlight · 1894 · National Gallery of Art, Washington",
    desc: "He painted the same façade more than thirty times, changing the hour and the weather. The subject is not the stone but the light laid on it.",
    cell: CELL,
    aspect: 94 / 144,
    load: () => import("./monetRouenData").then((m) => paintingWork(m.data)),
  },
  {
    title: "The Magpie",
    sub: "La Pie · 1868–69 · Musée d'Orsay",
    desc: "A single magpie on a snow-covered fence. Painting the shadows blue rather than black had it rejected from the Salon.",
    cell: CELL,
    aspect: 144 / 98,
    load: () => import("./monetMagpieData").then((m) => paintingWork(m.data)),
  },
  {
    title: "La Grenouillère",
    sub: "La Grenouillère · 1869 · Metropolitan Museum of Art",
    desc: "The bathing place on the Seine. He set his easel beside Renoir's and painted the same water.",
    cell: CELL,
    aspect: 144 / 108,
    load: () =>
      import("./monetGrenouillereData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Woman with a Parasol",
    sub: "Woman with a Parasol · 1875 · National Gallery of Art, Washington",
    desc: "His wife and son on a rise. The wind lays veil and grass the same way.",
    cell: CELL,
    aspect: 116 / 144,
    load: () => import("./monetParasolData").then((m) => paintingWork(m.data)),
  },
  {
    title: "The Gare Saint-Lazare",
    sub: "La Gare Saint-Lazare · 1877 · Musée d'Orsay",
    desc: "Steam rising under the glass roof. Not the trains, but the lit air they pass through.",
    cell: CELL,
    aspect: 144 / 107,
    load: () =>
      import("./monetGareSaintLazareData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Haystacks, End of Summer",
    sub: "Meules, fin de l'été · 1890–91 · Art Institute of Chicago",
    desc: "He painted the same stacks twenty-five times. The form is a pretext; the subject is the colour each hour brings.",
    cell: CELL,
    aspect: 144 / 85,
    load: () =>
      import("./monetHaystacksData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Poplars",
    sub: "Peupliers · 1891 · Philadelphia Museum of Art",
    desc: "Poplars on the banks of the Epte. He bought the trees, already sold for felling, and kept them standing until the series was done.",
    cell: CELL,
    aspect: 114 / 144,
    load: () => import("./monetPoplarsData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Bridge over a Pond of Water Lilies",
    sub: "Bridge over a Pond of Water Lilies · 1899 · Metropolitan Museum of Art",
    desc: "The pond he dug himself at Giverny, with a bridge lifted from the Japanese prints he collected.",
    cell: CELL,
    aspect: 115 / 144,
    load: () =>
      import("./monetWaterLilyPondData").then((m) => paintingWork(m.data)),
  },
];

export const munchWorks: WorkEntry[] = [
  {
    title: "The Scream",
    sub: "The Scream · 1893 · National Museum of Norway",
    desc: "On the bridge beneath a sky burning blood-red. It is nature that screams, Munch wrote in his diary, not the figure.",
    cell: CELL,
    aspect: 116 / 144,
    load: () => import("./munchScreamData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Starry Night",
    sub: "Starry Night · 1893 · Getty Center",
    desc: "A summer night at Åsgårdstrand. Four years after Van Gogh's picture of the same name — and where his swirls were, there is stillness.",
    cell: CELL,
    aspect: 144 / 140,
    load: () => import("./munchStarryData").then((m) => paintingWork(m.data)),
  },
  {
    title: "The Dance of Life",
    sub: "The Dance of Life · 1899–1900 · National Museum of Norway",
    desc: "Midsummer on the shore. The women in white, red and black are not three people but one, in three seasons of a life.",
    cell: CELL,
    aspect: 144 / 94,
    load: () => import("./munchDanceData").then((m) => paintingWork(m.data)),
  },
  {
    title: "The Sick Child",
    sub: "Det syke barn · 1885–86 · National Museum of Norway",
    desc: "His sister Sophie, dead at fifteen. Scraped back and repainted again and again until the surface reads as a wound.",
    cell: CELL,
    aspect: 142 / 144,
    load: () =>
      import("./munchSickChildData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Evening on Karl Johan Street",
    sub: "Aften på Karl Johan · 1892 · KODE Bergen",
    desc: "Oslo's main street. Every face coming towards us is pale as a mask.",
    cell: CELL,
    aspect: 144 / 100,
    load: () =>
      import("./munchKarlJohanData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Anxiety",
    sub: "Angst · 1894 · Munch Museum",
    desc: "The bridge and sky of The Scream. In place of the cry, set faces walk straight out at us.",
    cell: CELL,
    aspect: 112 / 144,
    load: () => import("./munchAnxietyData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Ashes",
    sub: "Aske · 1894–95 · National Museum of Norway",
    desc: "A woman comes out of the wood with her hair undone; the man turns his back and folds into himself.",
    cell: CELL,
    aspect: 144 / 123,
    load: () => import("./munchAshesData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Madonna",
    sub: "Madonna · 1894–95 · National Museum of Norway",
    desc: "A torso arched back, the eyes closed. It carries the Virgin's name, but a red band circles where the halo should be.",
    cell: CELL,
    aspect: 111 / 144,
    load: () => import("./munchMadonnaData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Puberty",
    sub: "Pubertet · 1894–95 · National Museum of Norway",
    desc: "A girl seated at the edge of the bed. The shadow thrown behind her swells larger than her body.",
    cell: CELL,
    aspect: 105 / 144,
    load: () => import("./munchPubertyData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Vampire",
    sub: "Vampyr · 1895 · Munch Museum",
    desc: "Red hair falls across the man's neck. Munch himself called the picture 'Love and Pain'.",
    cell: CELL,
    aspect: 144 / 120,
    load: () => import("./munchVampireData").then((m) => paintingWork(m.data)),
  },
];

export const cezanneWorks: WorkEntry[] = [
  {
    title: "Mont Sainte-Victoire",
    sub: "La Montagne Sainte-Victoire vue des Lauves · 1906 · Pushkin Museum",
    desc: "In his last years he painted the same mountain over and over from the hill at Les Lauves. Constructive strokes lie parallel, all one way.",
    cell: CELL,
    aspect: 144 / 118,
    load: () =>
      import("./cezanneVictoireData").then((m) => paintingWork(m.data)),
  },
  {
    title: "The Card Players",
    sub: "Les Joueurs de cartes · 1890–1895 · Musée d'Orsay",
    desc: "Two farmhands from Aix, seated across from one another. Of the five versions this holds the fewest figures and the most quiet.",
    cell: CELL,
    aspect: 144 / 118,
    load: () => import("./cezanneCardsData").then((m) => paintingWork(m.data)),
  },
  {
    title: "The Basket of Apples",
    sub: "Le panier de pommes · c. 1893 · Art Institute of Chicago",
    desc: "Table and bottle are each seen from a different vantage. Apples and cloth stitch the mismatched eye-levels together.",
    cell: CELL,
    aspect: 144 / 115,
    load: () => import("./cezanneApplesData").then((m) => paintingWork(m.data)),
  },
  {
    title: "The House of the Hanged Man",
    sub: "La Maison du pendu · 1873 · Musée d'Orsay",
    desc: "A slope at Auvers. The bright colour he learned beside Pissarro, laid on thick as with a trowel.",
    cell: CELL,
    aspect: 144 / 121,
    load: () =>
      import("./cezanneHangedManData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Madame Cézanne in a Red Armchair",
    sub: "Madame Cézanne in a Red Armchair · c. 1877 · Museum of Fine Arts, Boston",
    desc: "One of some two dozen portraits of Hortense. The pattern of her skirt and the wallpaper carry equal weight.",
    cell: CELL,
    aspect: 111 / 144,
    load: () =>
      import("./cezanneMadameRedChairData").then((m) => paintingWork(m.data)),
  },
  {
    title: "The Gulf of Marseille Seen from L'Estaque",
    sub: "Le Golfe de Marseille vu de L'Estaque · c. 1885 · Art Institute of Chicago",
    desc: "The sea beyond the rooftops, filled with horizontal strokes alone until it stands like a wall.",
    cell: CELL,
    aspect: 144 / 115,
    load: () => import("./cezanneEstaqueData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Mont Sainte-Victoire with Large Pine",
    sub: "Mont Sainte-Victoire with Large Pine · c. 1887 · Courtauld Gallery",
    desc: "Pine branches arch across the mountain like a frame. The houses in the valley take the same stroke as the rock.",
    cell: CELL,
    aspect: 144 / 104,
    load: () =>
      import("./cezanneSainteVictoireData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Still Life with Apples and Oranges",
    sub: "Nature morte aux pommes et aux oranges · c. 1899 · Musée d'Orsay",
    desc: "Folds of the tablecloth cut the picture on the diagonal. The plate is seen from above, the bottle from the side.",
    cell: CELL,
    aspect: 144 / 113,
    load: () =>
      import("./cezanneApplesOrangesData").then((m) => paintingWork(m.data)),
  },
  {
    title: "Portrait of Ambroise Vollard",
    sub: "Portrait d'Ambroise Vollard · 1899 · Petit Palais",
    desc: "He sat the dealer Vollard more than a hundred times, building the face in planes as he would a still life.",
    cell: CELL,
    aspect: 117 / 144,
    load: () => import("./cezanneVollardData").then((m) => paintingWork(m.data)),
  },
  {
    title: "The Large Bathers",
    sub: "Les Grandes Baigneuses · 1900–1906 · Philadelphia Museum of Art",
    desc: "His largest canvas, held for seven years and left unfinished. Trees arch over to enclose the figures.",
    cell: CELL,
    aspect: 144 / 120,
    load: () => import("./cezanneBathersData").then((m) => paintingWork(m.data)),
  },
];

/** 전시관 목록. 작가가 늘면 여기에 추가한다. */
export const exhibits: Exhibit[] = [
  { name: "Van Gogh Room", artist: ARTIST, works: baseWorks },
  { name: "Monet Room", artist: MONET, works: monetWorks },
  { name: "Munch Room", artist: MUNCH, works: munchWorks },
  { name: "Cézanne Room", artist: CEZANNE, works: cezanneWorks },
];

/** 사용자가 올린 이미지가 담기는 전시관 이름 */
export const MY_EXHIBIT = "My Room";
