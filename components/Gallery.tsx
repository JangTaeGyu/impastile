"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import Actions from "./Actions";
import FactureCanvas from "./FactureCanvas";
import { useReducedMotion } from "./useReducedMotion";
import { MY_EXHIBIT, exhibits } from "@/lib/scenes";
import { loadWork, loadedWork, preloadWorks } from "@/lib/scenes/load";
import { entryFromFile } from "@/lib/scenes/fromFile";
import { locatedWorks, workPath } from "@/lib/works";
import { subLine } from "@/lib/site";
import { THUMB_H, thumbSrc, thumbWidth } from "@/lib/facture/thumb";
import type { Work, WorkEntry } from "@/lib/facture/types";

const AUTO_MS = 7000;
const FADE_MS = 420;
const NOTICE_MS = 4000;

/** 사용자가 올린 이미지가 담기는 탭은 항상 마지막이다 */
const MY_TAB = exhibits.length;

/**
 * 갤러리가 처음 여는 자리. `/work/<슬러그>`가 자기 작품을 지정해 들어온다 —
 * 없으면 첫 전시관의 첫 작품이다.
 */
export interface Start {
  tab: number;
  idx: number;
}

export default function Gallery({ start }: { start?: Start } = {}) {
  // 움직임을 줄여 달라고 해 두었으면 붓질도, 크로스페이드도, 7초 자동 넘김도
  // 걷는다. 그림은 그대로 보이고 넘기는 것만 손으로 하게 된다.
  const still = useReducedMotion();
  const [mine, setMine] = useState<WorkEntry[]>([]); // 나의 전시관
  const [tab, setTab] = useState(start?.tab ?? 0);
  // 띠에서 고른 자리 — 데이터를 기다리지 않는다
  const [idx, setIdx] = useState(start?.idx ?? 0);
  const [cur, setCur] = useState<Work | null>(null); // 캔버스가 그리는 작품
  // 제목이 보여주는 작품 — 전환이 끝난 뒤 갱신되므로 자리가 아니라 값으로 든다.
  // path는 그 작품의 낱장 주소다 (올린 이미지에는 없다) — 공유가 이걸 건넨다.
  const [shown, setShown] = useState<
    { work: Work; tab: number; path?: string } | null
  >(null);
  const [fading, setFading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  // 뒤에서 한 점씩 도착할 때마다 썸네일을 다시 그리게 하는 신호
  const [, bumpLoaded] = useState(0);

  const idxRef = useRef(idx);
  const stillRef = useRef(still);
  // 콜백이 매번 다시 만들어지지 않도록 최신 값을 ref로도 들고 있는다
  const tabRef = useRef(start?.tab ?? 0);
  const mineRef = useRef<WorkEntry[]>([]);
  // 늦게 도착한 로드가 그 사이 바뀐 선택을 덮어쓰지 않게 하는 순번
  const seqRef = useRef(0);
  const fadeTimer = useRef(0);
  const noticeTimer = useRef(0);
  const resetAuto = useRef(() => {});
  const fileRef = useRef<HTMLInputElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // 서버가 한 번 준 값이라 바뀌지 않는다 — 아래 effect의 의존성으로 쓰려고 꺼내둔다
  const startIdx = start?.idx ?? 0;

  useEffect(() => {
    idxRef.current = idx;
  }, [idx]);

  useEffect(() => {
    stillRef.current = still;
  }, [still]);

  // 선택이 넘어가면 띠도 따라 굴러간다 (block:nearest — 세로로는 안 움직인다)
  useEffect(() => {
    const el = trackRef.current?.children[idx];
    el?.scrollIntoView({
      behavior: still ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [idx, still]);

  const say = useCallback((msg: string) => {
    setNotice(msg);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), NOTICE_MS);
  }, []);

  /** 탭 번호로 그 전시관의 작품 목록을 얻는다 */
  const entriesOf = (t: number) =>
    t < exhibits.length ? exhibits[t].works : mineRef.current;

  /**
   * 현재 탭 안에서 i번째 작품으로 (순환).
   * 데이터가 아직 없으면 받아온 뒤에 캔버스를 넘긴다 — 그동안 화면은 이전
   * 작품을 그대로 들고 있고, 띠의 표시만 먼저 옮겨간다.
   */
  const go = useCallback((i: number) => {
    const t = tabRef.current;
    const list = entriesOf(t);
    if (!list.length) return;
    const n = ((i % list.length) + list.length) % list.length;
    setIdx(n);
    const seq = ++seqRef.current;
    loadWork(list[n])
      .then((w) => {
        if (seqRef.current !== seq) return; // 그 사이 다른 작품을 골랐다
        setCur(w);
        const at = locatedWorks.find((o) => o.tab === t && o.idx === n);
        const next = { work: w, tab: t, path: at && workPath(at.slug) };
        window.clearTimeout(fadeTimer.current);
        // 정지 모드에서는 흐려졌다 돌아오는 동안이 없다 — 글자를 바로 바꾼다
        if (stillRef.current) {
          setFading(false);
          setShown(next);
          return;
        }
        setFading(true);
        fadeTimer.current = window.setTimeout(() => {
          setShown(next);
          setFading(false);
        }, FADE_MS);
      })
      .catch(() => {
        if (seqRef.current === seq) say("Couldn't load that painting");
      });
  }, [say]);

  /** 전시관 전환 — 비어 있는 전시관은 고를 수 없다 (탭이 비활성) */
  const selectTab = useCallback(
    (t: number) => {
      if (!entriesOf(t).length) return;
      tabRef.current = t;
      setTab(t);
      go(0);
    },
    [go],
  );

  // 열린 자리의 작품부터 받는다. 나머지는 아래에서 전시관 단위로 따라온다.
  // (`/work/<슬러그>`로 들어왔으면 그 작품이고, 갤러리면 첫 점이다.
  //  tabRef는 useState 초기값에서 이미 맞춰져 있으므로 go만 부르면 된다.)
  useEffect(() => {
    go(startIdx);
  }, [go, startIdx]);

  // 띠의 썸네일은 결국 데이터를 봐야 구울 수 있다. 다만 필요한 것은 **지금 열린
  // 전시관**뿐이다 — 마흔두 점을 한꺼번에 받으면 첫 화면 뒤로 3MB가 흐른다.
  // 전시관을 옮길 때 그쪽을 받고, 받아둔 것은 loadWork의 캐시가 들고 있으므로
  // 돌아올 때는 다시 받지 않는다. 아직 안 온 자리는 띠가 크기만 잡아둔다.
  useEffect(() => {
    let alive = true;
    (async () => {
      await preloadWorks(
        tab < exhibits.length ? exhibits[tab].works : mine,
        () => bumpLoaded((v) => v + 1),
        () => alive,
      );
    })();
    return () => {
      alive = false;
    };
  }, [tab, mine]);

  /** 고른 파일을 씬으로 만들어 나의 전시관에 담고 첫 장으로 넘어간다 */
  const addFiles = useCallback(
    async (list: FileList | File[] | null | undefined) => {
      const files = Array.from(list ?? []).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (!files.length) {
        if (list && Array.from(list).length) say("That isn't an image file");
        return;
      }
      setBusy(true);
      const added: WorkEntry[] = [];
      let failed = 0;
      for (const f of files) {
        try {
          added.push(await entryFromFile(f));
        } catch {
          // HEIC처럼 브라우저가 디코드하지 못하는 형식이 여기로 온다
          failed++;
        }
      }
      setBusy(false);
      if (failed) {
        say(
          added.length
            ? `${failed} of them couldn't be read`
            : "Couldn't read that image",
        );
      }
      if (!added.length) return;
      const next = [...mineRef.current, ...added];
      mineRef.current = next;
      setMine(next);
      tabRef.current = MY_TAB;
      setTab(MY_TAB);
      go(next.length - added.length);
      resetAuto.current();
    },
    [go, say],
  );

  // 7초 자동 슬라이드 — 사용자 입력 시 타이머 리셋.
  // 스스로 넘어가는 화면은 움직임을 줄이는 쪽에서 가장 곤란한 것이라 아예 걸지
  // 않는다. 그때는 화살표·띠·키보드로만 넘어간다.
  useEffect(() => {
    let auto = 0;
    const arm = () => {
      window.clearInterval(auto);
      if (!still) auto = window.setInterval(() => go(idxRef.current + 1), AUTO_MS);
    };
    arm();
    const reset = arm;
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
  }, [go, still]);

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

  const works = tab < exhibits.length ? exhibits[tab].works : mine;
  const tabs = [
    ...exhibits.map((e) => ({ name: e.name, count: e.works.length })),
    { name: MY_EXHIBIT, count: mine.length },
  ];
  const artist = shown ? exhibits[shown.tab]?.artist : undefined;

  return (
    <>
      {cur && <FactureCanvas work={cur} still={still} />}
      <div className="grain" />
      <div className="scrim" />

      <div className="ui">
        <div className="topbar">
          <Logo />
          <Actions title={shown?.work.title} href={shown?.path} />
        </div>
        <div className="panel">
          {shown && (
            <div className={`fade${fading ? " out" : ""}`}>
              <div className="kicker">
                {shown.work.uploaded
                  ? MY_EXHIBIT
                  : subLine(shown.work.title, shown.work.sub)}
              </div>
              <h1>{shown.work.title}</h1>
              {artist && !shown.work.uploaded && (
                <>
                  <p className="desc">{shown.work.desc}</p>
                  <div className="meta">
                    <b>{artist.name}</b> · {artist.era} · {artist.movement}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 전시관 탭 + 작품 띠 — 선택이 넘어가면 띠가 함께 굴러간다 */}
      <div className="rail">
        <div className="tabs">
          {tabs.map((t, i) => (
            <button
              key={t.name}
              className={`tab${i === tab ? " on" : ""}`}
              onClick={() => selectTab(i)}
              disabled={!t.count}
              title={t.count ? `${t.count} works` : "Empty for now"}
              aria-current={i === tab}
            >
              {t.name}
              {t.count > 0 && <b>{t.count}</b>}
            </button>
          ))}
        </div>
        <div className="rail-row">
          <div className="rail-track" ref={trackRef}>
            {works.length === 0 && (
              <span className="rail-empty">Add an image and it lands here</span>
            )}
            {works.map((e, i) => {
              const w = loadedWork(e);
              return (
                <button
                  key={i}
                  className={`thumb${i === idx ? " on" : ""}`}
                  onClick={() => go(i)}
                  title={e.title}
                  aria-label={e.title}
                  aria-current={i === idx}
                >
                  {w ? (
                    <>
                      {/* 런타임에 구운 SVG data URI라 next/image로 최적화할 대상이 아니다 */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumbSrc(w)}
                        alt=""
                        width={thumbWidth(e)}
                        height={THUMB_H}
                      />
                    </>
                  ) : (
                    // 아직 안 받은 작품 — 도착하면 띠가 덜컹거리지 않도록 자리만 잡는다
                    <span
                      className="thumb-wait"
                      style={{ width: thumbWidth(e), height: THUMB_H }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          {notice && <span className="notice">{notice}</span>}
          <div className="nav">
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
              title="Add your own image — dragging or pasting works too"
              aria-label="Add your own image"
            >
              {busy ? "…" : "+"}
            </button>
            <button
              className="arrow"
              onClick={() => go(idx - 1)}
              aria-label="Previous work"
            >
              ‹
            </button>
            <button
              className="arrow"
              onClick={() => go(idx + 1)}
              aria-label="Next work"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {dragging && (
        <div className="dropzone">
          <span>Drop it and the brush takes over</span>
        </div>
      )}
    </>
  );
}
