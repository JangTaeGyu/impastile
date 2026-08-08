import type { Work } from "@/lib/engine/types";
import { flowBedroom, sceneBedroom } from "./bedroom";
import { flowCafe, sceneCafe } from "./cafeTerrace";
import { flowPortrait, scenePortrait } from "./selfPortrait";
import { flowStarry, sceneStarry } from "./starryNight";
import { flowSun, sceneSun } from "./sunflowers";
import { flowWheat, sceneWheat } from "./wheatField";

export const baseWorks: Work[] = [
  { title: "별이 빛나는 밤에", cell: 13, scene: sceneStarry, flow: flowStarry },
  { title: "해바라기", cell: 13, scene: sceneSun, flow: flowSun },
  { title: "밤의 카페 테라스", cell: 13, scene: sceneCafe, flow: flowCafe },
  { title: "아를의 침실", cell: 13, scene: sceneBedroom, flow: flowBedroom },
  { title: "자화상", cell: 13, scene: scenePortrait, flow: flowPortrait },
  { title: "밀밭의 사이프러스", cell: 13, scene: sceneWheat, flow: flowWheat },
];
