import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("5DGZ product experience replaces the starter preview", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const actions = await readFile(new URL("../app/PlaceActions.tsx", import.meta.url), "utf8");

  assert.match(page, /오늘/);
  assert.match(page, /어디 근처로 찾아볼까요/);
  assert.match(actions, /SNS후기 보기/);
  assert.match(page, /recommendation_complete/);
  assert.match(page, /PlaceActions place=/);
  assert.match(layout, /오디가지 5DGZ/);
  assert.doesNotMatch(page + layout, /SkeletonPreview|codex-preview/);
});
