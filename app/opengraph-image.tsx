import { ImageResponse } from "next/og";
import { factureSvg } from "@/lib/facture/factureSvg";
import {
  SCRIM,
  SHADOW,
  contentType,
  fonts,
  markSrc,
  size,
} from "@/lib/ogCard";
import copy from "@/lib/ogCopy.json";
import { baseWorks, exhibits } from "@/lib/scenes";

export const alt =
  "Impastile — Van Gogh's The Starry Night redrawn in directional impasto brushstrokes";
export { contentType, size };

// 앱과 같은 렌더링 규칙으로 '별이 빛나는 밤에'를 한 장 굽는다.
// 캔버스 셀(11px)보다 크게 잡아야 축소된 공유 카드에서도 붓결이 읽힌다.
// 갤러리는 원본 비율을 지켜 여백을 두지만 공유 카드는 꽉 차야 하므로 cover —
// 어느 쪽이든 늘리지 않으므로 붓결 각도는 원본 그대로다.
// 작품 데이터는 지연 로드라 여기서도 받아 쓴다 (서버에서 한 번 굽고 끝난다)
const [starryEntry] = baseWorks;
const starry = await starryEntry.load();
const frame = `data:image/svg+xml;base64,${Buffer.from(
  factureSvg({
    scene: starry.scene,
    flow: starry.flow,
    aspect: starry.aspect,
    fit: "cover",
    ...size,
    cell: 20,
  }),
).toString("base64")}`;

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ ...size, display: "flex", position: "relative" }}>
        <img src={frame} alt="" width={size.width} height={size.height} />
        <div
          style={{
            position: "absolute",
            ...size,
            background: SCRIM,
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
            {/* 반 고흐만이 아니라 전 전시관을 센다 — 작가가 늘면 여기도 따라 는다 */}
            {copy.desc.replace(
              "{count}",
              String(exhibits.reduce((n, e) => n + e.works.length, 0)),
            )}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
