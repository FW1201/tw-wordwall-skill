#!/usr/bin/env node
// Visible-browser login to Wordwall; the teacher completes login/MFA personally.
// Session persists in ~/.tw-edu-skills/wordwall/profile/.
// Usage: node scripts/pw/login.mjs   (allow up to ~6 minutes)
import { openSession, ok, failWithDiagnostics, inspectAuth, waitForAuthenticated, gotoReady, authManifest } from "../lib/session.mjs";

const PLATFORM = "wordwall";
const LOGIN_URL = "https://wordwall.net/login";
const ENTRY_URL = "https://wordwall.net/create";
const LOGGED_IN = /wordwall\.net\/(myactivities|community|create)/i;
const WAIT_MS = 5 * 60 * 1000;
const AUTH = authManifest({
  entryUrl: ENTRY_URL,
  loginUrls: [/wordwall\.net\/login/i],
  authenticatedUrlPatterns: [LOGGED_IN],
  authenticatedLocators: [(p) => p.getByText(/create|my activities|我的活動|建立/i)],
});

const { context, page } = await openSession(PLATFORM);
try {
  await gotoReady(page, ENTRY_URL, { timeoutMs: 30000 });
  const current = await inspectAuth(page, AUTH);
  if (current.state !== "authenticated") {
    await gotoReady(page, LOGIN_URL, { timeoutMs: 30000 });
    console.error("請在開啟的視窗完成 Wordwall 登入（最多等 5 分鐘）…");
    const authenticated = await waitForAuthenticated(context, page, AUTH, WAIT_MS);
    ok({ loggedIn: true, authState: authenticated.state, url: authenticated.url });
  } else {
    ok({ loggedIn: true, authState: current.state, url: current.url });
  }
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
