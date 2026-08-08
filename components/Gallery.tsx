"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MosaicCanvas from "./MosaicCanvas";
import type { Work } from "@/lib/engine/types";
import { ERA, baseWorks } from "@/lib/scenes";

const AUTO_MS = 7000;
const FADE_MS = 420;

export default function Gallery() {
  const [works, setWorks] = useState<Work[]>(baseWorks);
  const [idx, setIdx] = useState(0); // 캔버스가 그리는 작품
  const [shownIdx, setShownIdx] = useState(0); // 패널 텍스트가 보여주는 작품 (전환 후 갱신)
  const [fading, setFading] = useState(false);

  const worksRef = useRef(works);
  const idxRef = useRef(idx);
  const fadeTimer = useRef(0);

  useEffect(() => {
    worksRef.current = works;
    idxRef.current = idx;
  }, [works, idx]);

  const go = useCallback((i: number, len = worksRef.current.length) => {
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

  const like = () =>
    setWorks((ws) =>
      ws.map((w, i) => (i === shownIdx ? { ...w, likes: w.likes + 1 } : w)),
    );

  const share = async () => {
    const w = works[shownIdx];
    const text = `${w.title} — after the essence of Vincent van Gogh`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Impastile", text, url: location.href });
      } else {
        await navigator.clipboard.writeText(`${text} · ${location.href}`);
      }
    } catch {
      // 사용자가 공유를 취소한 경우 등 — 무시
    }
  };

  const shown = works[shownIdx] ?? works[0];

  return (
    <>
      <MosaicCanvas work={works[idx] ?? works[0]} />
      <div className="grain" />
      <div className="scrim" />

      <div className="ui">
        <div className="bar">
          <div className="brand">
            IMPAS<b>::</b>TILE
          </div>
          <div className="live">
            <span className="d" />
            Mosaic Engine · Van Gogh Essence
          </div>
        </div>

        <div className="panel">
          <div className={`fade${fading ? " out" : ""}`}>
            <div className="essence">
              <span className="ic" />
              <span className="t mono">
                after the essence of&nbsp; <b>빈센트 반 고흐</b>{" "}
                <span>· 후기 인상주의</span>
              </span>
            </div>
            <div className="kicker mono">
              {"// generating · "}
              {shown.sub ?? "Vincent van Gogh"}
            </div>
            <h1>{shown.title}</h1>
            <div className="essenceline">“{shown.essence}”</div>
            <div className="meta mono">
              anon · 2026 · <b>{ERA}</b> · seed#{shown.seedHex} · ♥{" "}
              {shown.likes.toLocaleString()}
            </div>
          </div>
          <div className="actions">
            <button className="btn" onClick={like}>
              ♥ {shown.likes.toLocaleString()}
            </button>
            <button className="btn" onClick={share}>
              SHARE
            </button>
          </div>
        </div>

        <div className="foot">
          <div className="nav">
            <div className="dots">
              {works.map((w, i) => (
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
      <div className="note mono">
        {"// 붓결이 화면의 흐름을 따라 흐릅니다 · ←/→ 로 작품 이동"}
      </div>
    </>
  );
}
