import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("UDGZ product experience replaces the starter preview", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");

  assert.match(page, /오늘/);
  assert.match(page, /어디 근처로 찾아볼까요/);
  assert.match(page, /SNS 후기 보기/);
  assert.match(page, /recommendation_complete/);
  assert.match(page, /길찾기/);
  assert.match(layout, /어디가지 UDGZ/);
  assert.doesNotMatch(page + layout, /SkeletonPreview|codex-preview/);
});
