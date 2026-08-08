"use client";

import { useEffect, useRef } from "react";
import { MosaicRenderer } from "@/lib/engine/renderer";
import type { Work } from "@/lib/engine/types";

export default function MosaicCanvas({ work }: { work: Work }) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<MosaicRenderer | null>(null);
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
    const rd = new MosaicRenderer(cv, workRef.current);
    rendererRef.current = rd;
    rd.start();

    const onVis = () => (document.hidden ? rd.stop() : rd.start());

    addEventListener("resize", rd.resize);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      rd.stop();
      removeEventListener("resize", rd.resize);
      document.removeEventListener("visibilitychange", onVis);
      rendererRef.current = null;
    };
  }, []);

  // 작품이 바뀌면 크로스페이드 전환 (같은 씬으로의 전환은 시각적으로 무해)
  useEffect(() => {
    rendererRef.current?.transitionTo(work);
  }, [work]);

  return <canvas ref={cvRef} className="mosaic" aria-hidden />;
}
