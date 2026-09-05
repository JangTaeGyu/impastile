import Link from "next/link";
import Gallery from "@/components/Gallery";
import { galleryJsonLd, jsonLdScript } from "@/lib/jsonLd";
import { exhibits } from "@/lib/scenes";
import { DESCRIPTION, TITLE } from "@/lib/site";
import { locatedWorks, workPath } from "@/lib/works";

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(galleryJsonLd()) }}
      />
      {/*
        화면에는 캔버스와 아이콘뿐이라 크롤러가 읽을 글이 없다. 제목·설명은
        캔버스가 첫 작품을 받은 뒤에야 클라이언트에서 붙으므로 서버가 보내는
        HTML은 비어 있다시피 하다. 그래서 띠에 걸린 것과 같은 목록을 글로도
        세워둔다 — 화면에는 보이지 않지만 실제로 여기 있는 내용이고,
        읽어주는 쪽에는 이 길뿐이다 (`.sr`는 Actions의 아이콘 이름과 같은 상자).

        목록은 링크다. 작품 낱장(`/work/<슬러그>`)으로 가는 길이 여기밖에
        없어서, 이 줄이 끊기면 마흔두 장이 사이트맵에만 있고 아무도 가리키지
        않는 문서가 된다.
      */}
      <section className="sr">
        <h1>{TITLE}</h1>
        <p>{DESCRIPTION}</p>
        <p>
          <Link href="/about">Facture — how the engine draws</Link>
        </p>
        {exhibits.map((e, tab) => (
          <section key={e.name}>
            <h2>{e.name}</h2>
            {e.artist && (
              <p>
                {e.artist.name} · {e.artist.era} · {e.artist.movement}
              </p>
            )}
            <ul>
              {locatedWorks
                .filter((w) => w.tab === tab)
                .map((w) => (
                  <li key={w.slug}>
                    <Link href={workPath(w.slug)}>
                      <b>{w.entry.title}</b> — {w.entry.sub}
                    </Link>
                    . {w.entry.desc}
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </section>
      <Gallery />
    </>
  );
}
