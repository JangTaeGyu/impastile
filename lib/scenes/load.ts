import type { Work, WorkEntry } from "@/lib/engine/types";

// 작품 데이터를 받아 Work로 만들고 기억해 둔다.
// 같은 작품을 두 번 요청해도 청크는 한 번만 받는다 (진행 중인 약속을 나눠 쓴다).

const done = new Map<WorkEntry, Work>();
const inflight = new Map<WorkEntry, Promise<Work>>();

/** 이미 받아둔 작품. 아직이면 undefined — 썸네일 자리만 잡아두면 된다. */
export function loadedWork(entry: WorkEntry): Work | undefined {
  return done.get(entry);
}

export function loadWork(entry: WorkEntry): Promise<Work> {
  const hit = done.get(entry);
  if (hit) return Promise.resolve(hit);
  const pending = inflight.get(entry);
  if (pending) return pending;

  const p = entry.load().then((parts) => {
    if (
      process.env.NODE_ENV !== "production" &&
      parts.aspect !== undefined &&
      Math.abs(parts.aspect - entry.aspect) > 0.005
    ) {
      // 레지스트리의 aspect는 손으로 적은 값이다. 데이터를 다시 뽑았는데
      // 여기를 안 고치면 썸네일 상자만 어긋난 채 조용히 지나간다.
      console.warn(
        `[impastile] "${entry.title}"의 aspect가 어긋난다 — ` +
          `index.ts ${entry.aspect.toFixed(4)} vs 데이터 ${parts.aspect.toFixed(4)}`,
      );
    }
    const work: Work = {
      title: entry.title,
      sub: entry.sub,
      desc: entry.desc,
      cell: entry.cell,
      uploaded: entry.uploaded,
      ...parts,
    };
    done.set(entry, work);
    inflight.delete(entry);
    return work;
  });
  inflight.set(entry, p);
  return p;
}

/**
 * 목록을 순서대로 받아둔다. 한 점씩 받으므로 지금 보고 있는 작품의 청크와
 * 대역폭을 다투지 않는다. 한 점이 도착할 때마다 onLoad로 알린다 (썸네일 갱신).
 */
export async function preloadWorks(
  entries: WorkEntry[],
  onLoad: () => void,
  alive: () => boolean,
) {
  for (const e of entries) {
    if (!alive()) return;
    if (done.has(e)) continue;
    try {
      await loadWork(e);
    } catch {
      // 한 점을 못 받아도 나머지는 계속 받는다
      continue;
    }
    if (alive()) onLoad();
  }
}
