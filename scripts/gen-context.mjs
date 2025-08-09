import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = process.cwd();
const outDir = path.join(root, "ai");
const outFile = path.join(outDir, "context.md");

function readJSON(fp) {
  try { return JSON.parse(fs.readFileSync(fp, "utf8")); } catch { return null; }
}
function readText(fp) {
  try { return fs.readFileSync(fp, "utf8"); } catch { return null; }
}
function git(cmd) {
  try { return execSync(`git ${cmd}`, { encoding: "utf8" }).trim(); } catch { return ""; }
}

const pkg = readJSON(path.join(root, "package.json"));
const readme = readText(path.join(root, "README.md"));
const envExample = readText(path.join(root, ".env.example")) || readText(path.join(root, ".env.sample"));
const tsconfig = readJSON(path.join(root, "tsconfig.json"));
const nextConfig = readText(path.join(root, "next.config.js")) || readText(path.join(root, "next.config.mjs")) || readText(path.join(root, "next.config.ts"));
const dockerfile = readText(path.join(root, "Dockerfile"));
const compose = readText(path.join(root, "docker-compose.yml"));
const routes = readText(path.join(root, "src/routes.ts")) || readText(path.join(root, "app/routes.ts"));
const n8n = readText(path.join(root, "n8n.json")) || readText(path.join(root, "n8n-workflows.json"));
const todo = readText(path.join(root, "TODO.md")) || readText(path.join(root, "docs/TODO.md"));

const branch = git("rev-parse --abbrev-ref HEAD");
const lastCommits = git(`log --pretty=format:"- %h %ad %s" --date=short -n 10`);
const changed = git("status --porcelain");

const now = new Date().toISOString();

const deps = pkg?.dependencies || {};
const devDeps = pkg?.devDependencies || {};
const scripts = pkg?.scripts || {};

function listFilesRecursive(dir) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) results.push(...listFilesRecursive(full));
      else results.push(full);
    }
  } catch {}
  return results;
}

function listDir(dir) {
  try { return fs.readdirSync(dir).map((n) => path.join(dir, n)); } catch { return []; }
}

// App Router discovery
const appDir = path.join(root, "src", "app");
const appFiles = listFilesRecursive(appDir);
const pageFiles = appFiles.filter((f) => /[/\\]page\.(tsx|ts|jsx|js)$/.test(f));
const apiRouteFiles = appFiles.filter((f) => /[/\\]route\.(ts|js)$/.test(f));

function computeRouteFromFile(fp) {
  const rel = path.relative(appDir, path.dirname(fp));
  if (!rel || rel === "") return "/";
  return "/" + rel.split(path.sep).join("/");
}

// n8n workflows summary (directory-based)
const n8nWorkflowsDir = path.join(root, "_docs", "aeo_n8n_workflows");
const n8nWorkflowFiles = listDir(n8nWorkflowsDir).filter((f) => f.endsWith(".json"));

// Supabase migrations summary
const migrationsDir = path.join(root, "supabase-migrations");
const migrationFiles = listDir(migrationsDir).filter((f) => f.endsWith(".sql"));

// Tests summary
const srcDir = path.join(root, "src");
const testFiles = listFilesRecursive(srcDir).filter((f) => /(\.test\.(ts|tsx|js|jsx)|[/\\]__tests__[/\\].*\.(ts|tsx|js|jsx))$/.test(f));

// Components directory snapshot (top level only)
const componentsDir = path.join(srcDir, "components");
let componentsSnapshot = [];
try {
  componentsSnapshot = fs.readdirSync(componentsDir, { withFileTypes: true })
    .map((d) => (d.isDirectory() ? d.name + "/" : d.name))
    .slice(0, 30);
} catch {}

const md = `# Project Context
_Last updated: ${now}_

## Overview
- Repo: ${path.basename(root)}
- Branch: ${branch}

## Tech Stack
${pkg ? `- Name: ${pkg.name}
- Version: ${pkg.version || "n/a"}
- Dependencies: ${Object.keys(deps).slice(0, 40).join(", ")}
- DevDependencies: ${Object.keys(devDeps).slice(0, 30).join(", ")}` : "- package.json not found"}

${tsconfig ? `\n## TypeScript
- TSConfig: ${tsconfig.compilerOptions ? "present" : "custom"}
${tsconfig.compilerOptions ? `- Strict: ${Boolean(tsconfig.compilerOptions.strict)}
- Module Resolution: ${tsconfig.compilerOptions.moduleResolution || "default"}
- Paths: ${tsconfig.compilerOptions.paths ? Object.keys(tsconfig.compilerOptions.paths).join(", ") : "(none)"}` : ""}
` : ""}

${nextConfig ? "## Next.js Config (excerpt)\n```ts\n" + nextConfig.slice(0, 1500) + "\n```\n" : ""}

${dockerfile ? "## Dockerfile\n```dockerfile\n" + dockerfile.slice(0, 800) + "\n```\n" : ""}
${compose ? "## docker-compose.yml\n```yaml\n" + compose.slice(0, 800) + "\n```\n" : ""}

${routes ? "## App Routes (excerpt)\n```ts\n" + routes.slice(0, 1200) + "\n```\n" : ""}

${n8n ? "## n8n Workflows (excerpt)\n```json\n" + n8n.slice(0, 1200) + "\n```\n" : ""}

${envExample ? "## Environment (from .env.example)\n```\n" + envExample.slice(0, 1000) + "\n```\n" : ""}

${todo ? "## TODO\n" + todo + "\n" : ""}

## Scripts
${Object.keys(scripts).length ? Object.entries(scripts).map(([k,v])=>`- \`${k}\`: ${v}`).join("\n") : "- (none)"}

${pageFiles.length || apiRouteFiles.length ? `\n## App Router\n- Pages (${pageFiles.length}):\n${pageFiles.map((f)=>`  - ${computeRouteFromFile(f)} (${path.relative(root, f)})`).join("\n")}\n- API Routes (${apiRouteFiles.length}):\n${apiRouteFiles.map((f)=>`  - ${computeRouteFromFile(f)} (${path.relative(root, f)})`).join("\n")}` : ""}

${componentsSnapshot.length ? `\n## Components Snapshot\n- ${componentsSnapshot.join("\n- ")}` : ""}

${n8nWorkflowFiles.length ? `\n## n8n Workflows\n- ${n8nWorkflowFiles.map((f)=>path.basename(f)).join("\n- ")}` : ""}

${migrationFiles.length ? `\n## Supabase Migrations (${migrationFiles.length})\n- ${migrationFiles.map((f)=>path.basename(f)).join("\n- ")}` : ""}

${testFiles.length ? `\n## Tests (${testFiles.length})\n- ${testFiles.map((f)=>path.relative(root, f)).slice(0, 50).join("\n- ")}\n${testFiles.length > 50 ? `- ...and ${testFiles.length - 50} more` : ""}` : ""}

## Recent Commits
${lastCommits || "- (none)"}

## Changed Files (not committed)
${changed ? "```\n" + changed + "\n```" : "- clean"}

`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, md, "utf8");
console.log(`Wrote ${outFile}`);