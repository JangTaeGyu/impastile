import type { Metadata } from "next";
import AboutDoc from "@/components/AboutDoc";
import { aboutJsonLd, jsonLdScript } from "@/lib/jsonLd";

const TITLE = "Facture — the Impastile painting engine";
const DESCRIPTION =
  "How Impastile redraws a painting: the three rules that make up its look, and the structure of Facture, the engine that pulls brush direction out of the original and puts it on screen.";

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
