#!/usr/bin/env node
// Read-only: fetch the teacher's Wordwall "My Results" list (student completion
// tracking). No writes, no external side effects.
// Live-verified 2026-07-22 against a real logged-in session. Stable selectors:
//  - Each result is a `.js-result-item` card.
//  - `.js-item-name` holds the title (e.g. "Result 1 for 'Untitled1'").
//  - `.js-item-players` holds the student/response count (e.g. "0").
//  - The remaining `.result-info` text carries the created time + deadline
//    (e.g. "21 Jul 12:38 – No deadline").
// Usage: node scripts/pw/get-results.mjs [--limit N]
// Flow manifest: references/flows.md
import { openSession, ok, fail, failWithDiagnostics, assertPlatformAuthenticated } from "../lib/session.mjs";

const PLATFORM = "wordwall";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const limit = Number(arg("limit") ?? 50);

const { context, page } = await openSession(PLATFORM);
try {
  await page.goto("https://wordwall.net/myresults", { waitUntil: "domcontentloaded" });
  await assertPlatformAuthenticated(page, PLATFORM);

  // Cards render client-side; wait for at least one (or an empty-state).
  await page
    .locator(".js-result-item")
    .first()
    .waitFor({ state: "visible", timeout: 15000 })
    .catch(() => {});

  const results = await page.$$eval(
    ".js-result-item",
    (items, max) =>
      items.slice(0, max).map((el) => {
        const txt = (sel) => el.querySelector(sel)?.textContent?.replace(/\s+/g, " ").trim() ?? undefined;
        const info = el.querySelector(".result-info")?.innerText?.replace(/\s+/g, " ").trim() ?? "";
        // The date/deadline line is the residual of result-info after title + count.
        const dateMatch = info.match(/(\d{1,2}\s+\w{3,}\s+[\d:]+\s*[–-].*)$/);
        return {
          title: txt(".js-item-name"),
          players: txt(".js-item-players"),
          schedule: dateMatch ? dateMatch[1].trim() : undefined,
        };
      }),
    limit,
  );

  ok({
    count: results.length,
    results,
    note: "唯讀成績清單。players 為完成/回應人數，schedule 為建立時間與截止日。",
  });
  await context.close();
} catch (err) {
  await failWithDiagnostics(PLATFORM, page, String(err?.message ?? err), "讀取 My Results 失敗。請確認登入狀態後重試一次。");
} finally {
  await context.close().catch(() => {});
}
