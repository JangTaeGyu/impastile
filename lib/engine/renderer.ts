import { clamp, hash, lerp, smooth } from "./math";
import type { FlowFn, Scene, Work } from "./types";

const BG = "#0a0c19";
const MIX_RATE = 2.7; // 크로스페이드 속도 (1/s) — 완료까지 약 0.37s
const MAX_DT = 0.25; // 스로틀·탭 복귀 시 시간 점프 상한 (s)

// 방향장이 없는 씬의 기본 흐름 — 완만하게 굽이치는 수평 붓결
const DEFAULT_FLOW: FlowFn = (nx, ny) =>
  0.35 * Math.sin(nx * 5 + ny * 3) + 0.2 * Math.sin(ny * 9 - nx * 4);

/**
 * 임파스토 붓터치 렌더러.
 * 매 프레임 화면을 셀 그리드로 나누고 셀 중심마다 scene 색과 flow 방향을
 * 샘플링한 뒤, 흐름을 따라 회전된 길쭉한 스트로크(+ 밝은 릿지)를 그린다.
 * 좌표계는 CSS 픽셀 기준이며 devicePixelRatio는 변환 행렬에만 반영된다.
 */
export class MosaicRenderer {
  private ctx: CanvasRenderingContext2D;
  private curScene: Scene;
  private prevScene: Scene;
  private curFlow: FlowFn;
  private prevFlow: FlowFn;
  private mixT = 1;
  private cell: number;
  private targetCell: number;
  private t = 0;
  private lastNow = 0;
  private raf = 0;
  private running = false;
  private dpr = 1;

  constructor(private cv: HTMLCanvasElement, initial: Work) {
    const ctx = cv.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    this.ctx = ctx;
    this.curScene = initial.scene;
    this.prevScene = initial.scene;
    this.curFlow = initial.flow ?? DEFAULT_FLOW;
    this.prevFlow = this.curFlow;
    this.cell = initial.cell;
    this.targetCell = initial.cell;
    this.resize();
  }

  resize = () => {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cv.width = Math.round(innerWidth * this.dpr);
    this.cv.height = Math.round(innerHeight * this.dpr);
  };

  /** 새 작품으로 크로스페이드 전환 */
  transitionTo(work: Work) {
    this.prevScene = this.curScene;
    this.prevFlow = this.curFlow;
    this.curScene = work.scene;
    this.curFlow = work.flow ?? DEFAULT_FLOW;
    this.mixT = 0;
    this.targetCell = work.cell;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastNow = 0;
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  // 프레임 수가 아니라 경과 시간(dt) 기반 — rAF 스로틀링(가려진 창)이나
  // 120Hz 디스플레이에서도 애니메이션 속도가 일정하다.
  private frame = (now: number) => {
    if (!this.running) return;
    const dt = this.lastNow
      ? Math.min((now - this.lastNow) / 1000, MAX_DT)
      : 1 / 60;
    this.lastNow = now;
    this.t += dt;
    const PT = this.t;
    if (this.mixT < 1) this.mixT = Math.min(1, this.mixT + MIX_RATE * dt);
    this.cell = lerp(this.cell, this.targetCell, 1 - Math.pow(0.002, dt));

    const { ctx, dpr } = this;
    const W = innerWidth;
    const H = innerHeight;
    const ar = W / H;
    const cs = this.cell;
    const cols = Math.ceil(W / cs) + 1;
    const rows = Math.ceil(H / cs) + 1;
    const m = smooth(0, 1, this.mixT);
    const fading = m < 1;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    // 회전 스트로크가 화면 가장자리를 비우지 않도록 한 셀 바깥부터 그린다
    for (let rI = -1; rI < rows; rI++) {
      for (let cI = -1; cI < cols; cI++) {
        const nx = ((cI + 0.5) * cs) / W;
        const ny = ((rI + 0.5) * cs) / H;
        // 나가는 씬과 들어오는 씬의 크로스페이드
        let c: [number, number, number];
        let a: number;
        if (!fading) {
          c = this.curScene(nx, ny, PT, ar);
          a = this.curFlow(nx, ny, PT, ar);
        } else {
          const p = this.prevScene(nx, ny, PT, ar);
          const q = this.curScene(nx, ny, PT, ar);
          c = [lerp(p[0], q[0], m), lerp(p[1], q[1], m), lerp(p[2], q[2], m)];
          // 방향은 벡터로 보간 — 각도 뜀 없이 섞인다
          const a0 = this.prevFlow(nx, ny, PT, ar);
          const a1 = this.curFlow(nx, ny, PT, ar);
          a = Math.atan2(
            lerp(Math.sin(a0), Math.sin(a1), m),
            lerp(Math.cos(a0), Math.cos(a1), m),
          );
        }
        let rr = c[0];
        let gg = c[1];
        let bb = c[2];
        // 임파스토: 셀별 붓값 + 밝은 셀 블룸 + 미세한 숨결
        const lum = (rr * 0.3 + gg * 0.6 + bb * 0.1) / 255;
        const brush = 1 + (hash(cI, rI) - 0.5) * 0.16;
        let bright = brush * (1 + 0.5 * smooth(0.62, 1.0, lum));
        bright *= 1 + 0.04 * Math.sin(PT * 5 + cI + rI);
        rr = clamp(rr * bright, 0, 255);
        gg = clamp(gg * bright, 0, 255);
        bb = clamp(bb * bright, 0, 255);
        // 스트로크 기하 — 길이·폭·위치가 셀마다 조금씩 다르다
        const len = cs * (1.7 + hash(cI, rI + 13) * 0.6);
        const wdt = cs * (0.5 + hash(cI + 5, rI) * 0.26);
        const px = cI * cs + cs / 2 + (hash(cI, rI + 7) - 0.5) * cs * 0.5;
        const py = rI * cs + cs / 2 + (hash(cI + 3, rI) - 0.5) * cs * 0.5;
        const cosA = Math.cos(a);
        const sinA = Math.sin(a);
        ctx.setTransform(
          cosA * dpr,
          sinA * dpr,
          -sinA * dpr,
          cosA * dpr,
          px * dpr,
          py * dpr,
        );
        ctx.fillStyle = `rgb(${rr | 0},${gg | 0},${bb | 0})`;
        ctx.fillRect(-len / 2, -wdt / 2, len, wdt);
        // 물감이 솟은 릿지 — 어두운 셀에서는 보이지 않으므로 생략 (드로우 절감)
        if (lum > 0.1) {
          const hr = clamp(rr * 1.18 + 14, 0, 255) | 0;
          const hg = clamp(gg * 1.18 + 14, 0, 255) | 0;
          const hb = clamp(bb * 1.14 + 10, 0, 255) | 0;
          ctx.fillStyle = `rgb(${hr},${hg},${hb})`;
          ctx.fillRect(-len / 2 + len * 0.08, -wdt / 2, len * 0.84, wdt * 0.3);
        }
      }
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.raf = requestAnimationFrame(this.frame);
  };
}
