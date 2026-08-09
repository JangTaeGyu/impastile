# 원화 출처

`<작품>Data.ts`는 아래 이미지에서 `scripts/extract-painting.py`로 뽑은
색상 맵(최대 변 144px)과 붓결 방향장이다. 원본 이미지 자체는 리포에 없다.

빈센트 반 고흐(1853–1890)의 회화는 전 세계 퍼블릭 도메인이고, 아래 스캔은
모두 Wikimedia Commons에서 **Public domain**으로 배포된다 (평면 회화의 충실한
복제에는 새 저작권이 발생하지 않는다는 PD-Art 원칙).

| 작품 | Commons 파일 | 크롭 (t,r,b,l) |
| --- | --- | --- |
| 별이 빛나는 밤에 | [Van Gogh - Starry Night - Google Art Project.jpg](https://commons.wikimedia.org/wiki/File:Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg) | 약 0.005, 0.01, 0.075, 0.01 |
| 해바라기 | [Vincent Willem van Gogh 127.jpg](https://commons.wikimedia.org/wiki/File:Vincent_Willem_van_Gogh_127.jpg) | 없음 |
| 밤의 카페 테라스 | [Vincent Willem van Gogh - Cafe Terrace at Night (Yorck).jpg](https://commons.wikimedia.org/wiki/File:Vincent_Willem_van_Gogh_-_Cafe_Terrace_at_Night_(Yorck).jpg) | 없음 |
| 아를의 침실 | [Vincent van Gogh - De slaapkamer - Google Art Project.jpg](https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_De_slaapkamer_-_Google_Art_Project.jpg) | 없음 |
| 자화상 | [Vincent van Gogh - Self-Portrait - Google Art Project (454045).jpg](https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project_(454045).jpg) | 없음 |
| 밀밭의 사이프러스 | [Vincent van Gogh - Wheat Field with Cypresses - Google Art Project.jpg](https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_Wheat_Field_with_Cypresses_-_Google_Art_Project.jpg) | 0.02, 0.02, 0.02, 0.02 |
| 론강의 별이 빛나는 밤 | [Starry Night Over the Rhone.jpg](https://commons.wikimedia.org/wiki/File:Starry_Night_Over_the_Rhone.jpg) | 없음 |
| 붓꽃 | [Irises-Vincent van Gogh.jpg](https://commons.wikimedia.org/wiki/File:Irises-Vincent_van_Gogh.jpg) | 없음 |
| 밤의 카페 | [Vincent Willem van Gogh 076.jpg](https://commons.wikimedia.org/wiki/File:Vincent_Willem_van_Gogh_076.jpg) | 없음 |
| 노란 집 | [Vincent van Gogh - The yellow house ('The street').jpg](https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_The_yellow_house_('The_street').jpg) | 없음 |
| 아몬드 꽃 | [Vincent van Gogh - Almond blossom - Google Art Project.jpg](https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_Almond_blossom_-_Google_Art_Project.jpg) | 없음 |
| 까마귀가 나는 밀밭 | [Vincent van Gogh - Wheatfield with crows - Google Art Project.jpg](https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_Wheatfield_with_crows_-_Google_Art_Project.jpg) | 없음 |

## 이 표는 어떻게 만들었나

추출 당시 출처를 기록해두지 않아, 커밋된 색상 맵을 후보 파일과 직접 대조해
역으로 확인했다. 후보를 같은 크기로 축소해 상관계수를 재고, 종횡비가 어긋나면
크롭 값을 역산했다.

- 해바라기 · 밤의 카페 테라스 · 아를의 침실 · 자화상 — 크롭 없이 **corr ≥ 0.9998**
  (평균 오차 1 미만). 사실상 동일 파일이다.
- 밀밭의 사이프러스 — 네 변 2% 크롭에서 **corr 0.9986**.
- 별이 빛나는 밤에 — 같은 Google Art Project 스캔에서 **corr 0.989**로 가장 높지만
  다른 작품만큼 딱 떨어지지는 않는다. 크롭 값은 근사치다. 또 Commons에는 이 스캔이
  `Van Gogh - Starry Night 2.jpg`로도 중복 업로드돼 있어 둘을 구분할 수 없다.
  어느 쪽이든 같은 퍼블릭 도메인 스캔이다.

**새 작품을 추가할 때는 이 표에 출처를 함께 적는다.** 나중에 역산하는 것보다
그때 한 줄 적는 편이 훨씬 싸다.

## 뒤에 추가한 6점은 이렇게 확인했다

출처를 그때 적었으므로 역산할 일은 없었다. 대신 **받은 파일이 정말 그 작품인지**
두 가지로 확인했다.

1. **종횡비 대조** — 받은 스캔의 가로/세로가 실제 작품 치수와 맞는지 봤다.
   액자나 배경이 함께 찍힌 파일은 여기서 어긋난다. 여섯 점 모두 오차 3% 안이었다.
2. **눈으로 확인** — 여섯 장을 한 판에 모아 실제로 그 그림인지 봤다. 이 단계에서
   '노란 집'인 줄 알고 받은 파일이 사실 '까마귀가 나는 밀밭'의 다른 스캔인 것을
   찾아내 버렸다. 파일명만 믿으면 안 된다.

액자 테두리는 가장자리에서 안쪽으로 색이 꺾이는 지점을 재서 찾았는데, 여섯 점
모두 테두리가 없어 크롭하지 않았다 (하늘이나 밀밭처럼 가장자리 색이 원래 다른
작품은 오탐이 나므로, 종횡비 쪽이 더 믿을 만한 근거다).
