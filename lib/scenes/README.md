# 씬 파이프라인 — 원본 회화 샘플링

모든 씬은 원본 회화 이미지에서 추출한 데이터를 샘플링한다.
절차적 씬 제작 방식은 렌더러 v2(방향성 붓터치) 도입과 함께 폐기되었다.

## 구조

- `painting.ts` — 공용 모듈. base64 데이터를 디코드(`decodePainting`)하고,
  쌍선형 샘플링 씬(`paintingScene`)과 붓결 방향장(`paintingFlow`)을 만든다.
- `<name>Data.ts` — `scripts/extract-painting.py`가 생성한 자동 생성 파일.
  색상 맵(최대 변 144px RGB)과 붓결 방향장(배각 2θ 벡터, int8 x 2)을 담는다.
- `<name>.ts` — 3줄짜리 래퍼. `paintingWork(data)`가 돌려주는
  `{ scene, flow, aspect }`를 그대로 export한다.
- `index.ts` — `baseWorks` 레지스트리 (제목·셀 크기·scene·flow).
- `extract.ts` — 추출기의 브라우저 판. 임의의 이미지에서 `PaintingData`를
  런타임에 만든다 (아래 참고).
- `fromFile.ts` — 사용자가 올린 `File`을 `Work` 하나로 만든다. 추출 → `autoTone`
  → 씬 생성까지 묶은 3줄짜리 진입점. 업로드 UI는 `components/Gallery.tsx`.

## 새 작품 추가

1. 원본 이미지를 구한다 (Wikimedia Commons 퍼블릭 도메인 권장):
   `curl -sL "https://commons.wikimedia.org/wiki/Special:FilePath/<파일명>?width=1000" -o img.jpg`
2. 데이터 생성 (pillow·numpy 필요):
   `python scripts/extract-painting.py --src img.jpg --out lib/scenes/xxxData.ts [--crop t,r,b,l]`
   액자 테두리·워터마크는 `--crop`으로 잘라낸다.
3. `xxx.ts` 래퍼를 만들고(`export const xxx = paintingWork(data)`)
   `index.ts`의 `baseWorks`에 `...xxx`로 펼쳐 넣는다.
4. **`SOURCES.md`에 출처(Commons 파일명)와 크롭 값을 적는다.** 이걸 빠뜨리면
   나중에 색상 맵을 후보 파일과 대조해 역산해야 한다.

## 추출기가 둘인 이유

같은 파이프라인의 구현이 두 벌 있다.

| | `scripts/extract-painting.py` | `lib/scenes/extract.ts` |
| --- | --- | --- |
| 언제 | 빌드 전, 손으로 한 번 | 런타임, 브라우저에서 |
| 입력 | 원화 파일 | 임의의 이미지 |
| 출력 | `<name>Data.ts` (base64) | 메모리의 `PaintingData` |

전시용 6점은 파이썬 판으로 구운 데이터를 번들에 넣는다 — 매번 뽑을 이유가 없다.
사용자가 가져온 이미지는 TS 판이 그 자리에서 처리한다 (서버로 나가지 않는다).

**한쪽을 고치면 다른 쪽도 고친다.** 어긋나지 않았는지는 대조해서 확인한다:

```bash
python scripts/extract-painting.py --src img.jpg --out /tmp/x.ts --dump /tmp/d
node scripts/verify-extract.mjs /tmp/d
```

같은 휘도 버퍼를 양쪽에 먹여 방향장을 바이트 단위로 비교한다. 색상 맵은
비교하지 않는다 — 파이썬은 LANCZOS, 브라우저는 캔버스 리샘플러라 애초에 다르다.
이식 위험이 있는 곳은 구조 텐서 쪽이다.

리사이즈는 한 단계에 최대 절반씩만 줄인다. 3배를 한 번에 줄이면 캔버스 필터가
원본을 듬성듬성 집어 계단현상이 남고, 그래디언트를 먹고 사는 방향장이 그걸
가짜 결로 바꿔놓는다 (실측: 별이 빛나는 밤에서 파이썬과의 방향 일치도가
0.977 → 0.993).

## 임의 이미지의 톤

`paintingScene`의 기본값 `sat 1.28 / gain 1.07`은 반 고흐 6점에 맞춰 고른 값이라
아무 이미지에나 쓸 수 없다. `autoTone(data)`가 이미지에 맞는 값을 골라준다.

```ts
const data = await extractPainting(file);
const { sat, gain } = autoTone(data);
const scene = paintingScene(data, sat, gain);
const flow = paintingFlow(data);
```

**사진이 회화보다 채도가 높을 거라는 짐작은 틀렸다.** 실측하면 반대다 — 회화는
0.33~0.63의 좁은 대역에 모여 있지만 사진은 흩어진다.

| | 원본 평균 채도 |
| --- | --- |
| 회화 6점 | 0.33 (별밤) ~ 0.63 (해바라기) |
| 사진 (고양이·건축·도쿄) | 0.20 ~ 0.29 — 회화보다 **낮다** |
| 사진 (노을) | 0.84 — 부스트를 얹으면 0.95, 포스터처럼 뭉갠다 |

그래서 값을 새로 고정하지 않고 6점이 실제로 차지하는 대역 안으로만 끌어온다.
대역 안이면 손대지 않으므로 **6점에는 `autoTone`이 아무 영향이 없다** (검증됨).

보정식이 루마(`0.3r+0.6g+0.1b`)를 정확히 보존하는 덕에 채도와 밝기는 독립이다 —
채도는 `sat`이 이분탐색으로, 밝기는 `gain`이 비례식으로 결정된다.

## 비율

작품마다 종횡비가 다르다 — 전시 6점만 해도 0.79(카페 테라스·자화상·해바라기)에서
1.35(별밤)까지 걸쳐 있다. 화면에 늘려 채우면 두 가지가 어긋난다.

- 그림이 찌그러진다. 16:9에서 세로 작품은 가로로 2.25배 늘어난다.
- **붓결이 눕는다.** 방향장의 각도는 원본 비율에서 잰 값인데, 화면이 가로로
  k배 늘어나 있으면 원본의 θ가 화면에서 `atan2(sinθ, k·cosθ)`가 된다.
  원본의 45°가 24°로 눕는다 — 이 프로젝트가 지키려는 바로 그 값이 틀어진다.

그래서 `Work.aspect`(원본 가로/세로)를 들고 다니며 `lib/engine/fit.ts`가
비율을 지켜 앉힌다. 가로세로가 같은 배율로 커지므로 각도가 그대로 보존된다.
갤러리는 `contain`(전부 보이고 여백이 남는다), 공유 카드는 `cover`(꽉 차고
잘린다)를 쓴다.

`aspect`를 빠뜨리면 조용히 늘어난다. `paintingWork()`가 셋을 한 번에 만드는 게
그래서다 — scene·flow만 따로 넘기면 이 값이 새기 쉽다.

**씬에 넘어가는 `ar`은 화면이 아니라 그림 영역의 비율이다.** 비율을 지켜
앉히면 둘이 다르다.

## 원리

- **색**: 씬이 매 셀 색상 맵을 쌍선형 보간으로 샘플링. 채도 +28%·밝기 +7% 보정,
  붓결 방향으로 미세 표류를 줘 물감이 흐르는 미동을 만든다.
- **붓결**: 원화의 구조 텐서(그래디언트의 가우시안 스무딩)에서 등고선 방향을 추출 —
  렌더러의 스트로크가 반 고흐가 실제로 그은 결을 따라 흐른다.
  방향은 배각(2θ) 벡터로 저장해 보간 시 ±180° 뒤집힘이 없다.
