import Gallery from "@/components/Gallery";
import { galleryJsonLd, jsonLdScript } from "@/lib/jsonLd";
import { exhibits } from "@/lib/scenes";
import { DESCRIPTION, TITLE } from "@/lib/site";

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
      */}
      <section className="sr">
        <h1>{TITLE}</h1>
        <p>{DESCRIPTION}</p>
        {exhibits.map((e) => (
          <section key={e.name}>
            <h2>{e.name}</h2>
            {e.artist && (
              <p>
                {e.artist.ko} ({e.artist.en}) · {e.artist.era} ·{" "}
                {e.artist.movement}
              </p>
            )}
            <ul>
              {e.works.map((w) => (
                <li key={w.title}>
                  <b>{w.title}</b> — {w.sub}. {w.desc}
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
