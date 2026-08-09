"use client";

import { useEffect, useRef } from "react";
import { FactureRenderer } from "@/lib/facture/renderer";
import type { Work } from "@/lib/facture/types";

export default function FactureCanvas({
  work,
  className = "facture",
  still = false,
}: {
  work: Work;
  /** 기본은 화면을 덮는 갤러리 캔버스. 문서 안에 끼울 때 바꾼다 */
  className?: string;
  /** 애니메이션 없이 한 장만 그린다 (prefers-reduced-motion) */
  still?: boolean;
}) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<FactureRenderer | null>(null);
  // 재마운트(개발 중 Fast Refresh 포함) 시에도 최초 작품이 아니라
  // 현재 작품으로 렌더러를 초기화하기 위해 최신 값을 들고 있는다
  const workRef = useRef(work);

  // 아래 마운트 이펙트보다 먼저 선언해야 렌더러 생성 전에 최신 값이 채워진다
  useEffect(() => {
    workRef.current = work;
  }, [work]);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const rd = new FactureRenderer(cv, workRef.current);
    rendererRef.current = rd;

    // 보이는 동안에만 돈다. 화면을 덮는 갤러리 캔버스는 늘 교차하므로 계속 돌고,
    // 문서 안에 끼운 캔버스는 스크롤로 밀려나면 멈춘다.
    let onScreen = true;
    const sync = () => {
      if (still) return;
      if (onScreen && !document.hidden) rd.start();
      else rd.stop();
    };

    // 창 크기가 아니라 캔버스 상자를 본다 — 창이 그대로여도 레이아웃이 바뀌면 온다
    const ro = new ResizeObserver(rd.resize);
    ro.observe(cv);
    const io = new IntersectionObserver((entries) => {
      onScreen = entries[entries.length - 1].isIntersecting;
      sync();
    });
    io.observe(cv);
    document.addEventListener("visibilitychange", sync);
    sync();

    return () => {
      rd.stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      rendererRef.current = null;
    };
  }, [still]);

  // 작품이 바뀌면 크로스페이드 전환 (같은 씬으로의 전환은 시각적으로 무해)
  useEffect(() => {
    rendererRef.current?.transitionTo(work);
  }, [work]);

  return <canvas ref={cvRef} className={className} aria-hidden />;
}
