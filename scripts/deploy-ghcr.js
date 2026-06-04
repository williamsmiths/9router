#!/usr/bin/env node
/**
 * Build and push Docker image to GHCR.
 * Usage: yarn deploy [-- tag]
 * Config: .env.deploy and/or env GHCR_OWNER, GHCR_TOKEN, GHCR_USER, PLATFORMS
 */

const { readFileSync, existsSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const { join } = require("node:path");

const root = join(__dirname, "..");

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function resolveGhcrToken() {
  if (process.env.GHCR_TOKEN) return process.env.GHCR_TOKEN;
  const gh = spawnSync("gh", ["auth", "token"], { encoding: "utf8" });
  if (gh.status === 0 && gh.stdout?.trim()) {
    return gh.stdout.trim();
  }
  return null;
}

loadEnvFile(join(root, ".env.deploy"));
loadEnvFile(join(root, ".env"));

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const tag = process.argv[2] || pkg.version;

const token = resolveGhcrToken();
if (!token) {
  console.error(
    "Missing GHCR_TOKEN. Set in .env.deploy or export it, or run: gh auth login"
  );
  process.exit(1);
}
process.env.GHCR_TOKEN = token;

if (!process.env.GHCR_OWNER) {
  const remote = spawnSync("git", ["remote", "get-url", "origin"], {
    cwd: root,
    encoding: "utf8",
  });
  const m = remote.stdout?.match(/github\.com[:/]([^/]+)\//);
  if (m) process.env.GHCR_OWNER = m[1];
}
process.env.GHCR_OWNER = process.env.GHCR_OWNER || "williamsmiths";

console.log(`Deploying ghcr.io/${process.env.GHCR_OWNER}/9router:${tag} ...`);

const run = spawnSync("bash", [join(root, "scripts", "build-ghcr.sh"), tag], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
});

process.exit(run.status ?? 1);
