// Generator-correctness tests (replaces the pre-reduction browser-automation
// test suite — there is no more browser layer to test; the file generator is
// now the entire product surface).
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildWordwallContent } from "../scripts/build-content.mjs";
import { WordwallContentInput } from "../scripts/lib/models.mjs";

const quiz = {
  title: "光合作用小測驗",
  questions: [
    {
      type: "multiple_choice",
      prompt: "光合作用主要發生在植物細胞的哪個構造？",
      options: [
        { text: "葉綠體", correct: true },
        { text: "粒線體", correct: false },
      ],
    },
    {
      type: "true_false",
      prompt: "植物在黑暗中也能進行光合作用。",
      options: [
        { text: "True", correct: false },
        { text: "False", correct: true },
      ],
    },
  ],
};

test("quiz template: verified, no experimental flag", () => {
  const input = WordwallContentInput.parse({ quiz });
  const { warnings, experimental } = buildWordwallContent(input, "quiz");
  assert.equal(experimental, false);
  assert.deepEqual(warnings, []);
});

test("match_up template: derives term/definition from quiz", () => {
  const input = WordwallContentInput.parse({ quiz });
  const { csv, experimental } = buildWordwallContent(input, "match_up");
  assert.equal(experimental, false);
  assert.match(csv, /葉綠體/);
});

test("true_false template: derives True/False answer from correct option", () => {
  const input = WordwallContentInput.parse({ quiz });
  const { csv, experimental } = buildWordwallContent(input, "true_false");
  assert.equal(experimental, true);
  assert.match(csv, /False/);
});

test("true_false template: warns when no option is marked correct", () => {
  const noAnswer = { title: "t", questions: [{ type: "true_false", prompt: "p", options: [{ text: "True", correct: false }] }] };
  const input = WordwallContentInput.parse({ quiz: noAnswer });
  const { warnings } = buildWordwallContent(input, "true_false");
  assert.ok(warnings.some((w) => w.includes("no option marked correct")));
});

test("alias templates (matching_pairs/find_the_match/flash_cards) reuse match_up shape", () => {
  const input = WordwallContentInput.parse({ quiz });
  const a = buildWordwallContent(input, "match_up");
  const b = buildWordwallContent(input, "matching_pairs");
  assert.equal(a.csv, b.csv);
  assert.equal(b.experimental, true);
});

test("speaking_cards alias reuses open_box_or_wheel shape", () => {
  const input = WordwallContentInput.parse({ quiz });
  const a = buildWordwallContent(input, "open_box_or_wheel");
  const b = buildWordwallContent(input, "speaking_cards");
  assert.equal(a.csv, b.csv);
});

test("complete_the_sentence: derives from quiz prompts containing a blank marker", () => {
  const blanked = { title: "t", questions: [{ type: "fill_blank", prompt: "光合作用需要 ___ 和水。", options: [{ text: "陽光", correct: true }] }] };
  const input = WordwallContentInput.parse({ quiz: blanked });
  const { csv, warnings } = buildWordwallContent(input, "complete_the_sentence");
  assert.match(csv, /陽光/);
  assert.equal(warnings.length, 1); // only the experimental notice, no skip warning
});

test("complete_the_sentence: warns and skips prompts without a blank marker", () => {
  const input = WordwallContentInput.parse({ quiz });
  const { warnings } = buildWordwallContent(input, "complete_the_sentence");
  assert.ok(warnings.some((w) => w.includes("已略過")));
});

test("CSV field escaping quotes commas and embedded quotes", () => {
  const withComma = { title: "t", questions: [{ type: "multiple_choice", prompt: "Q, with comma", options: [{ text: 'has "quotes"', correct: true }] }] };
  const input = WordwallContentInput.parse({ quiz: withComma });
  const { csv } = buildWordwallContent(input, "quiz");
  assert.match(csv, /"Q, with comma"/);
  assert.match(csv, /""quotes""/);
});

test("empty input parses (all fields optional) but produces an empty-content warning", () => {
  const empty = WordwallContentInput.parse({});
  assert.equal(empty.quiz, undefined);
  const { warnings } = buildWordwallContent(empty, "quiz");
  assert.ok(warnings.some((w) => w.includes("requires `quiz`")));
});
