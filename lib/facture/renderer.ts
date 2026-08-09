import { fitRect } from "./fit";
import { clamp, hash, lerp, smooth } from "./math";
import type { FlowFn, Scene, Work } from "./types";

const BG_R = 10;
const BG_G = 12;
const BG_B = 25;
const BG = `rgb(${BG_R},${BG_G},${BG_B})`;
const MIX_RATE = 2.7; // 크로스페이드 속도 (1/s) — 완료까지 약 0.37s
const MAX_DT = 0.25; // 스로틀·탭 복귀 시 시간 점프 상한 (s)

/**
 * 초당 그리는 장수 상한.
 *
 * 한 장에 스트로크 2만 5천 개를 긋는데, 비용은 칠하는 넓이가 아니라 그 호출
 * 하나하나에 붙는다 (면적을 75% 줄여도 7%가 빠지고, 개수를 41% 줄이면 39%가
 * 빠진다). 그러니 해상도나 붓터치 크기를 건드리는 대신 장수를 줄인다.
 *
 * 한 장 안에서 움직이는 것은 아주 느린 색 표류(0.003)와 ±4% 숨결뿐이라
 * 60에서 30으로 내려도 정지 화면은 완전히 같고 움직임의 결도 유지된다.
 */
const FPS_CAP = 30;
// 표시 주기가 딱 나누어떨어지지 않아 한 장씩 걸러지는 것을 막는 여유
const MIN_DT = 1 / FPS_CAP - 0.004;

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

// ── 셀 상수 표 ────────────────────────────────────────────────────────────
// hash(cI, rI)가 주는 붓값·길이·폭·자리 흔들림은 **셀 인덱스에만** 달렸다.
// 시간에도 셀 크기에도 무관하니 프레임마다 다시 구할 이유가 없는데, 셀당 5번
// (=프레임당 6만 번) Math.sin을 돌고 있었다. 격자가 바뀔 때만 한 번 굽는다.
class CellTable {
  readonly stride: number;
  readonly brush: Float32Array;
  readonly lenF: Float32Array;
  readonly wdtF: Float32Array;
  readonly jx: Float32Array;
  readonly jy: Float32Array;
  /** 숨결 sin(t·5 + cI + rI)을 각도 덧셈으로 풀기 위한 sin/cos(cI+rI) */
  readonly bs: Float32Array;
  readonly bc: Float32Array;

  constructor(
    readonly cols: number,
    readonly rows: number,
  ) {
    // 셀 하나 바깥부터 그리므로 -1..cols 를 담는다
    const stride = cols + 2;
    const n = stride * (rows + 2);
    this.stride = stride;
    this.brush = new Float32Array(n);
    this.lenF = new Float32Array(n);
    this.wdtF = new Float32Array(n);
    this.jx = new Float32Array(n);
    this.jy = new Float32Array(n);
    for (let rI = -1; rI <= rows; rI++) {
      const row = (rI + 1) * stride;
      for (let cI = -1; cI <= cols; cI++) {
        const i = row + cI + 1;
        this.brush[i] = 1 + (hash(cI, rI) - 0.5) * 0.16;
        this.lenF[i] = 1.7 + hash(cI, rI + 13) * 0.6;
        this.wdtF[i] = 0.5 + hash(cI + 5, rI) * 0.26;
        this.jx[i] = (hash(cI, rI + 7) - 0.5) * 0.5;
        this.jy[i] = (hash(cI + 3, rI) - 0.5) * 0.5;
      }
    }
    const kn = cols + rows + 3;
    this.bs = new Float32Array(kn);
    this.bc = new Float32Array(kn);
    for (let k = 0; k < kn; k++) {
      this.bs[k] = Math.sin(k - 2);
      this.bc[k] = Math.cos(k - 2);
    }
  }

  /** 이 표로 cols×rows 격자를 덮을 수 있나 (줄어드는 쪽은 다시 굽지 않는다) */
  covers(cols: number, rows: number) {
    return cols <= this.cols && rows <= this.rows;
  }
}

// ── 색 문자열 캐시 ─────────────────────────────────────────────────────────
// fillStyle에는 문자열밖에 못 넣는다. 셀마다 `rgb(...)`를 새로 짓느라 프레임당
// 2만 개가 넘는 문자열이 생기고, 브라우저는 그때마다 CSS 색을 다시 파싱한다.
// 채널당 6비트로 양자화해 캐시를 유한하게 만들고(2^18칸) 같은 문자열 객체를
// 돌려쓴다 — 브라우저의 파싱 캐시에도 그대로 얹힌다.
//
// 잃는 것은 채널당 최대 3/255(1.2%)인데, 이 렌더러는 셀마다 ±8%의 붓값과
// ±4%의 숨결을 이미 곱하고 있어 눈에 닿지 않는다.
const CQ = 6;
const CSHIFT = 8 - CQ;
const colorTab = new Array<string>(1 << (CQ * 3));

