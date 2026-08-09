"use client";

import { useEffect, useRef } from "react";
import { DEFAULT_FLOW } from "@/lib/facture/renderer";
import type { Work } from "@/lib/facture/types";

const COLS = 40;

/**
 * 방향장만 따로 떼어 보여주는 그림.
 *
 * 색을 빼고 각 지점의 각도만 짧은 선분으로 긋는다. 렌더러가 실제로 읽는
 * 그 FlowFn을 그대로 부르므로, 여기 보이는 결이 곧 스트로크가 눕는 방향이다.
 * 정지 그림이라 rAF를 돌리지 않는다.
 */
export default function FlowTicks({
  work,
  className,
}: {
  work: Work;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const flow = work.flow ?? DEFAULT_FLOW;

    const draw = () => {
      const W = cv.clientWidth;
      const H = cv.clientHeight;
      if (!W || !H) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const step = W / COLS;
      const rows = Math.max(1, Math.round(H / step));
      const half = step * 0.42;
      const ar = work.aspect ?? W / H;
      ctx.lineWidth = 1.3;
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(242,193,78,0.72)";
      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < COLS; c++) {
          const nx = (c + 0.5) / COLS;
          const ny = (r + 0.5) / rows;
          const a = flow(nx, ny, 0, ar);
          const dx = Math.cos(a) * half;
          const dy = Math.sin(a) * half;
          const px = nx * W;
          const py = ny * H;
          ctx.moveTo(px - dx, py - dy);
          ctx.lineTo(px + dx, py + dy);
        }
      }
      ctx.stroke();
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(cv);
    return () => ro.disconnect();
  }, [work]);

  // 원본 비율을 지켜야 한다. 늘어난 상자에 그리면 각도가 눕어서, 방향을 설명하는
  // 그림이 정작 틀린 방향을 보여주게 된다.
  return (
    <canvas
      ref={ref}
      className={className}
      style={{ aspectRatio: String(work.aspect ?? 1) }}
      aria-hidden
    />
  );
}
