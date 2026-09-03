import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { locatedWorks, workPath } from "@/lib/works";

// /sitemap.xml — 갤러리와 소개, 그리고 작품 마흔두 장.
export default function sitemap(): MetadataRoute.Sitemap {
  // 캐시되는 라우트다 — 빌드 때 한 번 굳고 배포할 때마다 새 시각이 박힌다.
  const lastModified = new Date();
  return [
    {
      url: SITE_URL, // canonical과 한 글자도 다르면 안 된다 (끝 슬래시 없음)
      lastModified,
      changeFrequency: "monthly", // 작품이 늘 때만 바뀐다
      priority: 1,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    // 작품 낱장. 그림도 글도 바뀌지 않으므로 yearly이고, 갤러리보다는 낮되
    // 소개보다는 높다 — 검색에서 실제로 찾는 것은 작품 이름이다.
    ...locatedWorks.map((w) => ({
      url: `${SITE_URL}${workPath(w.slug)}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ];
}
