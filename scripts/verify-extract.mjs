// lib/scenes/extract.ts(런타임 TS 판)가 scripts/extract-painting.py(빌드타임
// 파이썬 판)와 같은 방향장을 내는지 대조한다. 둘 중 하나를 고치면 이걸 돌린다.
//
//   python scripts/extract-painting.py --src img.jpg --out /tmp/x.ts --dump /tmp/d
//   node scripts/verify-extract.mjs /tmp/d
//
// 색상 맵은 비교하지 않는다 — 파이썬은 LANCZOS, 브라우저는 캔버스 리샘플러라
// 애초에 다르다. 이식 위험이 있는 곳은 구조 텐서 쪽이고, 그래서 같은 휘도
// 버퍼를 양쪽에 먹여 방향장만 비교한다.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildFlowField } from "../lib/scenes/extract.ts";

const dir = process.argv[2];
if (!dir) {
  console.error("usage: node scripts/verify-extract.mjs <dump-dir>");
  process.exit(2);
}

const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8"));
const { lw, lh, w, h } = meta;

const lumBuf = readFileSync(join(dir, "lum.f64"));
const lum = new Float64Array(
  lumBuf.buffer.slice(lumBuf.byteOffset, lumBuf.byteOffset + lumBuf.byteLength),
);
const expected = new Int8Array(readFileSync(join(dir, "flow.i8")));

if (lum.length !== lw * lh) throw new Error(`lum ${lum.length} != ${lw * lh}`);
if (expected.length !== w * h * 2) {
  throw new Error(`flow ${expected.length} != ${w * h * 2}`);
}

const t0 = performance.now();
const { c, s } = buildFlowField(lum, lw, lh, w, h);
const ms = performance.now() - t0;

// int8로 양자화된 뒤라 ±1은 반올림 규칙 차이(numpy는 짝수 반올림,
// JS는 올림)로도 나올 수 있다. 그 이상 벌어지면 이식이 틀린 것이다.
let maxDiff = 0;
let off = 0;
let sumDiff = 0;
const got = new Int8Array(w * h * 2);
got.set(c, 0);
got.set(s, w * h);
for (let i = 0; i < got.length; i++) {
  const d = Math.abs(got[i] - expected[i]);
  if (d > 0) off++;
  if (d > maxDiff) maxDiff = d;
  sumDiff += d;
}

// 양자화 오차가 아니라 방향 자체가 맞는지도 본다 — 배각 벡터의 사잇각
let maxAngle = 0;
for (let i = 0; i < w * h; i++) {
  const a = Math.atan2(s[i], c[i]);
  const b = Math.atan2(expected[i + w * h], expected[i]);
  let d = Math.abs(a - b) % (Math.PI * 2);
  if (d > Math.PI) d = Math.PI * 2 - d;
  if (d > maxAngle) maxAngle = d;
}

const pct = ((off / got.length) * 100).toFixed(2);
console.log(`flow ${w}x${h} (lum ${lw}x${lh}), buildFlowField ${ms.toFixed(0)}ms`);
console.log(`  다른 바이트 ${off}/${got.length} (${pct}%), 최대 ${maxDiff}, 평균 ${(sumDiff / got.length).toFixed(4)}`);
console.log(`  최대 방향차 ${((maxAngle * 180) / Math.PI).toFixed(3)}° (배각 기준)`);

const ok = maxDiff <= 1 && maxAngle < 0.02;
console.log(ok ? "OK — 두 구현이 일치한다" : "FAIL — 이식이 어긋났다");
process.exit(ok ? 0 : 1);
