#!/usr/bin/env node
// Set an activity as an assignment and capture the share link.
// Live-verified 2026-07-22: "Set Assignment" is a direct link on the activity
// page footer (Edit Content | Print | Embed | Set Assignment | More) — no
// need to go through Share first. It opens "Assignment setup" directly.
// Agent must confirm named/deadline with the teacher in chat BEFORE running.
// Usage: node scripts/pw/set-assignment.mjs --activity-url <url> [--named true|false] [--deadline DD/MM/YYYY]
// Flow manifest: references/flows.md
import {
  openSession,
  ok,
  fail,
  failWithDiagnostics,
  handoff,
  assertPlatformAuthenticated,
} from "../lib/session.mjs";

const PLATFORM = "wordwall";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const activityUrl = arg("activity-url");
const named = (arg("named") ?? "true") === "true";
const deadline = arg("deadline"); // DD/MM/YYYY — Wordwall's own format, NOT ISO
if (!activityUrl) {
  fail("usage", "node scripts/pw/set-assignment.mjs --activity-url <url> [--named true|false] [--deadline DD/MM/YYYY]");
  process.exit(1);
}
if (deadline && !/^\d{2}\/\d{2}\/\d{4}$/.test(deadline)) {
  fail("bad-deadline-format", "--deadline 必須是 DD/MM/YYYY 格式（Wordwall 自己的格式，不是 ISO YYYY-MM-DD）。");
  process.exit(1);
}

const { context, page } = await openSession(PLATFORM);
try {
  await page.goto(activityUrl, { waitUntil: "domcontentloaded" });
  await assertPlatformAuthenticated(page, PLATFORM);

  const setAssignmentLink = page.getByText(/^set assignment$/i).first();
  await setAssignmentLink.waitFor({ state: "visible", timeout: 15000 });
  await setAssignmentLink.click();

  const dialog = page.getByText(/^assignment setup$/i);
  await dialog.waitFor({ state: "visible", timeout: 10000 });

  await page.getByText(named ? /^enter name$/i : /^anonymous$/i).click();

  if (deadline) {
    await page.locator('input[placeholder="DD/MM/YYYY"]').fill(deadline).catch(async () => {
      // radio for "specify deadline" may need selecting first
      await page.locator('input[type="radio"]').nth(1).click();
      await page.locator('input[placeholder="DD/MM/YYYY"]').fill(deadline);
    });
  }

  await page.getByRole("button", { name: /^start$/i }).click();

  // Success evidence: "Assignment set" dialog with a wordwall.net/play link.
  await page.getByText(/^assignment set$/i).waitFor({ state: "visible", timeout: 15000 });
  const linkInput = page.locator('input[value*="wordwall.net"]').first();
  const assignmentUrl = await linkInput.inputValue();

  if (assignmentUrl) {
    ok({ assigned: true, named, deadline: deadline ?? null, assignmentUrl, pageUrl: page.url() });
  } else {
    await handoff(PLATFORM, page, "assignment-link-not-found", {
      hint: "指派可能已建立但未擷取到連結。請開啟 resumeUrl 從畫面複製指派連結給學生。",
    });
  }
} catch (err) {
  await failWithDiagnostics(
    PLATFORM,
    page,
    String(err?.message ?? err),
    "設定指派失敗。請確認活動已建立、登入狀態後重試一次；或人工在活動頁點 Set Assignment。",
  );
} finally {
  await context.close();
}
