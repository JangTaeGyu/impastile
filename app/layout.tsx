import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const TITLE = "Impastile — Van Gogh · Tile Mosaic";
const DESCRIPTION =
  "빈센트 반 고흐의 에센스를 임파스토 타일 모자이크로 짜내는 텍스트 갤러리";

// og:image 등 절대 URL의 기준. 배포처를 NEXT_PUBLIC_SITE_URL로 주면 되고,
// Vercel에서는 프로덕션 도메인이 자동으로 잡힌다.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

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
