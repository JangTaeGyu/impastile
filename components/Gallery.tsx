"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import MosaicCanvas from "./MosaicCanvas";
import { ARTIST, baseWorks } from "@/lib/scenes";
import { workFromFile } from "@/lib/scenes/fromFile";
import type { Work } from "@/lib/engine/types";

const AUTO_MS = 7000;
const FADE_MS = 420;
const NOTICE_MS = 4000;

export default function Gallery() {
  // 전시 6점 + 사용자가 올린 이미지. 올린 것은 뒤에 붙는다.
  const [works, setWorks] = useState<Work[]>(baseWorks);
  const [idx, setIdx] = useState(0); // 캔버스가 그리는 작품
  const [shownIdx, setShownIdx] = useState(0); // 제목이 보여주는 작품 (전환 후 갱신)
  const [fading, setFading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const idxRef = useRef(idx);
  // works를 ref로도 들고 있어야 go/업로드 콜백이 다시 만들어지지 않는다
  const worksRef = useRef(works);
  const fadeTimer = useRef(0);
  const noticeTimer = useRef(0);
  const resetAuto = useRef(() => {});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    idxRef.current = idx;
  }, [idx]);

  const go = useCallback((i: number) => {
    const len = worksRef.current.length;
    const n = ((i % len) + len) % len;
    setIdx(n);
    setFading(true);
    window.clearTimeout(fadeTimer.current);
    fadeTimer.current = window.setTimeout(() => {
      setShownIdx(n);
      setFading(false);
    }, FADE_MS);
  }, []);

  const say = useCallback((msg: string) => {
    setNotice(msg);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), NOTICE_MS);
  }, []);

  /** 고른 파일을 씬으로 만들어 갤러리 뒤에 붙이고 첫 장으로 넘어간다 */
  const addFiles = useCallback(
    async (list: FileList | File[] | null | undefined) => {
      const files = Array.from(list ?? []).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (!files.length) {
        if (list && Array.from(list).length) say("이미지 파일이 아닙니다");
        return;
      }
      setBusy(true);
      const added: Work[] = [];
      let failed = 0;
      for (const f of files) {
        try {
          added.push(await workFromFile(f));
        } catch {
          // HEIC처럼 브라우저가 디코드하지 못하는 형식이 여기로 온다
          failed++;
        }
      }
      setBusy(false);
      if (failed) {
        say(
          added.length
            ? `${failed}장은 읽지 못했습니다`
            : "이미지를 읽지 못했습니다",
        );
      }
      if (!added.length) return;
      const next = [...worksRef.current, ...added];
      worksRef.current = next;
      setWorks(next);
      go(next.length - added.length);
      resetAuto.current();
    },
    [go, say],
  );

  // 7초 자동 슬라이드 — 사용자 입력 시 타이머 리셋
  useEffect(() => {
    let auto = window.setInterval(() => go(idxRef.current + 1), AUTO_MS);
    const reset = () => {
      window.clearInterval(auto);
      auto = window.setInterval(() => go(idxRef.current + 1), AUTO_MS);
    };
    resetAuto.current = reset;
    addEventListener("mousedown", reset);
    addEventListener("keydown", reset);
    return () => {
      window.clearInterval(auto);
      window.clearTimeout(fadeTimer.current);
      window.clearTimeout(noticeTimer.current);
      removeEventListener("mousedown", reset);
      removeEventListener("keydown", reset);
    };
  }, [go]);

  // ←/→ 키보드 네비게이션
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(idxRef.current + 1);
      if (e.key === "ArrowLeft") go(idxRef.current - 1);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [go]);

  // 화면 어디에나 드롭 + 붙여넣기
  useEffect(() => {
    // dragenter/leave는 자식 요소를 지날 때마다 오므로 깊이를 세야 깜빡이지 않는다
    let depth = 0;
    const hasFiles = (e: DragEvent) =>
      Array.from(e.dataTransfer?.types ?? []).includes("Files");
    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth++;
      setDragging(true);
    };
    const onOver = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault(); // 이게 없으면 브라우저가 파일을 열어버린다
    };
    const onLeave = () => {
      depth = Math.max(0, depth - 1);
      if (!depth) setDragging(false);
    };
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      addFiles(e.dataTransfer?.files);
    };
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.items ?? [])
        .filter((i) => i.kind === "file")
        .map((i) => i.getAsFile())
        .filter((f): f is File => !!f);
      if (files.length) addFiles(files);
    };
    addEventListener("dragenter", onEnter);
    addEventListener("dragover", onOver);
    addEventListener("dragleave", onLeave);
    addEventListener("drop", onDrop);
    addEventListener("paste", onPaste);
    return () => {
      removeEventListener("dragenter", onEnter);
      removeEventListener("dragover", onOver);
      removeEventListener("dragleave", onLeave);
      removeEventListener("drop", onDrop);
      removeEventListener("paste", onPaste);
    };
  }, [addFiles]);

  const shown = works[shownIdx];

  return (
    <>
      <MosaicCanvas work={works[idx]} />
      <div className="grain" />
      <div className="scrim" />

      <div className="ui">
        <Logo />
        <div className="panel">
          <div className={`fade${fading ? " out" : ""}`}>
            <div className="kicker">{shown.uploaded ? "내 이미지" : shown.sub}</div>
            <h1>{shown.title}</h1>
            {!shown.uploaded && (
              <>
                <p className="desc">{shown.desc}</p>
                <div className="meta">
                  <b>{ARTIST.ko}</b> · {ARTIST.en} · {ARTIST.era} ·{" "}
                  {ARTIST.movement}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="foot">
          {notice && <span className="notice">{notice}</span>}
          <div className="nav">
            <div className="dots">
              {works.map((w, i) => (
                <i
                  key={i}
                  className={i === idx ? "on" : undefined}
                  onClick={() => go(i)}
                  title={w.title}
                />
              ))}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = ""; // 같은 파일을 다시 골라도 change가 오도록
              }}
            />
            <button
              className="arrow"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              title="내 이미지 올리기 — 끌어다 놓거나 붙여넣어도 됩니다"
              aria-label="내 이미지 올리기"
            >
              {busy ? "…" : "+"}
            </button>
            <button
              className="arrow"
              onClick={() => go(idx - 1)}
              aria-label="이전 작품"
            >
              ‹
            </button>
            <button
              className="arrow"
              onClick={() => go(idx + 1)}
              aria-label="다음 작품"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {dragging && (
        <div className="dropzone">
          <span>놓으면 붓터치로 다시 그립니다</span>
        </div>
      )}
    </>
  );
}