function css(r: number, g: number, b: number): string {
  const qr = r >> CSHIFT;
  const qg = g >> CSHIFT;
  const qb = b >> CSHIFT;
  const i = (qr << (CQ * 2)) | (qg << CQ) | qb;
  const hit = colorTab[i];
  if (hit !== undefined) return hit;
  return (colorTab[i] =
    `rgb(${qr << CSHIFT},${qg << CSHIFT},${qb << CSHIFT})`);
}

/**
 * 임파스토 붓터치 렌더러.
 * 매 프레임 화면을 셀 그리드로 나누고 셀 중심마다 scene 색과 flow 방향을
 * 샘플링한 뒤, 흐름을 따라 회전된 길쭉한 스트로크(+ 밝은 릿지)를 그린다.
 * 좌표계는 CSS 픽셀 기준이며 devicePixelRatio는 변환 행렬에만 반영된다.
 *
 * 크기는 창이 아니라 **캔버스가 CSS로 차지한 상자**에서 온다. 갤러리처럼 화면을
 * 덮든(100vw/100vh) 문서 안에 끼든 같은 코드로 돈다.
 */
export class FactureRenderer {
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
  private tab: CellTable | null = null;

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
    const W = this.cv.clientWidth;
    const H = this.cv.clientHeight;
    // 아직 레이아웃 전이거나 숨겨져 있다 — 크기가 잡히면 다시 불린다
    if (!W || !H) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cv.width = Math.round(W * this.dpr);
    this.cv.height = Math.round(H * this.dpr);
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
    this.raf = requestAnimationFrame(this.frame);
    if (!this.lastNow) {
      this.lastNow = now;
      return;
    }
    // 아직 한 장을 그릴 만큼 시간이 차지 않았다 — 표시 주기는 그대로 두고
    // 그리기만 거른다. dt는 걸러진 만큼 쌓여 오므로 속도는 변하지 않는다.
    const dt = Math.min((now - this.lastNow) / 1000, MAX_DT);
    if (dt < MIN_DT) return;
    this.lastNow = now;
    this.t += dt;
    if (this.mixT < 1) this.mixT = Math.min(1, this.mixT + MIX_RATE * dt);
    this.cell = lerp(this.cell, this.targetCell, 1 - Math.pow(0.002, dt));
    this.draw();
  };

  /** 한 장 그린다. 시간을 건드리지 않으므로 멈춘 상태에서도 부를 수 있다 */
  private draw() {
    const PT = this.t;
    const { ctx, dpr } = this;
    const W = this.cv.clientWidth;
    const H = this.cv.clientHeight;
    if (!W || !H) return;
    const ar = W / H;
    const cs = this.cell;
    const cols = Math.ceil(W / cs) + 1;
    const rows = Math.ceil(H / cs) + 1;
    const m = smooth(0, 1, this.mixT);
    const fading = m < 1;

    // 셀 크기가 전환 중 부드럽게 움직이면 격자도 매 프레임 조금씩 바뀐다.
    // 여유를 두고 굽고 줄어들 때는 그대로 써서, 그때마다 다시 굽지 않는다.
    let tab = this.tab;
    if (!tab || !tab.covers(cols, rows)) {
      tab = this.tab = new CellTable(cols + 8, rows + 8);
    }
    const { brush: tBrush, lenF: tLen, wdtF: tWdt, jx: tJx, jy: tJy } = tab;
    const tStride = tab.stride;
    // 숨결은 sin(t·5 + k), k = cI + rI. 각도 덧셈으로 풀면 셀당 sin 한 번이 준다.
    const bSin = Math.sin(PT * 5);
    const bCos = Math.cos(PT * 5);

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
      const tRow = (rI + 1) * tStride;
      for (let cI = -1; cI < cols; cI++) {
        const ti = tRow + cI + 1;
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
        const k = cI + rI + 2;
        let bright = tBrush[ti] * (1 + 0.5 * smooth(0.62, 1.0, lum));
        bright *= 1 + 0.04 * (bSin * tab.bc[k] + bCos * tab.bs[k]);
        rr = clamp(rr * bright, 0, 255);
        gg = clamp(gg * bright, 0, 255);
        bb = clamp(bb * bright, 0, 255);
        // 스트로크 기하 — 길이·폭·위치가 셀마다 조금씩 다르다
        const len = cs * tLen[ti];
        const wdt = cs * tWdt[ti];
        const px = cI * cs + cs / 2 + tJx[ti] * cs;
        const py = rI * cs + cs / 2 + tJy[ti] * cs;
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
        ctx.fillStyle = css(rr | 0, gg | 0, bb | 0);
        ctx.fillRect(-len / 2, -wdt / 2, len, wdt);
        // 물감이 솟은 릿지 — 어두운 셀에서는 보이지 않으므로 생략 (드로우 절감)
        if (lum > 0.1) {
          const hr = clamp(rr * 1.18 + 14, 0, 255) | 0;
          const hg = clamp(gg * 1.18 + 14, 0, 255) | 0;
          const hb = clamp(bb * 1.14 + 10, 0, 255) | 0;
          ctx.fillStyle = css(hr, hg, hb);
          ctx.fillRect(-len / 2 + len * 0.08, -wdt / 2, len * 0.84, wdt * 0.3);
        }
      }
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}
