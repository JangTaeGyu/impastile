"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const NOTE_MS = 2400;

/** 클립보드 API는 보안 컨텍스트(https·localhost)에서만 열린다 — 막히면 옛 방식으로 */
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      // 화면 밖으로 밀되 스크롤은 건드리지 않는 자리에 둔다
      ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * 우측 상단 아이콘 세 개 — 엔진 소개(/about), 링크 복사, 공유.
 * 지금 걸린 작품 제목을 받아 공유 문구에 얹는다.
 */
export default function Actions({ title }: { title?: string }) {
  const [note, setNote] = useState("");
  const timer = useRef(0);

  const say = useCallback((msg: string) => {
    setNote(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setNote(""), NOTE_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onCopy = useCallback(async () => {
    say(
      (await copyText(location.href))
        ? "링크를 복사했습니다"
        : "링크를 복사하지 못했습니다",
    );
  }, [say]);

  const onShare = useCallback(async () => {
    const url = location.href;
    const text = title
      ? `${title} — 원화의 붓결을 따라 다시 그린 회화`
      : "원화의 붓결을 따라 다시 그린 회화";
    if (navigator.share) {
      try {
        // 공유 시트는 사용자 제스처 안에서만 열린다 — 먼저 부르고 실패하면 복사로 내린다
        await navigator.share({ title: document.title, text, url });
        return;
      } catch (e) {
        // 사용자가 시트를 닫은 것뿐이면 아무 말도 하지 않는다
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    say(
      (await copyText(url))
        ? "공유 창이 없어 링크를 복사했습니다"
        : "공유하지 못했습니다",
    );
  }, [say, title]);

  return (
    <div className="actions">
      <Link className="icon" href="/about" title="Facture — 그림 엔진 이야기">
        <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11.2v5.2" />
          <path d="M12 7.6h.01" />
        </svg>
        <span className="sr">Facture 소개</span>
      </Link>

      <button className="icon" onClick={onCopy} title="링크 복사">
        <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden>
          <path d="M10.6 13.4a3.9 3.9 0 0 0 5.5 0l2.6-2.6a3.9 3.9 0 0 0-5.5-5.5l-1.5 1.5" />
          <path d="M13.4 10.6a3.9 3.9 0 0 0-5.5 0l-2.6 2.6a3.9 3.9 0 0 0 5.5 5.5l1.5-1.5" />
        </svg>
        <span className="sr">링크 복사</span>
      </button>

      <button className="icon" onClick={onShare} title="공유하기">
        <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden>
          <circle cx="17.6" cy="5.6" r="2.5" />
          <circle cx="6.4" cy="12" r="2.5" />
          <circle cx="17.6" cy="18.4" r="2.5" />
          <path d="M8.6 10.7 15.4 6.9" />
          <path d="M8.6 13.3l6.8 3.8" />
        </svg>
        <span className="sr">공유하기</span>
      </button>

      {note && <span className="actions-note">{note}</span>}
    </div>
  );
}
