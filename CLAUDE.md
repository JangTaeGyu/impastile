@AGENTS.md

# Impastile

반 고흐 회화를 방향성 임파스토 붓터치로 재현하는 Next.js 갤러리.
전체 개요는 `README.md`, 씬 추가 절차는 `lib/scenes/README.md`를 본다.

## 명령

```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드 (타입 체크 포함)
npm run lint     # ESLint
```

## 핵심 개념

**붓터치 엔진의 이름은 Facture다** (`lib/facture/`). 미술사에서 facture는 물감이
놓인 방식, 곧 붓이 남긴 자국 자체를 가리킨다. 이 엔진이 재현하려는 것이 그것이라
모자이크가 아니라 이 이름을 쓴다 — `FactureRenderer`(캔버스), `factureSvg()`(서버).

**모든 씬은 원본 회화에서 추출한 데이터를 샘플링한다.** 절차적으로 그림을 그리던
초기 방식은 폐기됐다. 씬 파일(`lib/scenes/<작품>.ts`)은 3줄짜리 래퍼이고,
실제 로직은 `lib/scenes/painting.ts` 하나에 모여 있다.

두 종류의 장(場)이 씬을 이룬다.

- `Scene` — 지점의 **색** (색상 맵 쌍선형 샘플링)
- `FlowFn` — 지점의 **붓결 방향** (원화 구조 텐서에서 추출한 방향장)

Facture는 셀마다 색을 뽑고 그 방향으로 회전한 스트로크를 그린다.

## 작업 시 주의

- **`<작품>Data.ts`는 자동 생성 파일이다.** 직접 편집하지 말고
  `scripts/extract-painting.py`를 다시 돌린다 (pillow·numpy 필요, venv 권장).
- **`<작품>Data.ts`를 정적으로 import하지 않는다.** 한 점당 gzip 75KB라 전부
  번들에 넣으면 첫 화면이 900KB를 기다린다. `index.ts`의 `load()` 동적 import로만
  들어와야 하고, 한 군데라도 정적으로 부르면 그 순간 전부 딸려 들어간다.
  `aspect`는 손으로 적은 값이라 데이터를 다시 뽑으면 같이 고친다 (안 고치면
  `loadWork`가 개발 모드에서 경고한다).
- **추출기는 두 벌이다.** 위 파이썬 스크립트와 `lib/scenes/extract.ts`(브라우저
  런타임 판)는 같은 결과를 내야 한다. 한쪽을 고치면 다른 쪽도 고치고,
  `scripts/verify-extract.mjs`로 대조한다. 자세한 건 `lib/scenes/README.md`.
- **`assets/og/*.woff`도 자동 생성이다.** OG 카드 문구는 `lib/ogCopy.json`에만 두고,
  고친 뒤 `node scripts/fetch-og-font.mjs`로 서브셋을 다시 굽는다. 이걸 빠뜨리면
  새 글자가 카드에서 두부(□)로 나온다. next/og 기본 폰트에는 한글이 없다.
- **시간은 dt 기반으로 다룬다.** `t += 16` 같은 프레임 수 누적은 rAF 스로틀링과
  120Hz에서 속도가 달라진다. `renderer.ts`의 `frame(now)`이 기준.
- **방향 보간은 배각(2θ) 벡터로 한다.** 각도를 직접 lerp하면 스트로크가 뒤집힌다.
- **`Work.aspect`를 빠뜨리면 조용히 늘어난다.** 늘어나면 그림만 찌그러지는 게
  아니라 붓결 각도까지 눕는다. `paintingWork()`로 scene·flow·aspect를 한 번에
  만든다. 씬에 넘어가는 `ar`은 화면이 아니라 **그림 영역**의 비율이다.
- **씬 함수는 셀 수만큼 호출된다** (1080p 기준 약 1만 회/프레임). 내부에서
  배열·객체를 새로 만들지 않는다.
- **매 프레임 변하는 값은 ref로 둔다.** React state는 작품 전환에만 쓴다.
- **UI 텍스트는 의도적으로 절제되어 있다.** 로고, 작품 정보 패널, 하단 전시관 띠가
  전부다. 새 요소를 추가하기 전에 사용자에게 확인한다. `/about`(Facture 소개)으로
  가는 길도 새 버튼이 아니라 로고에 붙였다.
- **`/about`의 스타일은 CSS 모듈이다** (`components/about.module.css`). 전역 CSS를
  루트 레이아웃 밖에서 import하면 라우트를 옮겨도 안 걷히는 문제가 있어서 그렇다.
  갤러리용 전역 규칙(`body{overflow:hidden}`, `cursor:crosshair`, `h1`)을 문서 쪽에서
  되돌려야 하니, 새 요소를 넣을 때 전역과 겹치는지 본다.
- **렌더러는 창이 아니라 캔버스 요소 크기를 본다.** `clientWidth/Height`가 기준이라
  갤러리처럼 화면을 덮든 문서 안에 끼든 같은 코드로 돈다. `FactureCanvas`가
  ResizeObserver로 상자를, IntersectionObserver로 화면 밖 여부를 지켜본다 —
  스크롤로 밀려난 캔버스는 rAF를 멈춘다.
- **작가를 추가하려면 `lib/scenes/index.ts`의 `exhibits`에 전시관을 하나 밀어 넣는다.**
  탭은 거기서 자동으로 생긴다. 사용자가 올린 이미지가 담기는 '나의 전시관'은
  런타임에 만들어져 항상 마지막에 붙는다.
- 밝은 작품에서도 글자가 읽히도록 `.scrim`이 UI가 놓인 모서리만 눌러준다.
  중앙(그림)은 건드리지 않는다.

## 개발 환경 함정

- 이 머신에서는 다른 프로젝트의 dev 서버가 3000 포트를 선점하거나,
  이전에 등록된 **서비스 워커가 localhost를 가로채** 엉뚱한 앱이 뜰 수 있다.
  화면이 이상하면 먼저 `curl -s localhost:3000 | grep '<title>'`로 확인한다.
- 컴포넌트를 고치면 Fast Refresh로 캔버스만 재생성되어 캔버스와 제목이
  잠시 어긋나 보일 수 있다. 판단 전에 새로고침해서 확인한다.
