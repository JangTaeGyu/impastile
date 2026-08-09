import { fitRect } from "./fit";
import { clamp, hash, lerp, smooth } from "./math";
import type { FlowFn, Scene, Work } from "./types";

const BG_R = 10;
const BG_G = 12;
const BG_B = 25;
const BG = `rgb(${BG_R},${BG_G},${BG_B})`;
const MIX_RATE = 2.7; // 크로스페이드 속도 (1/s) — 완료까지 약 0.37s
const MAX_DT = 0.25; // 스로틀·탭 복귀 시 시간 점프 상한 (s)

// 방향장이 없는 씬의 기본 흐름 — 완만하게 굽이치는 수평 붓결
export const DEFAULT_FLOW: FlowFn = (nx, ny) =>
  0.35 * Math.sin(nx * 5 + ny * 3) + 0.2 * Math.sin(ny * 9 - nx * 4);

// 비율을 지켜 앉히면 그림 옆에 여백이 남는다. 비워두면 화면이 끊겨 보여서
// 바탕도 붓으로 칠한다.
//
// 결은 작품과 무관한 소용돌이가 그림을 감싸고 돈다 — 작품이 바뀌어도 바탕의
// 흐름은 고요하다. 색은 반대로 작품에서 이어받는다: 그림 가장자리 색을 물고
// 나가되 멀어질수록 바닥으로 잦아들어, 여백이 그림에서 번져 나온 것처럼 보인다.
const GROUND_R = 17;
const GROUND_G = 20;
const GROUND_B = 36;
/** 가장자리에서 작품 색을 얼마나 물고 나갈지 (0이면 무채색 바탕) */
const GROUND_MIX = 0.2;

/** 여백의 붓결 — 소용돌이 중심은 그림에 가려 보이지 않는다 */
function groundFlow(sx: number, sy: number, t: number) {
  const dx = sx - 0.5;
  const dy = sy - 0.5;
  const r = Math.sqrt(dx * dx + dy * dy);
  return Math.atan2(dy, dx) + Math.PI / 2 + 0.6 * Math.sin(r * 14 - t * 0.25);
}

/**
 * 여백 한 셀의 색을 out에 쓴다.
 * ux,uy는 그림 좌표라 밖에서는 0..1을 벗어나 있다 — 가장자리로 당겨 샘플링하고
 * 벗어난 거리만큼 바닥색 쪽으로 되돌린다.
 */
