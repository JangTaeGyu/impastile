import { paintingFlow, paintingScene } from "./painting";
import { data } from "./cafeTerraceData";

/** 밤의 카페 테라스 (Café Terrace at Night, 1888) — 원본 샘플링 */
export const sceneCafe = paintingScene(data);
export const flowCafe = paintingFlow(data);
