import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);

/**
 * Static-only repository audit for Phase 1 evaluation.
 *
 * Clones a team's repo read-only (shallow, depth 1, no submodules, no LFS)
 * into an ephemeral tmp dir and inspects it as TEXT — file listing, tech
 * stack, README, rough size. We NEVER run install scripts, build commands,
 * or any code the team wrote: a hackathon submission is untrusted input,
 * and executing it would be arbitrary code execution on our server.
 */

const CLONE_TIMEOUT_MS = 25_000;
const MAX_FILES_LISTED = 400;
const MAX_FILE_READ_BYTES = 20_000;
const IGNORED_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", ".turbo", ".cache"]);

export type RepoAudit = {
  ok: boolean;
  summary: string;
  fileCount: number;
  techStack: string[];
  readmeExcerpt: string | null;
  /** Files whose text content looks like it's trying to manipulate an AI grader */
  suspiciousFiles: string[];
};

async function walk(dir: string, base: string, out: string[]) {
  if (out.length >= MAX_FILES_LISTED) return;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (out.length >= MAX_FILES_LISTED) return;
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full);
    if (entry.isDirectory()) {
      await walk(full, base, out);
    } else {
      out.push(rel);
    }
  }
}

function detectTechStack(files: string[]): string[] {
  const stack = new Set<string>();
  const has = (name: string) => files.some((f) => f.endsWith(name));
  if (has("package.json")) stack.add("Node.js");
  if (has("next.config.js") || has("next.config.ts") || has("next.config.mjs")) stack.add("Next.js");
  if (files.some((f) => f.endsWith(".tsx") || f.endsWith(".ts"))) stack.add("TypeScript");
  if (has("requirements.txt") || has("pyproject.toml")) stack.add("Python");
  if (has("Cargo.toml")) stack.add("Rust");
  if (has("go.mod")) stack.add("Go");
  if (has("Gemfile")) stack.add("Ruby");
  if (has("composer.json")) stack.add("PHP");
  if (files.some((f) => f.endsWith(".swift"))) stack.add("Swift");
  if (files.some((f) => f.endsWith(".kt"))) stack.add("Kotlin");
  if (has("Dockerfile")) stack.add("Docker");
  return [...stack];
}

// Patterns that suggest a file is trying to manipulate an AI grader rather
// than being legitimate project content — checked against raw text of
// README/config/source files pulled from the clone.
const INJECTION_PATTERNS = [
  /ignore (all |any )?(previous|prior|above) instructions/i,
  /you are (now |actually )?(a|an) (ai|llm|judge|evaluator|grader)/i,
  /give (this|the) (project|team|submission) (a |the )?(perfect|maximum|100|full) score/i,
  /score (this|it) (100|perfect|maximum)/i,
  /disregard (the )?(rubric|criteria|instructions)/i,
  /system prompt/i,
  /\bDAN\b.{0,20}(mode|prompt)/i,
  /act as (if )?(you|the ai)/i,
  /new instructions?:/i,
  /override (your |the )?(instructions|rules|guidelines)/i,
];

function scanForInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((re) => re.test(text));
}

export async function auditRepository(repositoryUrl: string): Promise<RepoAudit> {
  let tmpDir: string | null = null;
  try {
    tmpDir = await mkdtemp(path.join(/* turbopackIgnore: true */ tmpdir(), "vibe-repo-"));

    await execFileAsync(
      "git",
      [
        "clone",
        "--depth", "1",
        "--no-tags",
        "--single-branch",
        "--config", "core.hooksPath=/dev/null", // disable local hooks defensively
        repositoryUrl,
        tmpDir,
      ],
      { timeout: CLONE_TIMEOUT_MS, maxBuffer: 4 * 1024 * 1024 },
    );

    const files: string[] = [];
    await walk(tmpDir, tmpDir, files);

    const techStack = detectTechStack(files);

    const readmePath = files.find((f) => /^readme(\.(md|txt))?$/i.test(path.basename(f)));
    let readmeExcerpt: string | null = null;
    const suspiciousFiles: string[] = [];

    if (readmePath) {
      try {
        const content = await readFile(path.join(tmpDir, readmePath), "utf-8");
        readmeExcerpt = content.slice(0, 1500);
        if (scanForInjection(content)) suspiciousFiles.push(readmePath);
      } catch {
        /* unreadable, skip */
      }
    }

    // Scan a bounded set of small text-like files (configs, source) for
    // injection attempts. Skip binaries/large files entirely — we only ever
    // read text, never execute.
    const candidates = files
      .filter((f) => /\.(md|txt|json|ts|tsx|js|jsx|py|env|yml|yaml)$/i.test(f))
      .slice(0, 60);
    for (const rel of candidates) {
      if (rel === readmePath) continue;
      try {
        const full = path.join(tmpDir, rel);
        const info = await stat(full);
        if (info.size > MAX_FILE_READ_BYTES) continue;
        const content = await readFile(full, "utf-8");
        if (scanForInjection(content)) suspiciousFiles.push(rel);
      } catch {
        /* unreadable/binary, skip */
      }
    }

    const summary = `Dépôt cloné avec succès : ${files.length} fichier(s), stack détectée : ${techStack.join(", ") || "non identifiée"}.`;

    return { ok: true, summary, fileCount: files.length, techStack, readmeExcerpt, suspiciousFiles };
  } catch (err) {
    return {
      ok: false,
      summary: `Impossible de cloner le dépôt (${err instanceof Error ? err.message.split("\n")[0].slice(0, 150) : "erreur inconnue"}).`,
      fileCount: 0,
      techStack: [],
      readmeExcerpt: null,
      suspiciousFiles: [],
    };
  } finally {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