function groundColor(
  scene: Scene,
  ux: number,
  uy: number,
  t: number,
  ar: number,
  out: [number, number, number],
) {
  const cx = ux < 0 ? 0 : ux > 1 ? 1 : ux;
  const cy = uy < 0 ? 0 : uy > 1 ? 1 : uy;
  const c = scene(cx, cy, t, ar);
  const d = Math.max(
    ux < 0 ? -ux : ux > 1 ? ux - 1 : 0,
    uy < 0 ? -uy : uy > 1 ? uy - 1 : 0,
  );
  const k = GROUND_MIX / (1 + d * 5);
  out[0] = GROUND_R + (c[0] - GROUND_R) * k;
  out[1] = GROUND_G + (c[1] - GROUND_G) * k;
  out[2] = GROUND_B + (c[2] - GROUND_B) * k;
}

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
  private curAspect?: number;
  private prevAspect?: number;
  private mixT = 1;
  private cell: number;
  private targetCell: number;
  private t = 0;
  private lastNow = 0;
  private raf = 0;
  private running = false;
  private dpr = 1;
  // 셀마다 새로 만들지 않도록 미리 잡아둔다 (프레임당 약 1만 회)
  private gPrev: [number, number, number] = [0, 0, 0];
  private gCur: [number, number, number] = [0, 0, 0];

  constructor(
    private cv: HTMLCanvasElement,
    initial: Work,
  ) {
    const ctx = cv.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    this.ctx = ctx;
    this.curScene = initial.scene;
    this.prevScene = initial.scene;
    this.curFlow = initial.flow ?? DEFAULT_FLOW;
    this.prevFlow = this.curFlow;
    this.curAspect = initial.aspect;
    this.prevAspect = initial.aspect;
    this.cell = initial.cell;
    this.targetCell = initial.cell;
    this.resize();
  }

  resize = () => {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cv.width = Math.round(innerWidth * this.dpr);
    this.cv.height = Math.round(innerHeight * this.dpr);
    // 크기를 바꾸면 캔버스가 지워진다. 멈춘 상태(탭이 숨겨진 동안)라면
    // 다음 프레임이 오지 않으므로 여기서 한 장 다시 그려둔다.
    this.draw();
  };

  /** 새 작품으로 크로스페이드 전환 */
  transitionTo(work: Work) {
    this.prevScene = this.curScene;
    this.prevFlow = this.curFlow;
    this.prevAspect = this.curAspect;
    this.curScene = work.scene;
    this.curFlow = work.flow ?? DEFAULT_FLOW;
    this.curAspect = work.aspect;
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
    if (this.mixT < 1) this.mixT = Math.min(1, this.mixT + MIX_RATE * dt);
    this.cell = lerp(this.cell, this.targetCell, 1 - Math.pow(0.002, dt));
    this.draw();
    this.raf = requestAnimationFrame(this.frame);
  };

  /** 한 장 그린다. 시간을 건드리지 않으므로 멈춘 상태에서도 부를 수 있다 */
  private draw() {
    const PT = this.t;
    const { ctx, dpr } = this;
    const W = innerWidth;
    const H = innerHeight;
    const ar = W / H;
    const cs = this.cell;
    const cols = Math.ceil(W / cs) + 1;
    const rows = Math.ceil(H / cs) + 1;
    const m = smooth(0, 1, this.mixT);
    const fading = m < 1;

    // 원본 비율을 지켜 화면에 앉힌다 — 그림 밖은 바닥만 남는다.
    // 씬에 넘기는 비율도 화면이 아니라 그림 영역의 것이어야 한다.
    const cf = fitRect(this.curAspect, ar);
    const pf = fitRect(this.prevAspect, ar);
    const curAr = this.curAspect ?? ar;
    const prevAr = this.prevAspect ?? ar;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    // 회전 스트로크가 화면 가장자리를 비우지 않도록 한 셀 바깥부터 그린다
    for (let rI = -1; rI < rows; rI++) {
      for (let cI = -1; cI < cols; cI++) {
        const sx = ((cI + 0.5) * cs) / W;
        const sy = ((rI + 0.5) * cs) / H;
        const ux = (sx - cf.x) / cf.w;
        const uy = (sy - cf.y) / cf.h;
        const inCur = ux >= 0 && ux <= 1 && uy >= 0 && uy <= 1;

        // 나가는 씬과 들어오는 씬의 크로스페이드
        let rr: number;
        let gg: number;
        let bb: number;
        let a: number;
        if (!fading) {
          if (inCur) {
            const c = this.curScene(ux, uy, PT, curAr);
            rr = c[0];
            gg = c[1];
            bb = c[2];
            a = this.curFlow(ux, uy, PT, curAr);
          } else {
            const g = this.gCur;
            groundColor(this.curScene, ux, uy, PT, curAr, g);
            rr = g[0];
            gg = g[1];
            bb = g[2];
            a = groundFlow(sx, sy, PT);
          }
        } else {
          const vx = (sx - pf.x) / pf.w;
          const vy = (sy - pf.y) / pf.h;
          const inPrev = vx >= 0 && vx <= 1 && vy >= 0 && vy <= 1;
          // 결은 작품과 무관하니 양쪽이 같다 — 색만 각자 구한다
          const ga = inPrev && inCur ? 0 : groundFlow(sx, sy, PT);
          let pr: number;
          let pg: number;
          let pb: number;
          let a0 = ga;
          if (inPrev) {
            const p = this.prevScene(vx, vy, PT, prevAr);
            pr = p[0];
            pg = p[1];
            pb = p[2];
            a0 = this.prevFlow(vx, vy, PT, prevAr);
          } else {
            const g = this.gPrev;
            groundColor(this.prevScene, vx, vy, PT, prevAr, g);
            pr = g[0];
            pg = g[1];
            pb = g[2];
          }
          let qr: number;
          let qg: number;
          let qb: number;
          let a1 = ga;
          if (inCur) {
            const q = this.curScene(ux, uy, PT, curAr);
            qr = q[0];
            qg = q[1];
            qb = q[2];
            a1 = this.curFlow(ux, uy, PT, curAr);
          } else {
            const g = this.gCur;
            groundColor(this.curScene, ux, uy, PT, curAr, g);
            qr = g[0];
            qg = g[1];
            qb = g[2];
          }
          rr = lerp(pr, qr, m);
          gg = lerp(pg, qg, m);
          bb = lerp(pb, qb, m);
          // 방향은 벡터로 보간 — 각도 뜀 없이 섞인다
          a = Math.atan2(
            lerp(Math.sin(a0), Math.sin(a1), m),
            lerp(Math.cos(a0), Math.cos(a1), m),
          );
        }
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
  }
}
