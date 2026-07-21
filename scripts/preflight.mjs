#!/usr/bin/env node
// Preflight check for the Wordwall chain: toolchain installed + teacher logged
// in? Run BEFORE run.mjs so the one unavoidable manual step (login in a visible
// window) is surfaced up front. This only reports state — it never logs in.
// Usage: node scripts/preflight.mjs
import { existsSync } from "node:fs";

if (!existsSync(new URL("../node_modules/playwright", import.meta.url))) {
  console.log(
    JSON.stringify({
      ok: false,
      error: "needs-install",
      needsInstall: true,
      hint: "尚未安裝依賴。請先執行：cd <skill-dir> && npm install && npx playwright install chromium。",
    }),
  );
  process.exit(1);
}

const { openSession } = await import("./lib/session.mjs");
const PLATFORM = "wordwall";

const { context, page } = await openSession(PLATFORM);
try {
  await page.goto("https://wordwall.net/create", { waitUntil: "domcontentloaded" });
  const loggedIn = !/\/login/i.test(page.url());
  if (loggedIn) {
    console.log(
      JSON.stringify({
        ok: true,
        loggedIn: true,
        note: "已登入，可直接執行 node scripts/run.mjs <input.json> --stage prepare。",
      }),
    );
  } else {
    console.log(
      JSON.stringify({
        ok: false,
        error: "not-logged-in",
        loggedIn: false,
        hint: "尚未登入 Wordwall。請先執行 node scripts/pw/login.mjs，由老師本人完成登入，再重跑 preflight。",
      }),
    );
    process.exitCode = 1;
  }
} catch (err) {
  console.log(
    JSON.stringify({
      ok: false,
      error: String(err?.message ?? err),
      hint: "無法連到 Wordwall。請確認網路後重試一次。",
    }),
  );
  process.exitCode = 1;
} finally {
  await context.close();
}
