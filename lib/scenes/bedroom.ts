import { paintingFlow, paintingScene } from "./painting";
import { data } from "./bedroomData";

/** 아를의 침실 (Bedroom in Arles, 1888) — 원본 샘플링 */
export const sceneBedroom = paintingScene(data);
export const flowBedroom = paintingFlow(data);
