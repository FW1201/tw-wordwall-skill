#!/usr/bin/env node
// One-command orchestrator for the Wordwall chain. Sequences the existing
// single-purpose scripts and stops at the FIRST failure — it does not
// re-implement any step. Two stages keep the one intentional human checkpoint
// (confirming assignment settings) as a single interaction:
//
//   node scripts/run.mjs <input.json> --stage prepare [--template quiz|match_up|group_sort|anagram|open_the_box]
//     create-activity (needs login). Prints activityUrl + a summary. NO
//     assignment created yet.
//
//   node scripts/run.mjs <input.json> --stage deliver --activity-url <url> \
//     [--named true|false] [--deadline DD/MM/YYYY]
//     set-assignment. Prints the final play/assignment link.
//
// Title comes from input.json's `title`; template defaults to quiz. The only
// manual steps are login (preflight) and confirming assignment settings.
import { promises as fs } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function out(obj) {
  console.log(JSON.stringify(obj));
}

function runScript(relPath, args) {
  const res = spawnSync(process.execPath, [path.join(HERE, relPath), ...args], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  const lines = (res.stdout ?? "").trim().split("\n").filter(Boolean);
  let parsed;
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      parsed = JSON.parse(lines[i]);
      break;
    } catch {
      // keep scanning upward for the JSON result line
    }
  }
  if (!parsed) {
    return {
      ok: false,
      error: "no-json-output",
      hint: `子腳本 ${relPath} 未輸出可解析的 JSON（exit ${res.status}）。stderr: ${(res.stderr ?? "").slice(0, 400)}`,
    };
  }
  return parsed;
}

const inputPath = process.argv[2];
const stage = arg("stage");
if (!inputPath || !["prepare", "deliver"].includes(stage)) {
  out({
    ok: false,
    error: "usage",
    hint: "node scripts/run.mjs <input.json> --stage prepare [--template quiz|match_up|...] | --stage deliver --activity-url <url> [--named][--deadline]",
  });
  process.exit(1);
}

try {
  const input = JSON.parse(await fs.readFile(inputPath, "utf8"));

  if (stage === "prepare") {
    const template = arg("template") ?? "quiz";
    const title = input.title ?? "Untitled";
    const created = runScript("pw/create-activity.mjs", [
      inputPath,
      "--template",
      template,
      "--title",
      title,
    ]);
    if (!created.ok) {
      out({ ok: false, stage, step: "create-activity", ...created });
      process.exit(1);
    }

    out({
      ok: true,
      stage: "prepare",
      activityUrl: created.activityUrl,
      title,
      template,
      confirm: {
        namedDefault: "false",
        note: "指派是否記名、期限（DD/MM/YYYY）由老師確認後帶入 deliver。",
      },
      next: `老師確認後執行：node scripts/run.mjs ${inputPath} --stage deliver --activity-url ${created.activityUrl} --named false`,
    });
    process.exit(0);
  }

  // stage === "deliver"
  const activityUrl = arg("activity-url");
  if (!activityUrl) {
    out({ ok: false, stage, error: "missing-activity-url", hint: "deliver 需要 --activity-url（來自 prepare 的輸出）。" });
    process.exit(1);
  }

  const assignArgs = ["--activity-url", activityUrl];
  const named = arg("named");
  if (named) assignArgs.push("--named", named);
  const deadline = arg("deadline");
  if (deadline) assignArgs.push("--deadline", deadline);

  const assigned = runScript("pw/set-assignment.mjs", assignArgs);
  if (!assigned.ok) {
    out({ ok: false, stage, step: "set-assignment", activityUrl, ...assigned });
    process.exit(1);
  }

  out({
    ok: true,
    stage: "deliver",
    activityUrl,
    assignmentUrl: assigned.assignmentUrl,
    note: "完整鏈完成。把 assignmentUrl 交給學生即可。",
  });
} catch (err) {
  out({
    ok: false,
    stage,
    error: String(err?.message ?? err),
    hint: "請確認 input.json 路徑與內容，以及先跑過 preflight 確認登入。",
  });
  process.exit(1);
}
