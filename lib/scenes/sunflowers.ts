import { paintingFlow, paintingScene } from "./painting";
import { data } from "./sunflowersData";

/** 해바라기 (Sunflowers, 1888) — 원본 샘플링 */
export const sceneSun = paintingScene(data);
export const flowSun = paintingFlow(data);
