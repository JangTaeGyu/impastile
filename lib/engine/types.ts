export type RGB = [number, number, number];

/**
 * 절차적 페인팅 함수. 그림이 놓인 영역을 0..1 정규 좌표로 보고
 * (nx, ny) 지점의 색을 돌려준다. t는 초 단위 시간,
 * ar은 **그 영역의** 가로/세로 비율 (화면이 아니다 — 비율을 지켜 앉히면
 * 그림 영역과 화면의 비율이 다르다).
 * 매 프레임 셀 수만큼 호출되므로 내부 연산은 가볍게 유지할 것.
 */
export type Scene = (nx: number, ny: number, t: number, ar: number) => RGB;

/**
 * 붓터치 방향장. (nx, ny) 지점에서 붓이 흐르는 각도(라디안)를 돌려준다.
 * 스트로크는 180° 대칭이므로 방향의 부호는 무시된다.
 */
export type FlowFn = (nx: number, ny: number, t: number, ar: number) => number;

export interface Work {
  title: string;
  /** 원제 · 연도 · 소장처 */
  sub: string;
  /** 작품 한 줄 설명 */
  desc: string;
  /** 타일 한 변의 CSS 픽셀 크기 */
  cell: number;
  scene: Scene;
  /** 붓터치 방향장 — 없으면 완만한 기본 흐름을 쓴다 */
  flow?: FlowFn;
  /** 원본 가로/세로 — 있으면 이 비율을 지켜 화면에 앉힌다 (없으면 화면을 채운다) */
  aspect?: number;
  /** 사용자가 올린 이미지 — 붙일 작품 정보가 없어 패널이 파일명만 보여준다 */
  uploaded?: boolean;
}
