import type { WorkEntry } from "@/lib/facture/types";
import { autoTone, extractPainting } from "./extract";
import { paintingWork } from "./painting";

// 사용자가 올린 이미지를 전시 작품과 같은 모양(WorkEntry)으로 만든다.
// 전시 작품은 load()가 청크를 받아오지만 이쪽은 이미 손에 있으므로 그대로
// 돌려준다 — 덕분에 갤러리는 둘을 구분하지 않고 다룬다.
//
// 파일이 브라우저 밖으로 나가지 않는다. 추출부터 렌더까지 이 탭 안에서 끝난다.

/**
 * 전시 작품과 같은 타일 크기 — 갤러리 안에서 붓터치 크기가 흔들리지 않게.
 * index.ts의 CELL과 **같은 값이어야 한다**. 한쪽만 고치면 내가 올린 이미지에서만
 * 붓터치가 굵거나 가늘어진다.
 */
const CELL = 11;

/** 확장자를 뗀 파일명 */
function displayName(name: string) {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

export async function entryFromFile(file: File): Promise<WorkEntry> {
  const data = await extractPainting(file);
  const { sat, gain } = autoTone(data);
  const parts = paintingWork(data, sat, gain);
  return {
    title: displayName(file.name) || "이미지",
    sub: "",
    desc: "",
    cell: CELL,
    aspect: parts.aspect,
    uploaded: true,
    load: async () => parts,
  };
}
