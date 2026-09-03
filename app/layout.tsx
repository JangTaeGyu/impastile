import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { DESCRIPTION, KEYWORDS, NAME, SITE_URL, TITLE } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// 서치 콘솔·네이버 웹마스터의 소유 확인 태그. 배포처마다 다른 값이라
// 코드에 박지 않고 빌드 환경에서 받는다 — 없으면 태그도 나가지 않는다.
// (정적으로 굳는 <head>라 빌드 시점에 있어야 한다.)
const verification: Metadata["verification"] = {};
if (process.env.GOOGLE_SITE_VERIFICATION) {
  verification.google = process.env.GOOGLE_SITE_VERIFICATION;
}
if (process.env.NAVER_SITE_VERIFICATION) {
  verification.other = {
    "naver-site-verification": process.env.NAVER_SITE_VERIFICATION,
  };
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
