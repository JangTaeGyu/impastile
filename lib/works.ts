import { exhibits } from "@/lib/scenes";
import type { Artist } from "@/lib/scenes/types";
import type { WorkEntry } from "@/lib/facture/types";
import { splitSub } from "@/lib/site";

/**
 * 전시관에 걸린 작품을 한 줄로 편 목록. 갤러리는 전시관 → 작품의 두 겹이지만
 * 주소(`/work/<슬러그>`)와 사이트맵과 개요는 평평한 목록이 필요하다.
 */
export interface Located {
  entry: WorkEntry;
  artist: Artist;
  /** 전시관 이름 — 탭에 뜨는 그것 */
  exhibit: string;
  /** 갤러리에서의 자리 (탭 번호, 탭 안의 순번) */
  tab: number;
  idx: number;
  slug: string;
  /** sub를 갈라둔 것 — 페이지마다 다시 쪼개지 않도록 */
  original: string;
  year: string;
  holder: string;
}

/**
 * 원제에서 주소를 만든다. NFD로 풀어 결합 문자를 떼므로 Café는 cafe가 되고
 * Grenouillère는 grenouillere가 된다.
 *
 * ⚠ 주소는 원제를 따라간다 — `sub`의 첫 칸을 고치면 그 작품의 주소가 바뀌고
 * 이미 퍼진 링크가 끊긴다. 오타를 고칠 때도 한 번 더 생각한다.
 */
export const slugify = (original: string) =>
  original
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const locatedWorks: Located[] = exhibits.flatMap((e, tab) => {
  const artist = e.artist;
  if (!artist) return []; // '나의 전시관'은 런타임에만 있다
  return e.works.map((entry, idx) => {
    const { original, year, holder } = splitSub(entry.sub);
    return {
      entry,
      artist,
      exhibit: e.name,
      tab,
      idx,
      slug: slugify(original),
      original,
      year,
      holder,
    };
  });
});

// 원제가 겹치면 두 작품이 같은 주소를 갖고 하나가 조용히 사라진다.
// 지금은 마흔두 점 모두 다르지만 작품을 추가할 때 걸리라고 여기서 센다.
if (process.env.NODE_ENV !== "production") {
  const seen = new Set<string>();
  for (const w of locatedWorks) {
    if (seen.has(w.slug)) {
      console.warn(`[works] 슬러그가 겹친다: ${w.slug} (${w.entry.title})`);
    }
    seen.add(w.slug);
  }
}

const bySlug = new Map(locatedWorks.map((w) => [w.slug, w]));

export const findWork = (slug: string) => bySlug.get(slug);

/** 작품 한 점의 주소 — 여기서만 만든다 */
export const workPath = (slug: string) => `/work/${slug}`;
