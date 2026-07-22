#!/usr/bin/env node
// Build Wordwall paste-ready content (.csv + .txt) for a template.
// Ported from edu-agent-kit packages/adapters/wordwall/src/content.ts @ a7eaa0f
// Usage: node scripts/build-content.mjs <input.json> --template quiz|match_up|anagram|group_sort|open_box_or_wheel|true_false|matching_pairs|find_the_match|flash_cards|speaking_cards|complete_the_sentence --out-dir <dir> [--bom]
// input.json matches WordwallContentInput: {title?, quiz?, pairs?, words?, groups?, sentences?}
//
// Template coverage expanded (post-Playwright-removal focus: this is now the
// only capability lever, since there is no more automated fill-in). The five
// original templates (quiz/match_up/anagram/group_sort/open_box_or_wheel) are
// each backed by a distinct Wordwall editor DOM family; the newly added ones
// below share the SAME content shape as one of those five (term/definition
// pairs, or a flat word list, or a sentence-with-blank) — so they reuse the
// existing helpers rather than introducing new logic. Not live-verified
// against each template's own Wordwall editor (that would require Playwright,
// which this skill no longer drives) — flagged as `experimental` in the
// output so the teacher double-checks the pasted result once in the editor.
import { promises as fs } from "node:fs";
import path from "node:path";
import { WordwallContentInput } from "./lib/models.mjs";

const TEMPLATES = [
  "quiz",
  "match_up",
  "anagram",
  "group_sort",
  "open_box_or_wheel",
  "true_false",
  "matching_pairs",
  "find_the_match",
  "flash_cards",
  "speaking_cards",
  "complete_the_sentence",
];
// Templates whose paste format is byte-identical to an already-verified one.
const ALIAS_OF = {
  matching_pairs: "match_up",
  find_the_match: "match_up",
  flash_cards: "match_up",
  speaking_cards: "open_box_or_wheel",
};
const VERIFIED_TEMPLATES = new Set(["quiz", "match_up"]);

function csvField(value) {
  const v = value ?? "";
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}
const csvRow = (fields) => fields.map(csvField).join(",");
const firstCorrect = (options) => options.find((o) => o.correct)?.text;

function pairsFromQuiz(quiz, warnings) {
  const pairs = [];
  quiz.questions.forEach((q, idx) => {
    const definition = firstCorrect(q.options) ?? q.acceptedAnswers[0];
    if (definition) pairs.push({ term: q.prompt, definition });
    else warnings.push(`Q${idx + 1}: no correct option/accepted answer — skipped for match_up.`);
  });
  return pairs;
}
function wordsFromQuiz(quiz) {
  const words = [];
  for (const q of quiz.questions) {
    const w = firstCorrect(q.options) ?? q.acceptedAnswers[0] ?? q.prompt;
    if (w) words.push(w);
  }
  return words;
}
// true_false: derive a boolean answer per question the same way
// tw-wayground-skill's build-xlsx.mjs does (an option whose text reads as
// "true"), rather than requiring a separate input shape.
function trueFalseFromQuiz(quiz, warnings) {
  const rows = [];
  quiz.questions.forEach((q, idx) => {
    const correctIsTrue = q.options.some(
      (o) => o.correct && /^(true|t|是|對|正確)$/i.test(o.text.trim()),
    );
    const hasAnyCorrect = q.options.some((o) => o.correct);
    if (!hasAnyCorrect) {
      warnings.push(`Q${idx + 1}: no option marked correct — true_false needs a True/False answer.`);
      return;
    }
    rows.push({ prompt: q.prompt, answer: correctIsTrue ? "True" : "False" });
  });
  return rows;
}
// complete_the_sentence / missing_word: a sentence containing a blank plus
// its answer. Falls back to deriving from quiz questions whose prompt already
// contains a blank marker.
function sentencesFromQuiz(quiz, warnings) {
  const sentences = [];
  quiz.questions.forEach((q, idx) => {
    const hasBlank = /_{2,}|\[blank\]/i.test(q.prompt);
    const answer = firstCorrect(q.options) ?? q.acceptedAnswers[0];
    if (hasBlank && answer) sentences.push({ text: q.prompt, answer });
    else warnings.push(`Q${idx + 1}: complete_the_sentence 需要題幹含底線空格（如 ___）且有正解，已略過。`);
  });
  return sentences;
}

