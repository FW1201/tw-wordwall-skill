#!/usr/bin/env node
// Create a Wordwall activity by typing items into the editor (no bulk-import API).
// Live-verified 2026-07-22 against a real logged-in session: content fields are
// NOT <input> elements — they are contenteditable divs (`.js-item-input`) inside
// a per-question container (`.js-item`). See references/flows.md.
// v1 fully verified for quiz. match_up/group_sort/anagram/open_the_box reuse the
// same item-input pattern but are unverified — flagged `experimental`.
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

// Flatten input into ordered "items": for quiz, {prompt, answers[], correctIndex};
// for other templates, {texts: [...]} — a flat list of cell values, no correctness.
function itemsFor(tpl) {
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
    return pairs.map((p) => ({ texts: [p.term, p.definition] }));
  }
  if (tpl === "anagram" || tpl === "open_the_box") {
    const words = input.words?.length
      ? input.words
      : (input.quiz?.questions ?? []).map((q) => firstCorrect(q.options) ?? q.acceptedAnswers?.[0] ?? q.prompt);
    return words.map((w) => ({ texts: [w] }));
  }
  if (tpl === "group_sort") {
    const rows = [];
    (input.groups ?? []).forEach((g) => g.items.forEach((item) => rows.push({ texts: [g.name, item] })));
    return rows;
  }
  return [];
}

const items = itemsFor(template);
if (items.length === 0) {
  fail("no-content", "input.json 沒有此模板可用的內容（quiz/pairs/words/groups）。先用 build-content.mjs 檢視轉換結果。");
  process.exit(1);
}

const experimental = template !== "quiz";

const { context, page } = await openSession(PLATFORM);
try {
  await page.goto("https://wordwall.net/create", { waitUntil: "domcontentloaded" });
  if (/\/login/i.test(page.url())) {
    fail("not-logged-in", "尚未登入 Wordwall。請先執行 node scripts/pw/login.mjs。");
    await context.close();
    process.exit(1);
  }

  // Cookie consent banner (verified 2026-07-22): dismiss with "Reject all",
  // the more privacy-preserving choice. Not fatal if absent (already dismissed).
  try {
    await page.getByRole("button", { name: /reject all/i }).click({ timeout: 5000 });
  } catch {
    // banner not shown this session
  }

  await clickFirst(page, [(p) => p.getByText(TEMPLATE_LABEL[template])], `template ${template}`, 15000);
  await page.waitForURL(/wordwall\.net\/create\/entercontent/i, { timeout: 15000 });

  if (title) {
    const titleInput = page.locator(".js-activity-title").first();
    await titleInput.waitFor({ state: "visible", timeout: 8000 });
    await titleInput.fill(title);
  }

  // Each question/row lives in its own `.js-item` container. The template
  // starts with exactly one empty item; add more with `.js-editor-add-item`
  // (page-scoped — always appends at the end).
  const questionBoxes = () => page.locator(".js-item");

  for (let i = 0; i < items.length; i += 1) {
    if (i > 0) {
      const addItem = page.locator(".js-editor-add-item").first();
      await addItem.waitFor({ state: "visible", timeout: 8000 });
      await addItem.click();
    }
    const box = questionBoxes().nth(i);
    await box.waitFor({ state: "visible", timeout: 8000 });

    const cellTexts = items[i].prompt !== undefined ? [items[i].prompt, ...items[i].answers] : items[i].texts;

    // Ensure enough `.js-item-input` fields exist in this box (1 prompt + N
    // answers, or N flat cells for non-quiz templates); add via the box's own
    // "add answer" control when short.
    for (let want = 1; want <= cellTexts.length; want += 1) {
      const have = await box.locator(".js-item-input").count();
      if (have < want) {
        const addAnswer = box.locator(".js-editor-add-answer").first();
        await addAnswer.waitFor({ state: "visible", timeout: 5000 });
        await addAnswer.click();
      }
    }

    const fields = box.locator(".js-item-input");
    for (let c = 0; c < cellTexts.length; c += 1) {
      const value = cellTexts[c];
      if (value === undefined || value === "") continue;
      await fields.nth(c).click();
      await page.keyboard.type(String(value));
    }

    // Mark the correct answer (quiz only). `.js-question-check` toggles are
    // ordered per-answer within this box; index 0 corresponds to answer 1
    // (field index 1, since field 0 is the question prompt).
    if (items[i].correctIndex !== undefined && items[i].correctIndex >= 0) {
      const checks = box.locator(".js-question-check");
      const have = await checks.count();
      if (items[i].correctIndex < have) {
        await checks.nth(items[i].correctIndex).click();
      }
    }
  }

  await clickFirst(page, [(p) => p.locator(".js-done-button")], "Done", 15000);
  // If any question has no correct answer marked (e.g. an open-ended source
  // question forced into the quiz template), Wordwall confirms before
  // proceeding. Accept — the teacher's source data intentionally has no
  // correct option for that item; that's surfaced via build-content.mjs
  // warnings upstream, not something to block on here.
  try {
    await page.getByRole("button", { name: /^yes$/i }).click({ timeout: 4000 });
  } catch {
    // dialog didn't appear — all questions had a correct answer
  }
  await page.waitForURL(/wordwall\.net\/(resource|myactivities|play)/i, { timeout: 30000 }).catch(() => {});

  ok({
    created: true,
    template,
    experimental: experimental || undefined,
    itemsFilled: items.length,
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
