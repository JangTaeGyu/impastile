import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { exhibits } from "@/lib/scenes";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// 작품 수는 세지 않고 전시관에서 받는다 — 작가가 늘면 카피도 따라 는다.
// (공유 카드 문구가 {count}를 다루는 방식과 같다. 카드 쪽은 lib/ogCopy.json이다.)
const COUNT = exhibits.reduce((n, e) => n + e.works.length, 0);

// 제목에 작가를 박지 않는다. 한 사람을 가리키면 나머지 전시관이 지워지고,
// 이름을 다 적으면 작가가 늘 때마다 여기도 고쳐야 한다. 대신 무엇을 하는
// 갤러리인지를 적고, 작가는 설명과 공유 카드의 kicker가 맡는다.
const TITLE = "Impastile — Directional Impasto";
const DESCRIPTION =
  `반 고흐 · 모네 · 뭉크 · 세잔의 회화 ${COUNT}점을 원화가 실제로 그어진 ` +
  "붓결 방향을 따라 임파스토 붓터치 하나하나로 다시 그리는 웹 갤러리";

// og:image 등 절대 URL의 기준. 배포 도메인이 기본값이고,
// 프리뷰·로컬에서 다른 주소를 쓰려면 NEXT_PUBLIC_SITE_URL로 덮는다.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://impastile.jubrolab.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Impastile",
  openGraph: {
    type: "website",
    siteName: "Impastile",
    locale: "ko_KR",
    url: "/",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
