import type { Work } from "@/lib/engine/types";
import { autoTone, extractPainting } from "./extract";
import { paintingFlow, paintingScene } from "./painting";

// 사용자가 올린 이미지를 씬으로 만든다.
// 전시용 6점이 <작품>Data.ts를 거치는 것과 달리 파일이 브라우저 밖으로
// 나가지 않는다 — 추출부터 렌더까지 전부 이 탭 안에서 끝난다.

/** 전시 6점과 같은 타일 크기 — 갤러리 안에서 붓터치 크기가 흔들리지 않게 */
const CELL = 13;

/** 확장자를 뗀 파일명 */
function displayName(name: string) {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

export async function workFromFile(file: File): Promise<Work> {
  const data = await extractPainting(file);
  const { sat, gain } = autoTone(data);
  return {
    title: displayName(file.name) || "이미지",
    sub: "",
    desc: "",
    cell: CELL,
    uploaded: true,
    scene: paintingScene(data, sat, gain),
    flow: paintingFlow(data),
  };
}
