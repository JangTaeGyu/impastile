# Impastile — 반 고흐 타일 모자이크 갤러리 (Next.js)

레퍼런스 `reference/concept-c-vangogh.html`의 스타일을 Next.js 앱으로 제품화한다.

## 컨셉 요약 (레퍼런스 분석)

- **모자이크 엔진**: 각 작품은 `scene(nx, ny, time, aspectRatio) -> [r, g, b]` 형태의 절차적 페인팅 함수. 매 프레임 화면을 셀 그리드로 나누고 셀 중심마다 scene 색을 샘플링해 타일로 그린다.
- **임파스토 질감**: 셀별 해시 기반 밝기 편차(붓값) + 밝은 셀 블룸 + 타일 위치 지터 → 두터운 붓터치 느낌.
- **인터랙션**: 마우스 주변 타일이 물결처럼 반응, 작품 전환 시 두 scene을 크로스페이드, 7초 자동 슬라이드.
- **UI 오버레이**: 브랜드 바, 작품 패널(제목·에센스·메타·좋아요·공유), compose 입력(문장 입력 → 새 작품 생성), 도트/화살표 네비게이션, 스크림·그레인 오버레이.

## 기술 스택

- Next.js (App Router) + TypeScript
- 렌더링: `<canvas>` 2D — 엔진 전체를 클라이언트 컴포넌트로 격리 (`"use client"`)
- 스타일: CSS Module 또는 전역 CSS (디자인이 완전 커스텀이라 Tailwind 불필요, 레퍼런스 CSS를 거의 그대로 이식)
- 배포: Vercel

## 디렉터리 구조 (목표)

```
impastile/
├─ app/
│  ├─ layout.tsx          # 폰트, 메타데이터
│  ├─ page.tsx            # 갤러리 페이지 (서버 컴포넌트 셸)
│  └─ globals.css
├─ components/
│  ├─ MosaicCanvas.tsx    # canvas + rAF 루프 (클라이언트)
│  ├─ GalleryOverlay.tsx  # 브랜드 바 / 패널 / compose / 네비게이션
│  └─ ...
├─ lib/
│  ├─ engine/
│  │  ├─ types.ts         # Scene, Work 타입 정의
│  │  ├─ math.ts          # lerp, clamp, smooth, hash
│  │  └─ renderer.ts      # 타일 루프, 임파스토, 크로스페이드, 마우스 반응
│  └─ scenes/
│     ├─ starryNight.ts
│     ├─ sunflowers.ts
│     └─ index.ts         # works 레지스트리
├─ tasks/                 # 이 계획 문서
└─ reference/             # 원본 컨셉 HTML (유지)
```

---

## Phase 1 — 프로젝트 셋업

- [x] `create-next-app` (TypeScript, App Router, ESLint, src 없이 루트 구조)
- [x] 전역 스타일 베이스: 배경 `#070a18`, Inter/모노 폰트 (`next/font`)
- [x] 레퍼런스 HTML이 `npm run dev`와 별개로 열어볼 수 있게 유지 확인

## Phase 2 — 모자이크 엔진 포팅

- [x] `lib/engine/math.ts`: `lerp`, `clamp`, `frac`, `smooth`, `hash` 이식
- [x] `lib/engine/types.ts`: `Scene = (nx, ny, t, ar) => [number, number, number]`, `Work { title, sub, essence, likes, seedHex, cell, scene }`
- [x] `lib/scenes/starryNight.ts`, `lib/scenes/sunflowers.ts`: 씬 함수 이식 (별·소용돌이·사이프러스 / 화병·해바라기 헤드 상수 포함)
- [x] `lib/engine/renderer.ts`: 프레임 루프 로직 — 셀 그리드 순회, 크로스페이드(mix), 임파스토 밝기/지터, 마우스 물결
- [ ] `components/MosaicCanvas.tsx`:
  - [x] `useRef` + `useEffect`로 rAF 루프 시작/정리 (unmount 시 `cancelAnimationFrame`)
  - [x] 리사이즈 핸들링, `devicePixelRatio` 대응 (레퍼런스는 미대응 — 개선 포인트)
  - [x] 마우스 이벤트 → 엔진 상태 전달
- [x] 렌더 결과가 레퍼런스와 시각적으로 동일한지 비교 확인

