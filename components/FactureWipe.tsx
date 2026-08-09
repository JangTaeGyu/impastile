"use client";

import { useMemo, useState } from "react";
import FactureCanvas from "./FactureCanvas";
import type { Work } from "@/lib/facture/types";
import s from "./about.module.css";

/**
 * 이 문서의 논지를 한 장으로.
 *
 * 같은 작품을 두 벌 그려 겹친다. 위 캔버스는 방향을 버린 판(flow ≡ 0),
 * 아래는 원화에서 뽑은 방향장. 셀 격자도 색도 스트로크 위치도 같으므로
 * 이음매를 끌면 **각도만** 바뀌는 것이 보인다.
 */
export default function FactureWipe({
  work,
  still,
}: {
  work: Work;
  still?: boolean;
}) {
  const [x, setX] = useState(46);
  // 방향을 버린 판 — 렌더러가 그대로 쓰는 Work라 다른 경로가 없다
  const flat = useMemo<Work>(() => ({ ...work, flow: () => 0 }), [work]);

  return (
    <div className={s.wipeStack}>
      <FactureCanvas work={work} className={s.wipeCanvas} still={still} />
      <div
        className={s.wipeStack}
        style={{ clipPath: `inset(0 ${100 - x}% 0 0)` }}
      >
        <FactureCanvas work={flat} className={s.wipeCanvas} still={still} />
      </div>

      <span className={`${s.tag} ${s.tagL}`}>격자 — 방향 없음</span>
      <span className={`${s.tag} ${s.tagR}`}>붓결 — 원화의 방향장</span>

      <input
        className={s.wipeRange}
        type="range"
        min={0}
        max={100}
        value={x}
        onChange={(e) => setX(+e.target.value)}
        aria-label="붓결이 드러나는 지점"
        aria-valuetext={`왼쪽에서 ${x}%`}
      />
      <div className={s.seam} style={{ left: `${x}%` }}>
        <span className={s.seamDot}>‹ ›</span>
      </div>
    </div>
  );
}
