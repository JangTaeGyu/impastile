import type { WorkEntry } from "@/lib/engine/types";

export interface Artist {
  ko: string;
  en: string;
  era: string;
  movement: string;
}

/**
 * 전시관 하나 — 탭 하나에 대응한다.
 * 작가를 추가할 때는 데이터를 뽑고 index.ts의 exhibits에 전시관을 하나 더
 * 밀어 넣으면 된다. 사용자가 올린 이미지를 담는 '나의 전시관'은 런타임에
 * 만들어져 뒤에 붙는다.
 */
export interface Exhibit {
  /** 탭에 그대로 뜬다 */
  name: string;
  /** 없으면 작품 정보 패널에서 작가 줄을 뺀다 (나의 전시관) */
  artist?: Artist;
  works: WorkEntry[];
}
