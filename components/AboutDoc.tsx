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
          갤러리로 ›
        </Link>
      </header>

      <section className={s.hero}>
        {work ? (
          <FactureWipe work={work} still={still} />
        ) : (
          <div className={s.wait}>별이 빛나는 밤에 — 받는 중</div>
        )}
        <div className={s.heroText}>
          <div className={s.heroInner}>
            <div className={s.kicker}>그림 엔진</div>
            <h1 className={s.title}>Facture</h1>
          </div>
        </div>
      </section>

      <div className={s.wrap}>
        <p className={s.lead}>
          facture는 미술사에서 <b>물감이 놓인 방식</b>을 가리킨다. 무엇을 그렸는지가
          아니라 붓이 어떻게 지나갔는지다. 이 엔진이 옮기는 것도 그쪽이다.
        </p>
        <p className={s.leadNote}>
          위 화면은 반 고흐의 별이 빛나는 밤에를 두 벌 그려 겹친 것이다. 이음매를
          끌어보면 왼쪽은 방향을 버린 판, 오른쪽은 원화에서 뽑은 붓결이다. 색도
          스트로크의 자리도 셀 격자도 같다 — 각도만 다르다. 그 차이가 이 프로젝트
          전부다.
        </p>

        {/* ── 스타일: 순서가 아니라 동시에 성립하는 규칙들 ── */}
        <section className={s.section}>
          <div className={s.label}>스타일</div>
          <div className={s.col}>
            <h2>
              모자이크가 아니다.
              <br />
              세 가지 규칙이 그 차이를 만든다.
            </h2>
            <p>
              화면을 격자로 썰어 색을 채우는 일은 흔하다. Facture 스타일을 그것과
              가르는 것은 아래 셋이며, 셋은 순서가 아니라 매 셀에서 동시에
              성립한다.
            </p>

            <div className={s.rules}>
              <div className={s.rule}>
                <h3>색은 지어내지 않는다</h3>
                <p>
                  화면의 모든 색은 원화에서 온다. 최대 변 144px로 줄인 색상 맵을
                  쌍선형 샘플링할 뿐, 따로 팔레트를 두지 않는다. 다만 화면은 물감보다
                  탁하게 보여서 채도를 1.28배, 밝기를 1.07배 올린다. 없는 색을 만드는
                  게 아니라 표시에서 잃은 색을 되찾는 보정이다.
                </p>
              </div>

              <div className={s.rule}>
                <h3>방향은 격자를 따르지 않는다</h3>
                <p>
                  각 셀의 스트로크는 <b>원화가 실제로 그어진 방향</b>으로 눕는다.
                  소용돌이치는 밤하늘은 소용돌이 접선을 따라, 사이프러스는 수직
                  불꽃결을 따라, 밀밭은 바람에 눕는 쪽으로 흐른다. 방향을 빼면 남는
                  것이 모자이크다.
                </p>
              </div>

              <div className={s.rule}>
                <h3>물감은 두께를 가진다</h3>
                <p>
                  스트로크마다 길이와 폭과 자리가 조금씩 어긋나고, 셀별 붓값이 밝기를
                  ±8% 흔든다. 밝은 셀에는 물감이 솟은 자리에 밝은 릿지를 한 줄 얹어
                  임파스토의 능선을 만든다. 어두운 셀에서는 어차피 보이지 않으므로
                  릿지를 그리지 않는다.
                </p>
              </div>
            </div>

            <div className={s.aside}>
              <h3>그리고 여백</h3>
              <p>
                원본 비율을 지켜 앉히면 그림 옆에 자리가 남는다. 비워두면 화면이 끊겨
                보이므로 여백도 붓으로 칠한다. 결은 작품과 무관한 소용돌이가 그림을
                감싸고 돌고 — 작품이 바뀌어도 이 흐름은 고요하다 — 색은 반대로 그림
                가장자리에서 물고 나가되 멀어질수록 바닥으로 잦아든다. 여백이 그림에서
                번져 나온 것처럼 보이게 하는 쪽이다.
              </p>
            </div>
          </div>
        </section>

        {/* ── 엔진: 이쪽은 진짜 순서다 ── */}
        <section className={s.section}>
          <div className={s.label}>엔진</div>
          <div className={s.col}>
            <h2>원화 한 장이 화면에 오르기까지</h2>
            <p>
              절차적으로 그림을 그리던 초기 방식은 폐기됐다. 지금은 모든 씬이 원본
              회화에서 뽑은 데이터를 샘플링한다. 순서는 넷이고, 앞의 둘은 빌드 전에
              한 번, 뒤의 둘은 매 프레임 일어난다.
            </p>

            <div className={s.steps}>
              <div>
                <div className={s.stepNo}>01</div>
                <h3>원화에서 두 장을 굽는다</h3>
                <p>
                  추출기가 원본 이미지에서 <b>색상 맵</b>과 <b>붓결 방향장</b>을 뽑아
                  TS 모듈로 내보낸다. 색은 비율을 지켜 최대 변 144px로 줄인 RGB다.
                  방향은 <b>구조 텐서</b>에서 온다 — 휘도의 기울기가 가장 가파른 쪽을
                  구하고, 거기에 직교하는 등고선 방향을 취한다. 물감이 그어진 결이
                  바로 그 등고선이다. 기울기가 고른 평탄한 자리는 방향이 없는 것과
                  같아서, 코히런스로 가중한 뒤 다시 블러해 이웃의 방향을 이어받게
                  한다.
                </p>
                <figure className={`${s.fig} ${s.figFull}`}>
                  <div className={s.figBox}>
                    {work && <FlowTicks work={work} className={s.ticks} />}
                  </div>
                  <figcaption className={s.figCap}>
                    별이 빛나는 밤에의 방향장. 색을 빼고 각 지점의 각도만 그었다.
                    렌더러가 읽는 그 함수를 그대로 부른 것이라, 여기 보이는 결이 곧
                    스트로크가 눕는 방향이다.
                  </figcaption>
                </figure>
              </div>

              <div>
                <div className={s.stepNo}>02</div>
                <h3>두 개의 장이 씬을 이룬다</h3>
                <p>
                  런타임에서 작품 하나는 함수 두 개다. 그림이 놓인 영역을 0..1 좌표로
                  보고, 한쪽은 그 지점의 색을, 다른 쪽은 붓결 각도를 돌려준다.
                </p>
                <pre className={s.code}>
                  <b>type Scene</b>
                  {"  = (nx, ny, t, ar) => RGB      "}
                  <i>{"// 지점의 색"}</i>
                  {"\n"}
                  <b>type FlowFn</b>
                  {" = (nx, ny, t, ar) => number   "}
                  <i>{"// 붓결 각도(rad)"}</i>
                </pre>
                <p>
                  둘 다 프레임마다 셀 수만큼 불린다. 1080p에 셀 13px이면 한 프레임에
                  약 1만 2천 번이다. 그래서 이 함수들은 안에서 배열이나 객체를 새로
                  만들지 않는다.
                </p>
              </div>

              <div>
                <div className={s.stepNo}>03</div>
                <h3>셀 하나가 놓인다</h3>
                <p>
                  렌더러는 캔버스를 셀 격자로 나누고 셀 중심마다 색과 각도를 뽑는다.
                  그 각도로 좌표계를 회전시킨 다음 길쭉한 사각형을 하나 놓고, 밝은
                  셀이면 그 위에 릿지를 얹는다. 길이·폭·자리는 셀 좌표에서 만든
                  결정적 해시로 흔들어, 같은 자리는 늘 같은 모양이 되게 한다. 회전한
                  스트로크가 가장자리를 비우지 않도록 격자는 화면보다 한 셀 바깥에서
                  시작한다.
                </p>
              </div>

              <div>
                <div className={s.stepNo}>04</div>
                <h3>프레임이 흐른다</h3>
                <p>
                  시간은 프레임 수가 아니라 경과 시간으로 다룬다. 프레임마다 상수를
                  더하면 창이 가려져 rAF가 느려지거나 120Hz 화면에 걸렸을 때 속도가
                  달라진다. 탭에서 돌아왔을 때 시간이 튀지 않도록 dt에는 0.25초
                  상한을 둔다.
                </p>
                <p>
                  작품을 바꾸면 나가는 씬과 들어오는 씬을 함께 섞는다. 색은 그대로
                  보간하면 되지만 <b>방향은 그럴 수 없다.</b>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 배각 ── */}
        <section className={s.section}>
          <div className={s.label}>방향</div>
          <div className={s.col}>
            <h2>각도는 섞이지 않는다. 배각 벡터는 섞인다.</h2>
            <p>
              붓 스트로크는 180° 대칭이다. 10°로 누운 붓과 190°로 누운 붓은 같은
              그림이다. 그래서 방향의 부호에는 의미가 없는데, 각도를 숫자로 그냥
              섞으면 이 사실이 무너진다. 10°와 170°는 0°를 사이에 두고 20°밖에 떨어져
              있지 않은데도, 두 수의 중간은 90° — 정확히 수직이다.
            </p>
            <p>
              해법은 각도를 두 배로 늘려 단위 벡터로 두는 것이다. 배각으로 보면 20°와
              340°가 되어 0° 쪽으로 붙고, 벡터를 섞은 뒤 절반으로 되돌리면 모호함 없이
              가까운 쪽으로 지나간다. 추출된 방향장이 애초에 이 형태로 저장되는
              이유이기도 하다 — 방향 하나가 int8 두 개, 배각 벡터의 코사인과 사인이다.
            </p>

            <figure className={`${s.fig} ${s.figFull}`}>
              <div className={s.figBox}>
                <svg
                  className={s.diagram}
                  viewBox="0 0 600 250"
                  role="img"
                  aria-label="10도에서 170도로 보간할 때, 각도를 직접 섞으면 도중에 수직으로 눕고 배각 벡터로 섞으면 거의 눕지 않는다"
                >
                  <text
                    x="30"
                    y="34"
                    fill="#8f95b4"
                    fontSize="12"
                    letterSpacing="2.4"
                  >
                    각도를 그대로 섞으면 — 도중에 뒤집힌다
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
                    배각(2θ) 벡터로 섞으면 — 가까운 쪽으로 지나간다
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
                양쪽 다 왼쪽 끝 10°에서 오른쪽 끝 170°로 간다 (흰 스트로크). 출발도
                도착도 같지만 지나가는 길이 다르다.
              </figcaption>
            </figure>
          </div>
        </section>

        {/* ── 두 벌의 렌더러 ── */}
        <section className={s.section}>
          <div className={s.label}>두 벌</div>
          <div className={s.col}>
            <h2>같은 붓을 캔버스와 서버가 나눠 쥔다</h2>
            <p>
              화면에서 도는 것은 캔버스 렌더러지만, 공유 카드 이미지와 하단 띠의
              썸네일은 서버에서 만들어진다. 서버에는 캔버스가 없으므로 같은 스트로크
              기하를 SVG 문자열로 굽는 판이 따로 있다. 썸네일은 셀만 4px로 줄여 그
              판을 그대로 쓴다 — 기하를 세 번째로 베끼지 않으려는 쪽이다.
            </p>
            <p>
              대신 두 판의 규칙은 손으로 맞춰 유지해야 한다. 한쪽의 스트로크 비율이나
              색 보정을 고치면 다른 쪽도 같이 고친다. 추출기도 사정이 같아서, 미리
              굽는 파이썬 판과 올린 이미지를 그 자리에서 처리하는 브라우저 판이 같은
              결과를 내야 하고 대조 스크립트가 그걸 확인한다.
            </p>
          </div>
        </section>

        {/* ── 숫자 ── */}
        <section className={s.section}>
          <div className={s.label}>숫자</div>
          <div className={s.col}>
            <h2>정해둔 값들</h2>
            <table className={s.numbers}>
              <thead>
                <tr>
                  <th>항목</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>색상 맵 최대 변</td>
                  <td>144 px</td>
                </tr>
                <tr>
                  <td>방향장 계산 해상도</td>
                  <td>432 px</td>
                </tr>
                <tr>
                  <td>구조 텐서 블러 σ (사전 / 성분 / 재블러)</td>
                  <td>1.2 · 5.0 · 4.0</td>
                </tr>
                <tr>
                  <td>방향 하나의 크기</td>
                  <td>int8 × 2 (±127)</td>
                </tr>
                <tr>
                  <td>작품 한 점</td>
                  <td>gzip 약 75 KB</td>
                </tr>
                <tr>
                  <td>셀 한 변</td>
                  <td>13 CSS px</td>
                </tr>
                <tr>
                  <td>프레임당 셀 (1080p)</td>
                  <td>약 12,000</td>
                </tr>
                <tr>
                  <td>스트로크 길이</td>
                  <td>1.70–2.30 × 셀</td>
                </tr>
                <tr>
                  <td>스트로크 폭</td>
                  <td>0.50–0.76 × 셀</td>
                </tr>
                <tr>
                  <td>자리 흔들림</td>
                  <td>±0.25 셀</td>
                </tr>
                <tr>
                  <td>릿지 (길이 / 두께)</td>
                  <td>84% · 30%</td>
                </tr>
                <tr>
                  <td>채도 · 밝기 보정</td>
                  <td>×1.28 · ×1.07</td>
                </tr>
                <tr>
                  <td>작품 전환</td>
                  <td>2.7 /s — 약 0.37 초</td>
                </tr>
                <tr>
                  <td>dt 상한</td>
                  <td>0.25 초</td>
                </tr>
                <tr>
                  <td>devicePixelRatio 상한</td>
                  <td>2</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <footer className={s.foot}>
          엔진 코드는 <code>lib/facture/</code>에, 원화에서 데이터를 뽑는 쪽은{" "}
          <code>lib/scenes/</code>에 있다. 갤러리에서는 자기 이미지를 올려 같은 붓결로
          다시 그려볼 수 있다 — 파일은 브라우저를 떠나지 않는다.
          <br />
          <Link href="/">갤러리로 돌아가기 ›</Link>
        </footer>
      </div>
    </div>
  );
}
