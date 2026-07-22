#!/usr/bin/env node
// Use Wordwall's one-click "switch template" to re-skin an existing activity.
// Live-verified 2026-07-22: the "Switch template" panel is always visible on
// the activity page sidebar (no click needed to open it) — just click the
// target template name directly. Only a few compatible templates are listed
// (e.g. Quiz -> Open the box/Anagram/Flash cards); "Show all" reveals more.
// Usage: node scripts/pw/switch-template.mjs --activity-url <url> --to <template-name>
// Flow manifest: references/flows.md
import {
  openSession,
  ok,
  fail,
  failWithDiagnostics,
  handoff,
  waitForCondition,
  assertPlatformAuthenticated,
} from "../lib/session.mjs";

const PLATFORM = "wordwall";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const activityUrl = arg("activity-url");
const to = arg("to");
if (!activityUrl || !to) {
  fail("usage", 'node scripts/pw/switch-template.mjs --activity-url <url> --to "Match up"');
  process.exit(1);
}

const { context, page } = await openSession(PLATFORM);
try {
  await page.goto(activityUrl, { waitUntil: "domcontentloaded" });
  await assertPlatformAuthenticated(page, PLATFORM);

  const panel = page.getByText(/^switch template$/i);
  await panel.waitFor({ state: "visible", timeout: 15000 });

  let target = page.getByText(new RegExp(`^${to}$`, "i"));
  if ((await target.count()) === 0) {
    // Not in the default shortlist — expand "Show all" and retry.
    await page.getByText(/^show all$/i).click();
    target = page.getByText(new RegExp(`^${to}$`, "i"));
  }
  if ((await target.count()) === 0) {
    await handoff(PLATFORM, page, "template-not-switchable", {
      hint: `「${to}」不在此活動可切換的模板清單中（並非所有模板互通）。請老師在側邊 Switch template 面板人工確認可用選項。`,
    });
    await context.close();
    process.exit(1);
  }

  const beforeUrl = page.url();
  await target.first().click();
  const switched = await waitForCondition(
    page,
    async () => {
      if (page.url() !== beforeUrl) return true;
      const bodyText = await page.locator("body").innerText().catch(() => "");
      return /saved|updated|已儲存|已更新|template switched/i.test(bodyText);
    },
    { timeoutMs: 15000, intervalMs: 300 },
  );
  if (!switched) {
    await handoff(PLATFORM, page, "template-switch-ambiguous", {
      to,
      hint: "模板切換按鈕已點擊，但未取得 URL 或頁面狀態變化證據；請人工確認後再繼續，避免重複切換。",
    });
    await context.close();
    process.exit(1);
  }
  ok({ switched: true, to, activityUrl: page.url() });
} catch (err) {
  await failWithDiagnostics(PLATFORM, page, String(err?.message ?? err), "切換模板失敗。請確認登入狀態後重試一次。");
} finally {
  await context.close();
}
