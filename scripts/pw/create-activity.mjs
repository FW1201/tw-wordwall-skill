#!/usr/bin/env node
// Create a Wordwall activity by typing items into the editor (no bulk-import API).
// v1 verified for quiz & match_up; group_sort/anagram/open_box use per-template
// field mapping (mark experimental until live-verified).
// The most selector-fragile flow of the four skills — stop-on-mismatch is strict.
// Usage: node scripts/pw/create-activity.mjs <input.json> --template quiz|match_up|group_sort|anagram|open_the_box --title "..."
// Flow manifest: references/flows.md
import { readFile } from "node:fs/promises";
import { WordwallContentInput } from "../lib/models.mjs";
import {
  openSession,
  ok,
  fail,
  failWithDiagnostics,
  handoff,
  clickFirst,
} from "../lib/session.mjs";

const PLATFORM = "wordwall";
const TEMPLATE_LABEL = {
  quiz: /^quiz$/i,
  match_up: /match up/i,
  group_sort: /group sort/i,
  anagram: /anagram/i,
  open_the_box: /open the box/i,
};

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const file = process.argv[2];
const template = arg("template");
const title = arg("title");
if (!file || !TEMPLATE_LABEL[template]) {
  fail("usage", `node scripts/pw/create-activity.mjs <input.json> --template ${Object.keys(TEMPLATE_LABEL).join("|")} --title "..."`);
  process.exit(1);
}

let input;
try {
  input = WordwallContentInput.parse(JSON.parse(await readFile(file, "utf8")));
} catch (err) {
  fail(String(err?.message ?? err), "input.json 不符合 WordwallContentInput。");
  process.exit(1);
}

// Flatten input into ordered rows the editor needs, per template.
function rowsFor(tpl) {
  const firstCorrect = (opts) => opts.find((o) => o.correct)?.text;
  if (tpl === "quiz") {
    const qs = input.quiz?.questions ?? [];
    return qs.map((q) => ({
      prompt: q.prompt,
      answers: q.options.map((o) => o.text),
      correctIndex: q.options.findIndex((o) => o.correct),
    }));
  }
  if (tpl === "match_up") {
    const pairs = input.pairs?.length
      ? input.pairs
      : (input.quiz?.questions ?? [])
          .map((q) => ({ term: q.prompt, definition: firstCorrect(q.options) ?? q.acceptedAnswers?.[0] }))
          .filter((p) => p.definition);
    return pairs.map((p) => ({ term: p.term, definition: p.definition }));
  }
  if (tpl === "anagram" || tpl === "open_the_box") {
    const words = input.words?.length
      ? input.words
      : (input.quiz?.questions ?? []).map((q) => firstCorrect(q.options) ?? q.acceptedAnswers?.[0] ?? q.prompt);
    return words.map((w) => ({ word: w }));
  }
  if (tpl === "group_sort") {
    const rows = [];
    (input.groups ?? []).forEach((g) => g.items.forEach((item) => rows.push({ group: g.name, item })));
    return rows;
  }
  return [];
}

const rows = rowsFor(template);
if (rows.length === 0) {
  fail("no-content", "input.json 沒有此模板可用的內容（quiz/pairs/words/groups）。先用 build-content.mjs 檢視轉換結果。");
  process.exit(1);
}

const experimental = !["quiz", "match_up"].includes(template);

const { context, page } = await openSession(PLATFORM);
try {
  await page.goto("https://wordwall.net/create", { waitUntil: "domcontentloaded" });
  if (/\/login/i.test(page.url())) {
    fail("not-logged-in", "尚未登入 Wordwall。請先執行 node scripts/pw/login.mjs。");
    await context.close();
    process.exit(1);
  }

  await clickFirst(page, [(p) => p.getByText(TEMPLATE_LABEL[template])], `template ${template}`, 15000);

  if (title) {
    const titleInput = page.locator('input[placeholder*="title" i], input[name*="title" i]').first();
    try {
      await titleInput.waitFor({ state: "visible", timeout: 8000 });
      await titleInput.fill(title);
    } catch {
      // some editors set title on save
    }
  }

  // Type items row by row. The editor exposes stacked text inputs; we fill in
  // order and add rows as needed. Any structural mismatch stops immediately.
  let filled = 0;
  const inputs = () => page.locator('[data-testid*="content"] input, [class*="content-editor"] input, textarea, input[type="text"]');
  for (const row of rows) {
    const cells = Object.values(row).filter((v) => v !== undefined && v !== "" && !Array.isArray(v));
    const answers = Array.isArray(row.answers) ? row.answers : [];
    const values = [...cells.filter((c) => typeof c === "string"), ...answers];
    try {
      for (const value of values) {
        const available = await inputs().count();
        if (available <= filled) {
          await clickFirst(page, [(p) => p.getByRole("button", { name: /add (item|row|content)/i })], "add row", 5000);
        }
        await inputs().nth(filled).fill(String(value));
        filled += 1;
      }
    } catch (err) {
      await handoff(PLATFORM, page, "editor-selector-failure", {
        filledCells: filled,
        hint: "Wordwall 編輯器欄位不符（介面易改版）。內容已存於 build-content.mjs 的 .txt，請人工貼入後按 Done。",
        error: String(err?.message ?? err),
      });
      await context.close();
      process.exit(1);
    }
  }

  // Finish → activity URL. Do NOT auto-publish beyond Done; teacher reviews.
  await clickFirst(page, [(p) => p.getByRole("button", { name: /^done$|完成/i })], "Done", 15000);
  await page.waitForURL(/wordwall\.net\/(resource|myactivities|play)/i, { timeout: 30000 }).catch(() => {});

  ok({
    created: true,
    template,
    experimental: experimental || undefined,
    itemsFilled: rows.length,
    activityUrl: page.url(),
    next: "用 scripts/pw/set-assignment.mjs 設定指派並取得連結。",
  });
} catch (err) {
  const msg = String(err?.message ?? err);
  if (msg.startsWith("selector-failure")) {
    await handoff(PLATFORM, page, msg, {
      hint: "模板或編輯器選擇器不符。請人工在 wordwall.net/create 建活動，內容用 build-content.mjs 的 .txt 貼入。",
    });
  } else {
    await failWithDiagnostics(PLATFORM, page, msg, "建活動失敗。請確認登入狀態後重試一次。");
  }
} finally {
  await context.close();
}
