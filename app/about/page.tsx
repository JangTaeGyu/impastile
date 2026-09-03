import type { Metadata } from "next";
import AboutDoc from "@/components/AboutDoc";
import { aboutJsonLd, jsonLdScript } from "@/lib/jsonLd";

const TITLE = "Facture — Impastile 그림 엔진";
const DESCRIPTION =
  "Impastile이 반 고흐를 다시 그리는 방식. 그림 스타일을 이루는 세 가지 규칙과, 원화에서 붓결을 뽑아 화면에 올리는 Facture 엔진의 구조.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // 루트 레이아웃의 canonical('/')을 반드시 덮는다 — 안 그러면 이 문서가
  // 갤러리와 같은 주소를 가리켜 색인에서 통째로 지워진다.
  alternates: { canonical: "/about" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/about" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function About() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(aboutJsonLd(TITLE, DESCRIPTION)),
        }}
      />
      <AboutDoc />
    </>
  );
}
