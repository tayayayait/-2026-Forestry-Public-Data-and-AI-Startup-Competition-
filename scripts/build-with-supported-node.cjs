const { existsSync, readdirSync } = require("node:fs");
const { join, delimiter } = require("node:path");
const { spawnSync } = require("node:child_process");

const args = process.argv.slice(2);
const viteBin = join(__dirname, "..", "node_modules", "vite", "bin", "vite.js");

function parseMajor(version) {
  return Number.parseInt(version.replace(/^v/, "").split(".")[0] ?? "", 10);
}

function parseVersionTuple(dirName) {
  return dirName
    .replace(/^v/, "")
    .split(".")
    .map((part) => Number.parseInt(part, 10));
}

function compareVersionDesc(left, right) {
  const a = parseVersionTuple(left);
  const b = parseVersionTuple(right);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const diff = (b[index] ?? 0) - (a[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function findWindowsNvmNode22() {
  const nvmHome = process.env.NVM_HOME;
  if (!nvmHome || !existsSync(nvmHome)) return null;

  const candidateDir = readdirSync(nvmHome, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^v22\./.test(entry.name))
    .map((entry) => entry.name)
    .sort(compareVersionDesc)[0];

  if (!candidateDir) return null;

  const nodePath = join(nvmHome, candidateDir, "node.exe");
  return existsSync(nodePath) ? nodePath : null;
}

function selectNode() {
  const major = parseMajor(process.version);
  if (process.platform === "win32" && major >= 24) {
    const node22 = findWindowsNvmNode22();
    if (node22) return node22;

    console.error(
      "Build requires Node 20-23 on Windows. Node 24 crashes in the Vite/Rollup build path, and no nvm Node 22 install was found.",
    );
    process.exit(1);
  }

  return process.execPath;
}

const nodePath = selectNode();
const nodeDir = join(nodePath, "..");
const result = spawnSync(nodePath, [viteBin, ...args], {
  stdio: "inherit",
  env: {
    ...process.env,
    PATH: `${nodeDir}${delimiter}${process.env.PATH ?? ""}`,
  },
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
