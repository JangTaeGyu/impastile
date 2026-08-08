"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MosaicCanvas from "./MosaicCanvas";
import { baseWorks } from "@/lib/scenes";

const AUTO_MS = 7000;
const FADE_MS = 420;

export default function Gallery() {
  const [idx, setIdx] = useState(0); // 캔버스가 그리는 작품
  const [shownIdx, setShownIdx] = useState(0); // 제목이 보여주는 작품 (전환 후 갱신)
  const [fading, setFading] = useState(false);

  const idxRef = useRef(idx);
  const fadeTimer = useRef(0);

  useEffect(() => {
    idxRef.current = idx;
  }, [idx]);

  const go = useCallback((i: number) => {
    const len = baseWorks.length;
    const n = ((i % len) + len) % len;
    setIdx(n);
    setFading(true);
    window.clearTimeout(fadeTimer.current);
    fadeTimer.current = window.setTimeout(() => {
      setShownIdx(n);
      setFading(false);
    }, FADE_MS);
  }, []);

  // 7초 자동 슬라이드 — 사용자 입력 시 타이머 리셋
  useEffect(() => {
    let auto = window.setInterval(() => go(idxRef.current + 1), AUTO_MS);
    const reset = () => {
      window.clearInterval(auto);
      auto = window.setInterval(() => go(idxRef.current + 1), AUTO_MS);
    };
    addEventListener("mousedown", reset);
    addEventListener("keydown", reset);
    return () => {
      window.clearInterval(auto);
      window.clearTimeout(fadeTimer.current);
      removeEventListener("mousedown", reset);
      removeEventListener("keydown", reset);
    };
  }, [go]);

  // ←/→ 키보드 네비게이션
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(idxRef.current + 1);
      if (e.key === "ArrowLeft") go(idxRef.current - 1);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [go]);

  return (
    <>
      <MosaicCanvas work={baseWorks[idx]} />
      <div className="grain" />
      <div className="scrim" />

      <div className="ui">
        <div />
        <div className="panel">
          <h1 className={`fade${fading ? " out" : ""}`}>
            {baseWorks[shownIdx].title}
          </h1>
        </div>
        <div className="foot">
          <div className="nav">
            <div className="dots">
              {baseWorks.map((w, i) => (
                <i
                  key={i}
                  className={i === idx ? "on" : undefined}
                  onClick={() => go(i)}
                  title={w.title}
                />
              ))}
            </div>
            <button className="arrow" onClick={() => go(idx - 1)} aria-label="이전 작품">
              ‹
            </button>
            <button className="arrow" onClick={() => go(idx + 1)} aria-label="다음 작품">
              ›
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
