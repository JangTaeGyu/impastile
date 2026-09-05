import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Gallery from "@/components/Gallery";
import { jsonLdScript, workJsonLd } from "@/lib/jsonLd";
import { COUNT } from "@/lib/site";
import { type Located, findWork, locatedWorks, workPath } from "@/lib/works";
import { subLine } from "@/lib/site";

/**
 * 작품 한 점의 주소. 화면은 갤러리 그대로이고 그 작품에서 시작할 뿐이지만,
 * 검색엔진에게는 마흔두 장의 문서가 된다 — 한 장짜리였을 때는 '별이 빛나는
 * 밤에'를 검색해도 걸릴 자리가 없었다.
 */

export function generateStaticParams() {
  return locatedWorks.map((w) => ({ slug: w.slug }));
}

// 목록에 없는 슬러그는 404다. 작품은 빌드 때 다 아는 값이라 열어둘 이유가 없다.
export const dynamicParams = false;

const titleOf = (w: Located) =>
  `${w.entry.title} — ${w.artist.name}, ${w.year}`;

const descOf = (w: Located) =>
  `${w.artist.name}, ${w.original} (${w.year}, ${w.holder}). ${w.entry.desc} ` +
  "Redrawn here one impasto stroke at a time, following the brush direction of the original.";

export async function generateMetadata({
  params,
}: PageProps<"/work/[slug]">): Promise<Metadata> {
  const w = findWork((await params).slug);
  if (!w) return {};
  return {
    title: titleOf(w),
    description: descOf(w),
    alternates: { canonical: workPath(w.slug) },
    openGraph: {
      type: "article",
      title: titleOf(w),
      description: descOf(w),
      url: workPath(w.slug),
    },
    twitter: { title: titleOf(w), description: descOf(w) },
  };
}

export default async function Work({ params }: PageProps<"/work/[slug]">) {
  const w = findWork((await params).slug);
  if (!w) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(workJsonLd(w, titleOf(w), descOf(w))),
        }}
      />
      {/*
        홈의 개요와 같은 상자다(app/page.tsx 참고). 다만 여기서는 이 한 점이
        문서의 주인이라 그 작품을 먼저 펴고, 나머지는 서로 오갈 수 있게
        링크로만 세운다 — 마흔두 장이 서로를 가리켜야 크롤러가 다 돈다.
      */}
      <section className="sr">
        <h1>{titleOf(w)}</h1>
        <p>{subLine(w.entry.title, w.entry.sub)}</p>
        <p>{w.entry.desc}</p>
        <p>
          {w.artist.name} · {w.artist.era} · {w.artist.movement}
        </p>
        <p>
          Impastile redraws this painting one impasto stroke at a time,
          following the brush direction of the original. Read{" "}
          <Link href="/about">how the Facture engine draws</Link>, or see{" "}
          <Link href="/">all {COUNT} paintings</Link>.
        </p>
        <h2>Other works in the {w.exhibit}</h2>
        <ul>
          {locatedWorks
            .filter((o) => o.tab === w.tab && o.slug !== w.slug)
            .map((o) => (
              <li key={o.slug}>
                <Link href={workPath(o.slug)}>
                  {o.entry.title} — {o.entry.sub}
                </Link>
              </li>
            ))}
        </ul>
      </section>
      <Gallery start={{ tab: w.tab, idx: w.idx }} />
    </>
  );
}
