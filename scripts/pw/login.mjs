#!/usr/bin/env node
// Visible-browser login to Wordwall; the teacher completes login/MFA personally.
// Session persists in ~/.tw-edu-skills/wordwall/profile/.
// Usage: node scripts/pw/login.mjs   (allow up to ~6 minutes)
import { openSession, ok, failWithDiagnostics } from "../lib/session.mjs";

const PLATFORM = "wordwall";
const LOGIN_URL = "https://wordwall.net/login";
const LOGGED_IN = /wordwall\.net\/(myactivities|community|create)/i;
const WAIT_MS = 5 * 60 * 1000;

const { context, page } = await openSession(PLATFORM);
try {
  await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" });
  if (!LOGGED_IN.test(page.url())) {
    console.error("請在開啟的視窗完成 Wordwall 登入（最多等 5 分鐘）…");
    await page.waitForURL(LOGGED_IN, { timeout: WAIT_MS });
  }
  ok({ loggedIn: true, url: page.url() });
} catch (err) {
  await failWithDiagnostics(
    PLATFORM,
    page,
    `login-timeout: ${String(err?.message ?? err)}`,
    "5 分鐘內未偵測到登入完成。請重新執行 scripts/pw/login.mjs。",
  );
} finally {
  await context.close();
}
