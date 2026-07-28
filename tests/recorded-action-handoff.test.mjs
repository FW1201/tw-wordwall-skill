import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Wordwall handoff documents manual OAuth and draft-only boundaries", async () => {
  const skill = await readFile(new URL("../SKILL.md", import.meta.url), "utf8");
  const oauth = await readFile(new URL("../references/google-oauth-handoff.md", import.meta.url), "utf8");
  const handoff = await readFile(new URL("../references/recorded-action-handoff.md", import.meta.url), "utf8");
  for (const phrase of ["正常 Chrome", "Chrome 原生 Google 帳戶提示", "/account/login", "/myactivities", "This browser or app may not be secure", "not-applicable", "未公開預覽", "Publish", "Share", "Set assignment"]) {
    assert.match(`${skill}\n${oauth}\n${handoff}`, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
