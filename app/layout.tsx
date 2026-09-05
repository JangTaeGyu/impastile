import type { Metadata } from "next";
import { Inter } from "next/font/google";
import {
  DESCRIPTION,
  GOOGLE_VERIFICATION,
  KEYWORDS,
  NAME,
  NAVER_VERIFICATION,
  SITE_URL,
  TITLE,
} from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// 서치 콘솔·네이버 웹마스터의 소유 확인 태그. 값은 lib/site.ts가 쥔다 —
// 없는 것은 태그도 내보내지 않는다 (빈 content로 나가면 확인이 실패한다).
const verification: Metadata["verification"] = {};
if (GOOGLE_VERIFICATION) verification.google = GOOGLE_VERIFICATION;
if (NAVER_VERIFICATION) {
  verification.other = { "naver-site-verification": NAVER_VERIFICATION };
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: NAME,
  keywords: KEYWORDS,
  category: "art",
  // 하위 문서는 각자 덮어쓴다. 이 한 줄이 없으면 ?utm=... 같은 꼬리표가
  // 붙은 주소가 저마다 다른 문서로 색인된다.
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // 검색 결과에 큰 이미지와 긴 발췌를 허용한다 — 그림이 주인 사이트다
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification,
  openGraph: {
    type: "website",
    siteName: NAME,
    locale: "en_US",
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
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
