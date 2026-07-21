#!/usr/bin/env node
// Use Wordwall's one-click "switch template" to re-skin an existing activity
// (great for differentiation). Low-cost, high-value.
// Usage: node scripts/pw/switch-template.mjs --activity-url <url> --to <template-name>
// Flow manifest: references/flows.md
import {
  openSession,
  ok,
  fail,
  failWithDiagnostics,
  handoff,
  clickFirst,
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
  if (/\/login/i.test(page.url())) {
    fail("not-logged-in", "尚未登入 Wordwall。請先執行 node scripts/pw/login.mjs。");
    await context.close();
    process.exit(1);
  }
  await clickFirst(page, [(p) => p.getByText(/switch template|切換模板/i)], "Switch template", 15000);
  await clickFirst(page, [(p) => p.getByText(new RegExp(to, "i"))], `template ${to}`, 10000);
  await page.waitForTimeout(1500);
  ok({ switched: true, to, activityUrl: page.url(), note: "並非所有模板可互換；若目標模板未出現在清單即代表不支援。" });
} catch (err) {
  const msg = String(err?.message ?? err);
  if (msg.startsWith("selector-failure")) {
    await handoff(PLATFORM, page, msg, { hint: "找不到切換模板選項，或目標模板不可互換。請老師在活動頁手動 Switch template。" });
  } else {
    await failWithDiagnostics(PLATFORM, page, msg, "切換模板失敗。請確認登入狀態後重試一次。");
  }
} finally {
  await context.close();
}
