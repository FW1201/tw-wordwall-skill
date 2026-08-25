#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WordwallContentInput } from "./lib/models.mjs";
import { validateAssessmentQuiz } from "./lib/assessment-quality.mjs";
import { runEdtechCli } from "./lib/edtech-cli.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
await runEdtechCli({
  platform: "wordwall",
  root,
  validate: async (input) => {
    const raw = JSON.parse(await readFile(input, "utf8"));
    const content = WordwallContentInput.parse(raw?.questions ? { title: raw.title, quiz: raw } : raw);
    return { title: content.title ?? content.quiz?.title ?? null, quality: content.quiz ? validateAssessmentQuiz(content.quiz) : { ok: true, status: "not-applicable", warnings: [{ code: "activity-brief-required" }] } };
  },
});
