import Link from "next/link";

/** href를 주면 로고 자체가 링크가 된다 (/about에서 갤러리로 돌아가는 길) */
export default function Logo({ href }: { href?: string }) {
  const mark = (
    <>
      <svg
        className="brand-mark"
        viewBox="0 0 32 32"
        width="30"
        height="30"
        aria-hidden
      >
        <rect width="32" height="32" rx="7" fill="#0f1430" />
        <g fill="none" strokeLinecap="round">
          <path
            d="M5.5 9.5C7 7.2 9.2 6 11.8 5.8"
            stroke="#8fb4e6"
            strokeWidth="2.4"
            opacity=".75"
          />
          <path
            d="M26.5 22.5C25 25 22.6 26.2 20 26.2"
            stroke="#8fb4e6"
            strokeWidth="2.4"
            opacity=".75"
          />
          <path
            d="M16.2 12.4c2.4 0 3.6 1.9 3.6 3.9 0 2.9-2.4 4.6-5 4.6-3.5 0-5.9-2.6-5.9-5.9 0-4.2 3.4-7.2 7.7-7.2 5.1 0 8.6 3.7 8.6 8.6"
            stroke="#f2c14e"
            strokeWidth="2.7"
          />
        </g>
      </svg>
      <span className="brand-word">
        IMPAS<b>TILE</b>
      </span>
    </>
  );

  if (!href) return <div className="brand">{mark}</div>;
  return (
    <Link className="brand brand-link" href={href}>
      {mark}
    </Link>
  );
}
