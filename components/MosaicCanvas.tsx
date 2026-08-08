"use client";

import { useEffect, useRef } from "react";
import { MosaicRenderer } from "@/lib/engine/renderer";
import type { Work } from "@/lib/engine/types";

export default function MosaicCanvas({ work }: { work: Work }) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<MosaicRenderer | null>(null);
  const initialWork = useRef(work);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const rd = new MosaicRenderer(cv, initialWork.current);
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
