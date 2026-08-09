import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { mosaicSvg } from "@/lib/engine/mosaicSvg";
import copy from "@/lib/ogCopy.json";
import { baseWorks } from "@/lib/scenes";

export const alt =
  "Impastile — 반 고흐 '별이 빛나는 밤에'를 방향성 임파스토 붓터치로 재현한 타일 모자이크";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 앱과 같은 렌더링 규칙으로 '별이 빛나는 밤에'를 한 장 굽는다.
// 캔버스 셀(13px)보다 크게 잡아야 축소된 공유 카드에서도 붓결이 읽힌다.
// 갤러리는 원본 비율을 지켜 여백을 두지만 공유 카드는 꽉 차야 하므로 cover —
// 어느 쪽이든 늘리지 않으므로 붓결 각도는 원본 그대로다.
const [starry] = baseWorks;
const mosaic = `data:image/svg+xml;base64,${Buffer.from(
  mosaicSvg({
    scene: starry.scene,
    flow: starry.flow,
    aspect: starry.aspect,
    fit: "cover",
    ...size,
    cell: 20,
  }),
).toString("base64")}`;

const markSrc = `data:image/svg+xml;base64,${(
  await readFile(join(process.cwd(), "app/icon.svg"))
).toString("base64")}`;

// next/og 기본 폰트에는 한글이 없다. scripts/fetch-og-font.mjs가 구워둔
// 서브셋(카드 문구에 쓰인 글자만)을 얹는다.
const font = (weight: 400 | 700) =>
  readFile(join(process.cwd(), `assets/og/noto-sans-kr-${weight}.woff`)).then(
    (data) => ({ name: "Noto Sans KR", data, weight, style: "normal" as const }),
  );
const fonts = await Promise.all([font(400), font(700)]);

const SHADOW = "0 2px 24px rgba(0,0,0,.85)";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ ...size, display: "flex", position: "relative" }}>
        <img src={mosaic} alt="" width={size.width} height={size.height} />
        {/* UI가 놓인 모서리만 눌러 글자가 읽히게 한다 — 중앙 그림은 건드리지 않는다 */}
        <div
          style={{
            position: "absolute",
            ...size,
            background:
              "radial-gradient(ellipse 620px 300px at 0% 0%, rgba(7,10,24,.82), transparent 70%), radial-gradient(ellipse 1080px 640px at 100% 100%, rgba(5,7,18,.93), rgba(5,7,18,.66) 52%, transparent 80%), linear-gradient(0deg, rgba(5,7,18,.72), rgba(5,7,18,.3) 34%, transparent 62%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 52,
            left: 64,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <img src={markSrc} alt="" width={44} height={44} />
          <div
            style={{
              display: "flex",
              fontSize: 21,
              fontWeight: 700,
              letterSpacing: "0.3em",
              color: "#f6f3e8",
              textShadow: SHADOW,
            }}
          >
            <span>{copy.wordmark[0]}</span>
            <span style={{ color: "#f2c14e" }}>{copy.wordmark[1]}</span>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 64,
            bottom: 56,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            textAlign: "right",
          }}
        >
          <div
            style={{
              fontSize: 20,
              letterSpacing: "0.22em",
              color: "#f2c14e",
              textShadow: SHADOW,
            }}
          >
            {copy.kicker}
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 68,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#f6f3e8",
              textShadow: SHADOW,
            }}
          >
            {copy.title}
          </div>
          <div
            style={{
              marginTop: 22,
              maxWidth: 760,
              fontSize: 25,
              lineHeight: 1.6,
              color: "#e7e2cf",
              textShadow: SHADOW,
            }}
          >
            {copy.desc.replace("{count}", String(baseWorks.length))}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
