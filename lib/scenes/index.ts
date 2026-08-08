import type { Work } from "@/lib/engine/types";
import { sceneBedroom } from "./bedroom";
import { sceneCafe } from "./cafeTerrace";
import { scenePortrait } from "./selfPortrait";
import { flowStarry, sceneStarry } from "./starryNight";
import { sceneSun } from "./sunflowers";
import { sceneWheat } from "./wheatField";

export const ERA = "1853–1890";

export const baseWorks: Work[] = [
  {
    title: "별이 빛나는 밤에",
    sub: "The Starry Night · 1889",
    essence: "소용돌이치는 밤하늘, 임파스토로 휘몰아치는 별빛의 결",
    likes: 2480,
    seedHex: "5a7e",
    cell: 13,
    scene: sceneStarry,
    flow: flowStarry,
  },
  {
    title: "해바라기",
    sub: "Sunflowers · 1888",
    essence: "황토와 크롬 옐로의 두터운 임파스토, 화병에 응축된 태양",
    likes: 1893,
    seedHex: "c1f3",
    cell: 15,
    scene: sceneSun,
  },
  {
    title: "밤의 카페 테라스",
    sub: "Café Terrace at Night · 1888",
    essence: "가스등 노랑과 코발트 밤이 맞닿는 테라스의 온기",
    likes: 2107,
    seedHex: "e2b7",
    cell: 14,
    scene: sceneCafe,
  },
  {
    title: "아를의 침실",
    sub: "Bedroom in Arles · 1888",
    essence: "기울어진 원근 속, 낮잠처럼 고요한 방의 채도",
    likes: 1764,
    seedHex: "9d41",
    cell: 13,
    scene: sceneBedroom,
  },
  {
    title: "자화상",
    sub: "Self-Portrait · 1889",
    essence: "소용돌이치는 청록 위, 불꽃 같은 붉은 수염의 응시",
    likes: 1590,
    seedHex: "7f2c",
    cell: 12,
    scene: scenePortrait,
  },
  {
    title: "밀밭의 사이프러스",
    sub: "Wheat Field with Cypresses · 1889",
    essence: "바람에 눕는 황금 밀밭과 검은 불꽃의 사이프러스",
    likes: 1421,
    seedHex: "b8c5",
    cell: 15,
    scene: sceneWheat,
  },
];