export function buildWordwallContent(input, template) {
  const warnings = [];
  const title = input.title ?? input.quiz?.title ?? "Wordwall activity";
  const csvLines = [];
  const txtLines = [`# ${title}`, `Template: ${template}`, ""];
  const effective = ALIAS_OF[template] ?? template;

  switch (effective) {
    case "quiz": {
      const quiz = input.quiz;
      csvLines.push(csvRow(["question", "answers", "correct"]));
      if (!quiz) {
        warnings.push("quiz template requires `quiz`; produced empty content.");
        break;
      }
      quiz.questions.forEach((q, idx) => {
        const answers = q.options.map((o) => o.text);
        const correct = q.options.filter((o) => o.correct).map((o) => o.text);
        if (answers.length === 0) {
          const accepted = q.acceptedAnswers;
          csvLines.push(csvRow([q.prompt, accepted.join(" | "), accepted.join(" | ")]));
          if (accepted.length === 0) warnings.push(`Q${idx + 1}: no options or accepted answers.`);
        } else {
          csvLines.push(csvRow([q.prompt, answers.join(" | "), correct.join(" | ")]));
          if (correct.length === 0) warnings.push(`Q${idx + 1}: no option marked correct.`);
        }
        txtLines.push(`Q${idx + 1}. ${q.prompt}`);
        answers.forEach((a, i) => {
          const mark = q.options[i]?.correct ? " (correct)" : "";
          txtLines.push(`  ${String.fromCharCode(97 + i)}) ${a}${mark}`);
        });
        if (answers.length === 0 && q.acceptedAnswers.length > 0) {
          txtLines.push(`  answer: ${q.acceptedAnswers.join(" / ")}`);
        }
        txtLines.push("");
      });
      break;
    }
    case "match_up": {
      const pairs =
        input.pairs?.length ? input.pairs : input.quiz ? pairsFromQuiz(input.quiz, warnings) : [];
      if (pairs.length === 0) warnings.push("match_up template requires `pairs` or a `quiz`; produced empty content.");
      csvLines.push(csvRow(["term", "definition"]));
      pairs.forEach((p, idx) => {
        csvLines.push(csvRow([p.term, p.definition]));
        txtLines.push(`${idx + 1}. ${p.term}  ↔  ${p.definition}`);
      });
      break;
    }
    case "anagram": {
      const words = input.words?.length ? input.words : input.quiz ? wordsFromQuiz(input.quiz) : [];
      if (words.length === 0) warnings.push("anagram template requires `words` or a `quiz`; produced empty content.");
      csvLines.push(csvRow(["word"]));
      words.forEach((w, idx) => {
        csvLines.push(csvRow([w]));
        txtLines.push(`${idx + 1}. ${w}`);
      });
      break;
    }
    case "group_sort": {
      const groups = input.groups ?? [];
      if (groups.length === 0) warnings.push("group_sort template requires `groups`; produced empty content.");
      csvLines.push(csvRow(["group", "item"]));
      groups.forEach((g) => {
        txtLines.push(`Group: ${g.name}`);
        if (g.items.length === 0) warnings.push(`Group "${g.name}" has no items.`);
        g.items.forEach((item) => {
          csvLines.push(csvRow([g.name, item]));
          txtLines.push(`  - ${item}`);
        });
        txtLines.push("");
      });
      break;
    }
    case "open_box_or_wheel": {
      const items = input.words?.length ? input.words : input.quiz ? wordsFromQuiz(input.quiz) : [];
      if (items.length === 0) warnings.push("open_box_or_wheel/speaking_cards template requires `words` or a `quiz`; produced empty content.");
      csvLines.push(csvRow(["item"]));
      items.forEach((item, idx) => {
        csvLines.push(csvRow([item]));
        txtLines.push(`${idx + 1}. ${item}`);
      });
      break;
    }
    case "true_false": {
      const rows = input.quiz ? trueFalseFromQuiz(input.quiz, warnings) : [];
      if (rows.length === 0) warnings.push("true_false template requires a `quiz` with a correct option per question; produced empty content.");
      csvLines.push(csvRow(["question", "answer"]));
      rows.forEach((r, idx) => {
        csvLines.push(csvRow([r.prompt, r.answer]));
        txtLines.push(`${idx + 1}. ${r.prompt}  →  ${r.answer}`);
      });
      break;
    }
    case "complete_the_sentence": {
      const sentences = input.sentences?.length
        ? input.sentences
        : input.quiz
          ? sentencesFromQuiz(input.quiz, warnings)
          : [];
      if (sentences.length === 0) warnings.push("complete_the_sentence template requires `sentences` or a `quiz` with blank-marked prompts; produced empty content.");
      csvLines.push(csvRow(["sentence", "answer"]));
      sentences.forEach((s, idx) => {
        csvLines.push(csvRow([s.text, s.answer]));
        txtLines.push(`${idx + 1}. ${s.text}  (答案: ${s.answer})`);
      });
      break;
    }
    default:
      throw new Error(`Unsupported Wordwall template: ${template}`);
  }

  // Note: checked against the literal requested `template`, not the resolved
  // `effective` shape — an alias (e.g. matching_pairs) reuses match_up's
  // content shape, but that doesn't mean matching_pairs's OWN Wordwall editor
  // screen has been live-verified, so aliases stay experimental regardless.
  if (!VERIFIED_TEMPLATES.has(template)) {
    warnings.push(`「${template}」的貼上格式尚未針對 Wordwall 該模板的編輯器實測驗證，屬 experimental；貼入後請老師核對欄位對應是否正確。`);
  }

  return {
    csv: csvLines.join("\n") + "\n",
    txt: txtLines.join("\n").trimEnd() + "\n",
    warnings,
    experimental: !VERIFIED_TEMPLATES.has(template),
  };
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const out = (o) => console.log(JSON.stringify(o));

// CLI entry point only — guarded so `buildWordwallContent` can be imported
// (e.g. by tests/build-content.test.mjs) without triggering argv parsing.
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const inputFile = process.argv[2];
  const template = arg("template");
  const outDir = arg("out-dir") ?? ".";
  // UTF-8 BOM prefix so Excel opens Chinese-text CSVs correctly instead of
  // mojibake — off by default (plain .txt paste doesn't need it; only opt in
  // when the teacher will actually open the .csv in Excel).
  const useBom = process.argv.includes("--bom");

  if (!inputFile || !TEMPLATES.includes(template)) {
    out({ ok: false, error: "usage", hint: `node scripts/build-content.mjs <input.json> --template ${TEMPLATES.join("|")} --out-dir <dir> [--bom]` });
    process.exit(1);
  }
  try {
    const raw = JSON.parse(await fs.readFile(inputFile, "utf8"));
    // Ergonomic: accept a bare Quiz (has top-level `questions`) and wrap it as {quiz}.
    const wrapped =
      raw && Array.isArray(raw.questions) && !raw.quiz && !raw.pairs && !raw.words && !raw.groups && !raw.sentences
        ? { title: raw.title, quiz: raw }
        : raw;
    const input = WordwallContentInput.parse(wrapped);
    const { csv, txt, warnings, experimental } = buildWordwallContent(input, template);
    const slug = (input.title ?? input.quiz?.title ?? "wordwall").replace(/[^\w一-鿿]+/g, "_").slice(0, 40);
    await fs.mkdir(outDir, { recursive: true });
    const csvPath = path.join(outDir, `${slug}.csv`);
    const txtPath = path.join(outDir, `${slug}.txt`);
    await fs.writeFile(csvPath, useBom ? "﻿" + csv : csv, "utf8");
    await fs.writeFile(txtPath, txt, "utf8");
    out({
      ok: true,
      template,
      experimental: experimental || undefined,
      csvPath: path.resolve(csvPath),
      txtPath: path.resolve(txtPath),
      warnings,
    });
  } catch (err) {
    const hint = err?.issues
      ? `input.json 格式錯誤（欄位：${err.issues.map((i) => i.path.join(".")).join("、")}）。對照 scripts/lib/models.mjs 的 WordwallContentInput（title?/quiz?/pairs?/words?/groups?/sentences?）。`
      : "請確認 input.json 可解析。";
    out({ ok: false, error: String(err?.message ?? err), hint });
    process.exit(1);
  }
}
