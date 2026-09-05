"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import FactureWipe from "./FactureWipe";
import FlowTicks from "./FlowTicks";
import Logo from "./Logo";
import { baseWorks } from "@/lib/scenes";
import { loadWork } from "@/lib/scenes/load";
import type { Work } from "@/lib/facture/types";
import s from "./about.module.css";

// 배각 다이어그램의 각도 —
// 10°에서 170°로 건너간다. 두 각은 0°/180° 쪽으로 20°밖에 안 떨어져 있는데,
// 각도를 그대로 섞으면 반대편으로 160°를 돌아 도중에 수직(90°)을 지난다.
// 배각 벡터로 섞으면 0°를 지나며 거의 눕지 않는다.
const NAIVE = [10, 50, 90, 130, 170];
const DOUBLED = [10, 5.2, 0, -5.2, -10];

const REDUCED = "(prefers-reduced-motion: reduce)";

/** 미디어 쿼리는 바깥의 상태다 — 구독해서 읽는다 (서버에는 창이 없어 false) */
function useReducedMotion() {
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

export default function AboutDoc() {
  const [work, setWork] = useState<Work | null>(null);
  const still = useReducedMotion();

  useEffect(() => {
    let alive = true;
    // 갤러리와 같은 캐시를 쓴다 — 첫 작품은 어차피 받아야 할 청크다
    loadWork(baseWorks[0]).then((w) => {
      if (alive) setWork(w);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className={s.doc}>
      <header className={s.bar}>
        <Logo href="/" />
        <Link className={s.back} href="/">
          Gallery ›
        </Link>
      </header>

      <section className={s.hero}>
        {work ? (
          <FactureWipe work={work} still={still} />
        ) : (
          <div className={s.wait}>The Starry Night — loading</div>
        )}
        <div className={s.heroText}>
          <div className={s.heroInner}>
            <div className={s.kicker}>The painting engine</div>
            <h1 className={s.title}>Facture</h1>
          </div>
        </div>
      </section>

      <div className={s.wrap}>
        <p className={s.lead}>
          In art history, facture means <b>the way the paint is laid on</b>. Not
          what was painted, but how the brush went. That is what this engine
          carries across.
        </p>
        <p className={s.leadNote}>
          Above is Van Gogh’s The Starry Night drawn twice and laid one over the
          other. Drag the seam: on the left, direction thrown away; on the
          right, the brush direction pulled out of the original. The colour, the
          stroke positions and the cell grid are identical — only the angle
          differs. That difference is the whole project.
        </p>

        {/* ── 스타일: 순서가 아니라 동시에 성립하는 규칙들 ── */}
        <section className={s.section}>
          <div className={s.label}>Style</div>
          <div className={s.col}>
            <h2>
              It is not a mosaic.
              <br />
              Three rules make the difference.
            </h2>
            <p>
              Slicing a screen into a grid and filling it with colour is common
              enough. What separates the Facture look from that is the three
              rules below — and they are not a sequence. All three hold at every
              cell at once.
            </p>

            <div className={s.rules}>
              <div className={s.rule}>
                <h3>No colour is invented</h3>
                <p>
                  Every colour on screen comes from the original. A colour map
                  reduced to 144px on its long side is sampled bilinearly; there
                  is no palette kept on the side. A screen does read duller than
                  paint, so saturation is lifted ×1.28 and brightness ×1.07 —
                  not making colours that were never there, but recovering what
                  the display loses.
                </p>
              </div>

              <div className={s.rule}>
                <h3>Direction does not follow the grid</h3>
                <p>
                  Each cell’s stroke lies along{" "}
                  <b>the direction the original was actually painted</b>. The
                  churning night sky runs along the tangent of its swirls, the
                  cypress along its vertical flame, the wheat the way the wind
                  lays it. Take the direction away and what is left is a mosaic.
                </p>
              </div>

              <div className={s.rule}>
                <h3>The paint has thickness</h3>
                <p>
                  Every stroke’s length, width and position sit a little off
                  from its neighbours, and a per-cell brush value shakes
                  brightness by ±8%. On bright cells a lighter ridge is laid
                  along part of the stroke to make the raised crest of impasto,
                  and that bright segment travels along the stroke’s own axis —
                  light running the way the brush went. Dark cells get no ridge;
                  it would not be visible there anyway.
                </p>
              </div>
            </div>

            <div className={s.aside}>
              <h3>And the margin</h3>
              <p>
                Fitting a work to its own proportions leaves space beside the
                picture. Left empty the screen reads as broken, so the margin is
                painted too. Its grain is a swirl unrelated to the work,
                wrapping around the picture — it stays calm even as works change
                — while its colour does the opposite, taking hold at the
                picture’s edge and fading toward the ground as it goes. The
                point is to make the margin look like something that bled out of
                the painting.
              </p>
            </div>
          </div>
        </section>

        {/* ── 엔진: 이쪽은 진짜 순서다 ── */}
        <section className={s.section}>
          <div className={s.label}>Engine</div>
          <div className={s.col}>
            <h2>How one painting reaches the screen</h2>
            <p>
              The early approach of drawing procedurally was abandoned. Every
              scene now samples data pulled out of the original painting. There
              are four steps: the first two happen once, before the build; the
              last two on every frame.
            </p>

            <div className={s.steps}>
              <div>
                <div className={s.stepNo}>01</div>
                <h3>Two sheets are baked from the original</h3>
                <p>
                  The extractor pulls a <b>colour map</b> and a{" "}
                  <b>brush-direction field</b> out of the source image and
                  writes them as a TS module. The colour is RGB reduced to 144px
                  on its long side, proportions kept. The direction comes from
                  the <b>structure tensor</b> — find where luminance climbs most
                  steeply, then take the contour direction orthogonal to it.
                  That contour is exactly the grain the paint was laid in. Flat
                  places, where the gradient is even, have no direction to speak
                  of, so the field is weighted by coherence and blurred again to
                  let them borrow their neighbours’.
                </p>
                <figure className={`${s.fig} ${s.figFull}`}>
                  <div className={s.figBox}>
                    {work && <FlowTicks work={work} className={s.ticks} />}
                  </div>
                  <figcaption className={s.figCap}>
                    The direction field of The Starry Night, with colour
                    stripped and only the angle at each point drawn. It calls
                    the same function the renderer reads, so the grain you see
                    here is the direction the strokes lie in.
                  </figcaption>
                </figure>
              </div>

              <div>
                <div className={s.stepNo}>02</div>
                <h3>Two fields make a scene</h3>
                <p>
                  At runtime a work is two functions. They see the area the
                  picture occupies as 0..1 coordinates; one returns the colour
                  at that point, the other the brush angle.
                </p>
                <pre className={s.code}>
                  <b>type Scene</b>
                  {"  = (nx, ny, t, ar) => RGB      "}
                  <i>{"// colour at the point"}</i>
                  {"\n"}
                  <b>type FlowFn</b>
                  {" = (nx, ny, t, ar) => number   "}
                  <i>{"// brush angle (rad)"}</i>
                </pre>
                <p>
                  Both are called once per cell, every frame. At 1080p with an
                  11px cell that is roughly 17,600 calls a frame. Which is why
                  these functions never build an array or an object inside.
                </p>
              </div>

              <div>
                <div className={s.stepNo}>03</div>
                <h3>One cell is laid down</h3>
                <p>
                  The renderer divides the canvas into a cell grid and takes a
                  colour and an angle at each cell centre. It rotates the
                  coordinate system by that angle, lays down one elongated
                  rectangle, and on bright cells puts a ridge on top. Length,
                  width and position are shaken by a deterministic hash of the
                  cell coordinates, so the same place always takes the same
                  shape. The grid starts one cell outside the screen so that
                  rotated strokes never leave the edges bare.
                </p>
              </div>

              <div>
                <div className={s.stepNo}>04</div>
                <h3>Frames go by</h3>
                <p>
                  Time is handled as elapsed seconds, not as a frame count.
                  Adding a constant per frame changes the speed when a covered
                  window slows rAF down, or on a 120Hz display. dt is capped at
                  0.25s so time does not jump when you come back to the tab.
                </p>
                <p>
                  Changing works blends the outgoing scene with the incoming
                  one. Colour can simply be interpolated, but{" "}
                  <b>direction cannot.</b>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 배각 ── */}
        <section className={s.section}>
          <div className={s.label}>Direction</div>
          <div className={s.col}>
            <h2>Angles do not blend. Double-angle vectors do.</h2>
            <p>
              A brushstroke is symmetric through 180°. A brush lying at 10° and
              one at 190° are the same picture, so the sign of a direction
              carries no meaning — and blending angles as plain numbers breaks
              that fact. 10° and 170° sit only 20° apart across 0°, and yet the
              midpoint of the two numbers is 90°: exactly vertical.
            </p>
            <p>
              The fix is to double the angle and hold it as a unit vector.
              Doubled, the two become 20° and 340°, which close in on 0°; blend
              the vectors, halve the result, and it passes the near way with no
              ambiguity. It is also why the extracted field is stored in that
              form to begin with — one direction is two int8s, the cosine and
              sine of the doubled angle.
            </p>

            <figure className={`${s.fig} ${s.figFull}`}>
              <div className={s.figBox}>
                <svg
                  className={s.diagram}
                  viewBox="0 0 600 250"
                  role="img"
                  aria-label="Interpolating from 10 degrees to 170 degrees: blending the angles directly tips through vertical on the way, while blending double-angle vectors barely tips at all"
                >
                  <text
                    x="30"
                    y="34"
                    fill="#8f95b4"
                    fontSize="12"
                    letterSpacing="2.4"
                  >
                    Blending angles directly — it flips on the way
                  </text>
                  {NAIVE.map((deg, i) => (
                    <g
                      key={i}
                      transform={`translate(${76 + i * 112} 86) rotate(${deg})`}
                    >
                      <rect
                        x="-38"
                        y="-5.5"
                        width="76"
                        height="11"
                        rx="5.5"
                        fill={i === 0 || i === 4 ? "#f6f3e8" : "#8f95b4"}
                      />
                    </g>
                  ))}

                  <text
                    x="30"
                    y="176"
                    fill="#f2c14e"
                    fontSize="12"
                    letterSpacing="2.4"
                  >
                    Blending double-angle (2θ) vectors — it passes the near way
                  </text>
                  {DOUBLED.map((deg, i) => (
                    <g
                      key={i}
                      transform={`translate(${76 + i * 112} 216) rotate(${deg})`}
                    >
                      <rect
                        x="-38"
                        y="-5.5"
                        width="76"
                        height="11"
                        rx="5.5"
                        fill={i === 0 || i === 4 ? "#f6f3e8" : "#f2c14e"}
                      />
                    </g>
                  ))}
                </svg>
              </div>
              <figcaption className={s.figCap}>
                Both rows go from 10° at the left end to 170° at the right (the
                white strokes). Same start, same finish — different route.
              </figcaption>
            </figure>
          </div>
        </section>

        {/* ── 두 벌의 렌더러 ── */}
        <section className={s.section}>
          <div className={s.label}>Two copies</div>
          <div className={s.col}>
            <h2>Canvas and server share the same brush</h2>
            <p>
              What runs on screen is the canvas renderer, but the share-card
              images and the thumbnails in the strip below are made on the
              server. A server has no canvas, so a separate copy bakes the same
              stroke geometry into an SVG string. Thumbnails just shrink the
              cell to 4px and use that copy as it is — rather than writing the
              geometry out a third time.
            </p>
            <p>
              The cost is that the two copies have to be kept in step by hand.
              Change a stroke ratio or a colour correction on one side and the
              other has to follow. The extractor is in the same position: the
              Python copy that bakes ahead of time and the browser copy that
              handles an uploaded image on the spot must produce the same
              result, and a comparison script checks that they do.
            </p>
          </div>
        </section>

        {/* ── 숫자 ── */}
        <section className={s.section}>
          <div className={s.label}>Numbers</div>
          <div className={s.col}>
            <h2>The values that are fixed</h2>
            <table className={s.numbers}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Colour map, long side</td>
                  <td>144 px</td>
                </tr>
                <tr>
                  <td>Direction field working resolution</td>
                  <td>432 px</td>
                </tr>
                <tr>
                  <td>Structure tensor blur σ (pre / component / re-blur)</td>
                  <td>1.2 · 5.0 · 4.0</td>
                </tr>
                <tr>
                  <td>Size of one direction</td>
                  <td>int8 × 2 (±127)</td>
                </tr>
                <tr>
                  <td>One work</td>
                  <td>gzip about 75 KB</td>
                </tr>
                <tr>
                  <td>Cell edge</td>
                  <td>11 CSS px</td>
                </tr>
                <tr>
                  <td>Cells per frame (1080p)</td>
                  <td>about 17,600</td>
                </tr>
                <tr>
                  <td>Stroke length</td>
                  <td>1.70–2.30 × cell</td>
                </tr>
                <tr>
                  <td>Stroke width</td>
                  <td>0.50–0.76 × cell</td>
                </tr>
                <tr>
                  <td>Position jitter</td>
                  <td>±0.25 cell</td>
                </tr>
                <tr>
                  <td>Ridge (length / thickness)</td>
                  <td>38% · 30%</td>
                </tr>
                <tr>
                  <td>Ridge travel along the stroke</td>
                  <td>0.7 /s</td>
                </tr>
                <tr>
                  <td>Saturation · brightness correction</td>
                  <td>×1.28 · ×1.07</td>
                </tr>
                <tr>
                  <td>Work crossfade</td>
                  <td>2.7 /s — about 0.37 s</td>
                </tr>
                <tr>
                  <td>dt cap</td>
                  <td>0.25 s</td>
                </tr>
                <tr>
                  <td>devicePixelRatio cap</td>
                  <td>2</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <footer className={s.foot}>
          The engine code lives in <code>lib/facture/</code>, and the part that
          pulls data out of the originals in <code>lib/scenes/</code>. In the
          gallery you can upload your own image and have it redrawn with the
          same brush — the file never leaves your browser.
          <br />
          <Link href="/">Back to the gallery ›</Link>
        </footer>
      </div>
    </div>
  );
}
