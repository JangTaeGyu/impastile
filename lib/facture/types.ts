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

/** 무거운 데이터를 뺀 Work — 이것만 있으면 목록과 썸네일 자리를 잡을 수 있다 */
export type WorkParts = Pick<Work, "scene" | "flow" | "aspect">;

/**
 * 아직 데이터를 받지 않은 작품.
 *
 * 회화 한 점의 색상 맵 + 방향장은 gzip 기준 약 75KB다. 12점을 모두 번들에
 * 넣으면 첫 화면에 900KB를 받고 시작하게 되므로, 글로 된 정보만 미리 들고
 * 무거운 쪽은 `load()`로 미룬다.
 */
export interface WorkEntry {
  title: string;
  sub: string;
  desc: string;
  cell: number;
  /**
   * 원본 가로/세로. 데이터가 오기 전에도 썸네일 상자를 제 크기로 잡으려고
   * 미리 적어둔다 — 나중에 채우면 띠가 덜컹거린다.
   * 실제 데이터와 어긋나면 개발 모드에서 경고한다 (`loadWork`).
   */
  aspect: number;
  uploaded?: boolean;
  load: () => Promise<WorkParts>;
}
