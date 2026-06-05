#!/usr/bin/env node
/**
 * Release via git tag — triggers GitHub Actions to build & push GHCR image.
 *
 * Usage:
 *   yarn deploy                  # auto bump patch from latest v* tag
 *   yarn deploy 0.4.70           # explicit version
 *   yarn deploy --message "msg"    # custom tag message
 */

const { readFileSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const { join } = require("node:path");

const root = join(__dirname, "..");

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { cwd: root, encoding: "utf8", ...opts });
}

function runInherit(cmd, args) {
  return spawnSync(cmd, args, { cwd: root, stdio: "inherit" });
}

function parseArgs(argv) {
  const args = { version: null, message: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--message" || argv[i] === "-m") {
      args.message = argv[++i];
    } else if (!argv[i].startsWith("-")) {
      args.version = argv[i].replace(/^v/, "");
    }
  }
  return args;
}

function parseVersion(v) {
  const m = String(v)
    .replace(/^v/, "")
    .match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3] };
}

function bumpPatch(v) {
  const p = parseVersion(v);
  if (!p) throw new Error(`Invalid version: ${v}`);
  return `${p.major}.${p.minor}.${p.patch + 1}`;
}

function getLatestTag() {
  run("git", ["fetch", "origin", "--tags"]);
  const r = run("git", ["tag", "-l", "v[0-9]*", "--sort=-v:refname"]);
  if (r.status !== 0) return null;
  return r.stdout.trim().split("\n").filter(Boolean)[0] || null;
}

function getDefaultMessage() {
  const r = run("git", ["log", "-1", "--pretty=%s"]);
  return r.stdout?.trim() || "release";
}

function getRemote() {
  const r = run("git", ["remote", "get-url", "origin"]);
  const m = r.stdout?.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, "") };
}

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const { version: explicit, message: explicitMsg } = parseArgs(process.argv);

const dirty = run("git", ["status", "--porcelain"]);
if (dirty.stdout.trim()) {
  console.error("Working tree not clean. Commit or stash changes first.");
  process.exit(1);
}

const latestTag = getLatestTag();
const base = latestTag ? latestTag.replace(/^v/, "") : pkg.version;
let version;
try {
  version = explicit || bumpPatch(base);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

if (!parseVersion(version)) {
  console.error(`Invalid version: ${version} (expected x.y.z)`);
  process.exit(1);
}

const tag = `v${version}`;
const msg = explicitMsg || getDefaultMessage();

if (run("git", ["rev-parse", tag]).status === 0) {
  console.error(`Tag ${tag} already exists.`);
  process.exit(1);
}

console.log(`Latest tag: ${latestTag || "(none)"}`);
console.log(`Releasing ${tag}: ${msg}`);

const branch = run("git", ["rev-parse", "--abbrev-ref", "HEAD"]).stdout.trim();
if (runInherit("git", ["push", "origin", branch]).status !== 0) process.exit(1);
if (runInherit("git", ["tag", "-a", tag, "-m", msg]).status !== 0) process.exit(1);
if (runInherit("git", ["push", "origin", tag]).status !== 0) process.exit(1);

const remote = getRemote();
if (remote) {
  const image = `ghcr.io/${remote.owner}/${remote.repo}`;
  console.log(`\nDone. GitHub Actions is building:`);
  console.log(`  ${image}:${version}`);
  console.log(`  ${image}:latest`);
  console.log(
    `\nTrack: https://github.com/${remote.owner}/${remote.repo}/actions`
  );
}
