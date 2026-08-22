import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const scanRoots = ["src", "scripts", "test", ".github/workflows"];
const rootFiles = [
  "package.json",
  "tsconfig.json",
  "next.config.ts",
  "eslint.config.mjs",
  "postcss.config.mjs",
  "vercel.ts",
];
const textExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".css", ".json", ".yml", ".yaml"]);

async function collectFiles(path) {
  const absolute = join(root, path);

  try {
    const info = await stat(absolute);
    if (info.isFile()) return [path];
  } catch {
    return [];
  }

  const entries = await readdir(absolute, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(child)));
    else if (entry.isFile() && textExtensions.has(extname(entry.name))) files.push(child);
  }

  return files;
}

const files = [
  ...new Set([
    ...rootFiles,
    ...(await Promise.all(scanRoots.map(collectFiles))).flat(),
  ]),
].sort();

const failures = [];

for (const file of files) {
  const content = await readFile(join(root, file), "utf8");
  const display = relative(root, join(root, file));

  if (content.includes("\r")) failures.push(`${display}: use LF line endings`);
  if (content.length > 0 && !content.endsWith("\n")) failures.push(`${display}: add a final newline`);

  content.split("\n").forEach((line, index) => {
    if (/[ \t]+$/.test(line)) failures.push(`${display}:${index + 1}: trailing whitespace`);
  });
}

if (failures.length > 0) {
  console.error("Format hygiene check failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Format hygiene check passed for ${files.length} files.`);
