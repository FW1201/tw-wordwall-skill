#!/usr/bin/env node
// Set an activity as an assignment and capture the share link.
// Agent must confirm named/deadline with the teacher in chat BEFORE running.
// Usage: node scripts/pw/set-assignment.mjs --activity-url <url> [--named true|false] [--deadline YYYY-MM-DD]
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
const named = (arg("named") ?? "true") === "true";
const deadline = arg("deadline");
if (!activityUrl) {
  fail("usage", "node scripts/pw/set-assignment.mjs --activity-url <url> [--named true|false] [--deadline YYYY-MM-DD]");
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

  await clickFirst(page, [(p) => p.getByRole("button", { name: /share|分享/i }), (p) => p.getByText(/^share$/i)], "Share", 15000);
  await clickFirst(page, [(p) => p.getByText(/set assignment|指派/i)], "Set Assignment", 10000);

  // Named / anonymous toggle
  try {
    const label = named ? /enter.*name|記名|需要姓名/i : /anonym|不記名/i;
    await clickFirst(page, [(p) => p.getByText(label)], `named=${named}`, 5000);
  } catch {
    // default may already match; teacher confirmed in chat
  }
  if (deadline) {
    try {
      const dateInput = page.locator('input[type="date"]').first();
      await dateInput.waitFor({ state: "visible", timeout: 5000 });
      await dateInput.fill(deadline);
    } catch {
      // deadline optional; teacher confirmed default
    }
  }

  await clickFirst(page, [(p) => p.getByRole("button", { name: /^(start|create|continue|開始|建立)$/i })], "confirm assignment", 10000);

  // Success evidence: an assignment link is presented.
  let assignmentUrl;
  try {
    const linkInput = page.locator('input[value*="wordwall.net"]').first();
    await linkInput.waitFor({ state: "visible", timeout: 15000 });
    assignmentUrl = await linkInput.inputValue();
  } catch {
    const body = (await page.locator("body").innerText()).slice(0, 20000);
    const m = body.match(/https:\/\/wordwall\.net\/(?:play|resource)\/[^\s"']+/i);
    assignmentUrl = m?.[0];
  }

  if (assignmentUrl) {
    ok({ assigned: true, named, assignmentUrl, pageUrl: page.url() });
  } else {
    await handoff(PLATFORM, page, "assignment-link-not-found", {
      hint: "指派可能已建立但未擷取到連結。請開啟 resumeUrl 從畫面複製指派連結給學生。",
    });
  }
} catch (err) {
  const msg = String(err?.message ?? err);
  if (msg.startsWith("selector-failure")) {
    await handoff(PLATFORM, page, msg, {
      hint: "分享/指派選擇器不符（介面可能改版）。請老師在活動頁 Share → Set Assignment 手動設定。",
    });
  } else {
    await failWithDiagnostics(PLATFORM, page, msg, "設定指派失敗。請確認活動已建立、登入狀態後重試一次。");
  }
} finally {
  await context.close();
}
