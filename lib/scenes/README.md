# 씬 파이프라인 — 원본 회화 샘플링

모든 씬은 원본 회화 이미지에서 추출한 데이터를 샘플링한다.
절차적 씬 제작 방식은 렌더러 v2(방향성 붓터치) 도입과 함께 폐기되었다.

## 구조

- `painting.ts` — 공용 모듈. base64 데이터를 디코드(`decodePainting`)하고,
  쌍선형 샘플링 씬(`paintingScene`)과 붓결 방향장(`paintingFlow`)을 만든다.
- `<name>Data.ts` — `scripts/extract-painting.py`가 생성한 자동 생성 파일.
  색상 맵(최대 변 144px RGB)과 붓결 방향장(배각 2θ 벡터, int8 x 2)을 담는다.
- `<name>.ts` — 3줄짜리 래퍼. `paintingScene(data)` / `paintingFlow(data)` export.
- `index.ts` — `baseWorks` 레지스트리 (제목·셀 크기·scene·flow).

## 새 작품 추가

1. 원본 이미지를 구한다 (Wikimedia Commons 퍼블릭 도메인 권장):
   `curl -sL "https://commons.wikimedia.org/wiki/Special:FilePath/<파일명>?width=1000" -o img.jpg`
2. 데이터 생성 (pillow·numpy 필요):
   `python scripts/extract-painting.py --src img.jpg --out lib/scenes/xxxData.ts [--crop t,r,b,l]`
   액자 테두리·워터마크는 `--crop`으로 잘라낸다.
3. `xxx.ts` 래퍼를 만들고 `index.ts`의 `baseWorks`에 등록한다.

## 원리

- **색**: 씬이 매 셀 색상 맵을 쌍선형 보간으로 샘플링. 채도 +28%·밝기 +7% 보정,
  붓결 방향으로 미세 표류를 줘 물감이 흐르는 미동을 만든다.
- **붓결**: 원화의 구조 텐서(그래디언트의 가우시안 스무딩)에서 등고선 방향을 추출 —
  렌더러의 스트로크가 반 고흐가 실제로 그은 결을 따라 흐른다.
  방향은 배각(2θ) 벡터로 저장해 보간 시 ±180° 뒤집힘이 없다.
