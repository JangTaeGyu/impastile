import { paintingFlow, paintingScene } from "./painting";
import { data } from "./wheatFieldData";

/** 밀밭의 사이프러스 (Wheat Field with Cypresses, 1889) — 원본 샘플링 */
export const sceneWheat = paintingScene(data);
export const flowWheat = paintingFlow(data);
