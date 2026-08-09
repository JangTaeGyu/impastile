import type { Metadata } from "next";
import AboutDoc from "@/components/AboutDoc";

const TITLE = "Facture — Impastile 그림 엔진";
const DESCRIPTION =
  "Impastile이 반 고흐를 다시 그리는 방식. 그림 스타일을 이루는 세 가지 규칙과, 원화에서 붓결을 뽑아 화면에 올리는 Facture 엔진의 구조.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/about" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function About() {
  return <AboutDoc />;
}
