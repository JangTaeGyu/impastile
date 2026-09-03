import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// /robots.txt — 막을 곳이 없는 사이트라 문서 두 장을 다 열어두고
// sitemap 위치만 알려준다. 주소는 lib/site.ts가 쥐고 있다.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
