"use client";

import { useSyncExternalStore } from "react";

const REDUCED = "(prefers-reduced-motion: reduce)";

/**
 * 사용자가 움직임을 줄여 달라고 해 두었는가.
 *
 * 미디어 쿼리는 React 바깥의 상태다 — 구독해서 읽는다. 서버에는 창이 없으므로
 * false로 시작하고, 클라이언트에서 실제 값으로 맞춰진다.
 *
 * 갤러리(`Gallery`)와 소개 문서(`AboutDoc`)가 함께 쓴다. 한쪽만 지키면
 * 같은 설정으로 들어온 사람이 한 화면에서는 정지를, 다른 화면에서는 움직임을
 * 보게 된다.
 */
export function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = matchMedia(REDUCED);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => matchMedia(REDUCED).matches,
    () => false,
  );
}
