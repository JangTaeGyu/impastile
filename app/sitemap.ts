import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// /sitemap.xml — 갤러리는 작품마다 주소가 따로 없는 한 장짜리 화면이라
// 실제 문서는 갤러리와 소개 둘뿐이다.
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
  ];
}
