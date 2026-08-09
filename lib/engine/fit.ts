/** 화면 정규 좌표(0..1)에서 그림이 놓이는 영역 */
export interface FitRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type FitMode = "contain" | "cover";

/**
 * 원본 비율을 지킨 채 화면에 앉힌다.
 *
 * 늘려서 채우면 두 가지가 어긋난다. 그림이 찌그러지는 것이야 눈에 바로 보이고,
 * 덜 보이지만 더 나쁜 쪽은 붓결이다. 방향장의 각도는 원본 비율에서 잰 값인데
 * 화면이 가로로 k배 늘어나 있으면 원본의 θ가 화면에서는 atan2(sinθ, k·cosθ)로
 * 눕는다. 비율을 지키면 가로세로가 같은 배율로 커지므로 각도가 그대로 보존된다.
 *
 * @param aspect 원본 가로/세로. 없으면 화면을 그대로 채운다(늘림).
 * @param ar     화면 가로/세로
 * @param mode   contain은 전부 보이고 여백이 남는다. cover는 꽉 차고 잘린다.
 */
export function fitRect(
  aspect: number | undefined,
  ar: number,
  mode: FitMode = "contain",
): FitRect {
  if (!aspect || !Number.isFinite(aspect) || !Number.isFinite(ar) || ar <= 0) {
    return { x: 0, y: 0, w: 1, h: 1 };
  }
  // 가로가 남는 쪽을 세로에 맞출지 그 반대일지만 다르다
  const wide = mode === "contain" ? aspect >= ar : aspect < ar;
  if (wide) {
    const h = ar / aspect;
    return { x: 0, y: (1 - h) / 2, w: 1, h };
  }
  const w = aspect / ar;
  return { x: (1 - w) / 2, y: 0, w, h: 1 };
}
