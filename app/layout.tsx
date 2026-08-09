import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const TITLE = "Impastile — Van Gogh · Directional Impasto";
const DESCRIPTION =
  "빈센트 반 고흐의 회화를 원화가 실제로 그어진 붓결 방향을 따라 임파스토 붓터치 하나하나로 다시 그리는 웹 갤러리";

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
