#!/usr/bin/env node
// Fetch oEmbed metadata for a published Wordwall activity (the only public
// read API). Read-only, unauthenticated.
// Ported from edu-agent-kit packages/adapters/wordwall/src/oembed.ts @ a7eaa0f
// Usage: node scripts/get-oembed.mjs <activity-url> [--format json|xml]
export const WORDWALL_OEMBED_ENDPOINT = "https://wordwall.net/about/oembed";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const out = (o) => console.log(JSON.stringify(o));
const url = process.argv[2];
const format = arg("format") ?? "json";
if (!url) {
  out({ ok: false, error: "usage", hint: "node scripts/get-oembed.mjs <activity-url> [--format json|xml]" });
  process.exit(1);
}
try {
  const u = new URL(WORDWALL_OEMBED_ENDPOINT);
  u.searchParams.set("url", url);
  u.searchParams.set("format", format);
  const res = await fetch(u, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`oEmbed ${res.status}`);
  const data = format === "json" ? await res.json() : await res.text();
  out({ ok: true, oembed: data });
} catch (err) {
  out({ ok: false, error: String(err?.message ?? err), hint: "確認是已發布的 Wordwall 活動 URL（wordwall.net/resource/...）。" });
  process.exit(1);
}