## Phase 3 — UI 오버레이 컴포넌트화

- [x] `GalleryOverlay`: 브랜드 바, 라이브 인디케이터
- [x] 작품 패널: 제목/에센스/메타, 전환 시 fade out→in (레퍼런스의 420ms 타이밍 재현)
- [x] 좋아요 버튼(카운트 증가), SHARE 버튼(우선 Web Share API 또는 클립보드 복사)
- [x] 도트 + 화살표 네비게이션, 7초 자동 슬라이드(사용자 입력 시 타이머 리셋)
- [x] ~~compose 입력~~ — 구현했다가 사용자 요청으로 제거 (2026-08-08)
- [x] 스크림/그레인 오버레이, crosshair 커서 등 무드 요소 이식
- [x] React 상태 설계: `currentIndex`, `works` 목록은 React state / 매 프레임 변하는 값(t, mix, mouse)은 ref로 유지 (리렌더 최소화)

## Phase 4 — 작품 확장

- [x] 씬 추가: 밤의 카페 테라스(1888), 아를의 침실(1888), 자화상(1889), 밀밭의 사이프러스(1889)
- [x] 씬 제작 가이드 문서화 → `lib/scenes/README.md`
- [x] 씬별 셀 크기 튜닝 (자화상 12 · 침실 13 · 카페 14 · 풍경 15)

## Phase 5 — ~~compose 고도화 & 지속성~~ (취소)

compose 입력 자체가 제거되어 이 단계는 취소 (2026-08-08).

## Phase 6 — 품질 & 성능

- [x] 모바일/반응형(1차): 터치 인터랙션, 720px 이하 UI 축소 — 세부 튜닝 남음
- [x] 성능(1차): DPR 상한 2, 탭 비활성 시 루프 정지(`visibilitychange`) — OffscreenCanvas/Worker 검토 남음
- [ ] `prefers-reduced-motion` 대응 (애니메이션 강도 축소)
- [x] 접근성: 버튼 라벨, 키보드 네비게이션(←/→)

## Phase 7 — 마무리 & 배포

- [ ] 메타데이터/OG 이미지, 파비콘
- [ ] Lighthouse 점검
- [ ] Vercel 배포

---

## 렌더러 v2 — 방향성 붓터치 (2026-08-08)

- 정사각 타일 → 흐름장(flow field)을 따라 회전된 길쭉한 스트로크 + 밝은 릿지로 전면 개편.
- `Work.flow?: FlowFn` — 씬별 붓결 방향장. 별이 빛나는 밤에는 소용돌이 접선·물결 밴드·
  능선 등고선·사이프러스 수직결을 색과 같은 장으로 공유(`flowStarry`). 없으면 완만한 기본 흐름.
- 별이 빛나는 밤에 씬을 원화 구도로 재작성: 소용돌이 2개+물결 밴드 3켜 채색, 주황 초승달과
  맥동 광륜, 동심원 링 별 광륜, 우측으로 솟는 능선, 마을 창·교회 첨탑, 혀 갈라진 사이프러스.
- 마우스 물결 이펙트는 사용자 요청으로 제거.
- 어두운 셀은 릿지 생략으로 드로우 콜 절감. 추가 최적화 여지: OffscreenCanvas/Worker (Phase 6).
- 다른 씬들의 전용 flow 제작은 남은 작업 (현재 기본 흐름 사용).

## 리스크 / 참고

- 씬 함수는 매 프레임 셀 수만큼 호출됨(약 1만 회/프레임) — 씬을 추가할수록 함수 내부 연산을 가볍게 유지해야 함.
- `devicePixelRatio` 대응 시 셀 수가 늘어나므로 성능과 트레이드오프 — 셀 크기를 CSS 픽셀 기준으로 유지하는 방식 권장.
- 레퍼런스의 전역 `setInterval`/이벤트 리스너는 React 라이프사이클에 맞게 반드시 정리(cleanup)해야 함.
- 렌더러 시간은 프레임 수가 아니라 경과 시간(dt) 기반으로 처리 — 레퍼런스처럼 `t += 16`으로 하면
  rAF 스로틀링(가려진 창) 시 전환이 수십 초로 늘어지고 120Hz에서는 2배속이 된다 (2026-08-08 수정).
