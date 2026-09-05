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
import { findWork, locatedWorks } from "@/lib/works";
import { subLine } from "@/lib/site";

// 작품 낱장의 공유 카드. 루트의 것(app/opengraph-image.tsx)과 규칙은 같고
// 그리는 그림과 문구만 그 작품의 것이다 — '해바라기' 링크를 붙였는데 카드에
// '별이 빛나는 밤에'가 뜨면 안 된다.

export { contentType, size };

export function generateStaticParams() {
  return locatedWorks.map((w) => ({ slug: w.slug }));
}

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const w = findWork((await params).slug);
  return [
    {
      id: "card",
      size,
      contentType,
      alt: `Impastile — ${w?.artist.name}'s ${w?.entry.title} redrawn in directional impasto brushstrokes`,
    },
  ];
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const w = findWork((await params).slug)!;
  const { scene, flow, aspect } = await w.entry.load();

  // 갤러리는 원본 비율을 지켜 여백을 두지만 공유 카드는 꽉 차야 하므로 cover.
  // 어느 쪽이든 늘리지 않으므로 붓결 각도는 원본 그대로다. 셀은 캔버스(11px)보다
  // 크게 잡아야 축소된 카드에서도 붓결이 읽힌다.
  const frame = `data:image/svg+xml;base64,${Buffer.from(
    factureSvg({ scene, flow, aspect, fit: "cover", ...size, cell: 20 }),
  ).toString("base64")}`;

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
            {w.artist.name}
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
            {w.entry.title}
          </div>
          <div
            style={{
              marginTop: 22,
              maxWidth: 820,
              fontSize: 25,
              lineHeight: 1.6,
              color: "#e7e2cf",
              textShadow: SHADOW,
            }}
          >
            {/* satori는 자식이 둘 이상인 div에 display를 요구한다 —
                조각내지 말고 한 문자열로 넘긴다 */}
            {subLine(w.entry.title, w.entry.sub)}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
