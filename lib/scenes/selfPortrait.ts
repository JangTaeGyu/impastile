import { paintingFlow, paintingScene } from "./painting";
import { data } from "./selfPortraitData";

/** 자화상 (Self-Portrait, 1887) — 원본 샘플링 */
export const scenePortrait = paintingScene(data);
export const flowPortrait = paintingFlow(data);
