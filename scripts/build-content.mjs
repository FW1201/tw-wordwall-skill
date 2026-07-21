#!/usr/bin/env node
// Build Wordwall paste-ready content (.csv + .txt) for a template.
// Ported from edu-agent-kit packages/adapters/wordwall/src/content.ts @ a7eaa0f
// Usage: node scripts/build-content.mjs <input.json> --template quiz|match_up|anagram|group_sort|open_box_or_wheel --out-dir <dir>
// input.json matches WordwallContentInput: {title?, quiz?, pairs?, words?, groups?}
import { promises as fs } from "node:fs";
import path from "node:path";
import { WordwallContentInput } from "./lib/models.mjs";

const TEMPLATES = ["quiz", "match_up", "anagram", "group_sort", "open_box_or_wheel"];

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

export function buildWordwallContent(input, template) {
  const warnings = [];
  const title = input.title ?? input.quiz?.title ?? "Wordwall activity";
  const csvLines = [];
  const txtLines = [`# ${title}`, `Template: ${template}`, ""];

  switch (template) {
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
      if (items.length === 0) warnings.push("open_box_or_wheel template requires `words` or a `quiz`; produced empty content.");
      csvLines.push(csvRow(["item"]));
      items.forEach((item, idx) => {
        csvLines.push(csvRow([item]));
        txtLines.push(`${idx + 1}. ${item}`);
      });
      break;
    }
    default:
      throw new Error(`Unsupported Wordwall template: ${template}`);
  }

  return { csv: csvLines.join("\n") + "\n", txt: txtLines.join("\n").trimEnd() + "\n", warnings };
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const out = (o) => console.log(JSON.stringify(o));
const inputFile = process.argv[2];
const template = arg("template");
const outDir = arg("out-dir") ?? ".";

if (!inputFile || !TEMPLATES.includes(template)) {
  out({ ok: false, error: "usage", hint: `node scripts/build-content.mjs <input.json> --template ${TEMPLATES.join("|")} --out-dir <dir>` });
  process.exit(1);
}
try {
  const raw = JSON.parse(await fs.readFile(inputFile, "utf8"));
  // Ergonomic: accept a bare Quiz (has top-level `questions`) and wrap it as {quiz}.
  const wrapped =
    raw && Array.isArray(raw.questions) && !raw.quiz && !raw.pairs && !raw.words && !raw.groups
      ? { title: raw.title, quiz: raw }
      : raw;
  const input = WordwallContentInput.parse(wrapped);
  const { csv, txt, warnings } = buildWordwallContent(input, template);
  const slug = (input.title ?? input.quiz?.title ?? "wordwall").replace(/[^\w一-鿿]+/g, "_").slice(0, 40);
  await fs.mkdir(outDir, { recursive: true });
  const csvPath = path.join(outDir, `${slug}.csv`);
  const txtPath = path.join(outDir, `${slug}.txt`);
  await fs.writeFile(csvPath, csv, "utf8");
  await fs.writeFile(txtPath, txt, "utf8");
  out({ ok: true, template, csvPath: path.resolve(csvPath), txtPath: path.resolve(txtPath), warnings });
} catch (err) {
  const hint = err?.issues
    ? `input.json 格式錯誤（欄位：${err.issues.map((i) => i.path.join(".")).join("、")}）。對照 scripts/lib/models.mjs 的 WordwallContentInput（title?/quiz?/pairs?/words?/groups?）。`
    : "請確認 input.json 可解析。";
  out({ ok: false, error: String(err?.message ?? err), hint });
  process.exit(1);
}
