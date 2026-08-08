# Impastile

빈센트 반 고흐의 회화를 **방향성 임파스토 붓터치**로 다시 그려내는 웹 갤러리.

원화를 단순히 픽셀로 흩뿌리는 모자이크가 아니다. 화면을 셀 격자로 나눈 뒤,
각 셀을 **원화가 실제로 그어진 붓결 방향으로 회전한 길쭉한 스트로크**로 칠한다.
소용돌이치는 밤하늘은 소용돌이 접선을 따라, 사이프러스는 수직 불꽃결을 따라,
밀밭은 바람에 눕는 방향을 따라 붓이 흐른다.

수록 작품 6점 — 별이 빛나는 밤에 · 해바라기 · 밤의 카페 테라스 · 아를의 침실 ·
자화상 · 밀밭의 사이프러스.

## 실행

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
```

배포처는 <https://impastile.jubrolab.dev>. OG 태그의 절대 URL 기준도 이 주소이며,
프리뷰·로컬에서 다른 주소를 쓰려면 `NEXT_PUBLIC_SITE_URL`로 덮는다.

공유 카드 문구(`lib/ogCopy.json`)를 고쳤다면 한글 폰트 서브셋을 다시 굽는다.

```bash
node scripts/fetch-og-font.mjs   # → assets/og/*.woff (커밋 대상)
```

## 작동 원리

### 1. 원화에서 데이터 추출 (빌드 전, 1회)

`scripts/extract-painting.py`가 원본 회화 이미지에서 두 가지를 뽑아 TS 모듈로 굽는다.

| 데이터 | 내용 |
| --- | --- |
| 색상 맵 | 종횡비를 유지한 최대 변 144px RGB (base64) |
| 붓결 방향장 | 구조 텐서에서 얻은 등고선 방향, 배각(2θ) 벡터 int8 x 2 |

방향을 **배각(2θ)으로 저장하는 이유**: 붓 스트로크는 180° 대칭이라 방향의 부호가
의미가 없다. 각도를 그대로 보간하면 0°와 179°가 90°로 섞이는 뒤집힘이 생기지만,
배각 벡터로 보간하면 그 모호성이 사라진다.

```bash
python3 -m venv .venv && .venv/bin/pip install pillow numpy
.venv/bin/python scripts/extract-painting.py \
  --src 원본.jpg --out lib/scenes/xxxData.ts [--crop 0.02,0.02,0.02,0.02]
```

### 2. 런타임 렌더링

매 프레임 `MosaicRenderer`가 셀마다:

1. `scene(nx, ny, t, ar)` → 색상 맵을 쌍선형 샘플링 (채도·밝기 보정, 붓결 방향 미세 표류)
2. `flow(nx, ny, t, ar)` → 방향장을 쌍선형 보간해 스트로크 각도
3. 그 각도로 회전한 길쭉한 사각형 + 밝은 릿지(물감이 솟은 가장자리)를 그린다

작품 전환 시에는 색과 방향을 함께 크로스페이드한다. 방향은 벡터로 섞어 각도 뜀이 없다.

시간은 프레임 수가 아니라 **경과 시간(dt) 기반**이다. 이래야 창이 가려져 rAF가
스로틀링되거나 120Hz 디스플레이에서도 애니메이션 속도가 일정하다.

## 구조

```
app/
  layout.tsx          메타데이터(OG/트위터 카드 포함), 폰트
  page.tsx            갤러리 페이지 (서버 컴포넌트 셸)
  opengraph-image.tsx 공유 카드 이미지 (빌드 시 1회 생성)
  icon.svg            파비콘
  globals.css         전역 스타일
assets/og/            카드용 한글 폰트 서브셋 (자동 생성)
components/
  Gallery.tsx         작품 전환 상태, 정보 패널, 네비게이션
  MosaicCanvas.tsx    캔버스 + rAF 루프 수명 관리
  Logo.tsx            브랜드 마크
lib/
  engine/
    types.ts          Scene, FlowFn, Work
    math.ts           lerp, clamp, smooth, hash
    renderer.ts       프레임 루프, 스트로크 렌더링, 크로스페이드
    mosaicSvg.ts      같은 규칙으로 한 프레임을 SVG로 굽기 (서버·OG용)
  scenes/
    painting.ts       원화 데이터 디코드 + 샘플링 씬/방향장 생성
    <작품>Data.ts     자동 생성 데이터 (색상 맵 + 방향장)
    <작품>.ts         3줄 래퍼
    index.ts          baseWorks 레지스트리, 작가·모델 정보
  ogCopy.json         OG 카드 문구 (폰트 서브셋의 입력이기도 하다)
scripts/
  extract-painting.py 원화 → 데이터 모듈 변환기
  fetch-og-font.mjs   OG 카드 문구 → 한글 폰트 서브셋
```

새 작품을 추가하는 자세한 절차는 [`lib/scenes/README.md`](lib/scenes/README.md) 참고.

## 조작

- `←` `→` 또는 화살표 버튼 — 작품 이동
- 하단 도트 — 작품 직접 선택
- 7초마다 자동 전환 (입력이 있으면 타이머 리셋)

## 기술 스택

Next.js (App Router) · TypeScript · Canvas 2D. 런타임 의존성은 React/Next 뿐이고,
회화 데이터는 번들에 인라인되어 외부 이미지 요청이 없다.

## 라이선스 / 출처

**원화** — 반 고흐(1853–1890)의 회화는 퍼블릭 도메인이고, 사용한 스캔도 모두
Wikimedia Commons의 퍼블릭 도메인 파일이다. 리포에 들어 있는 건 원본 이미지가
아니라 저해상도 색상 맵과 방향장이다. 작품별 출처 파일과 크롭 값은
[`lib/scenes/SOURCES.md`](lib/scenes/SOURCES.md)에 있다.

**폰트** — OG 카드용 `assets/og/*.woff`는 Noto Sans KR 서브셋으로,
리포 조건과 무관하게 [SIL Open Font License 1.1](assets/og/OFL.txt)을 따른다
(© 2014-2021 Adobe, Reserved Font Name 'Source'). UI 폰트 Inter도 OFL이며
`next/font`가 빌드 시 받아온다.
