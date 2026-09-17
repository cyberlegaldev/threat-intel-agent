// Reads KEY=value pairs from <repo>/.env so tools can use API keys
// without OpenCode needing to know about them. Never commit .env.
import { readFileSync, existsSync } from "fs"
import path from "path"

// Repo root. Different OpenCode versions populate context.directory /
// context.worktree inconsistently (sometimes "" or "/"), so pick the first
// candidate that is a real directory containing our .opencode folder.
export function root(ctx: any): string {
  const candidates = [
    process.env.TI_ROOT,
    ctx?.directory,
    ctx?.worktree,
    process.cwd(),
  ].filter((p): p is string => !!p && p !== "/")
  for (const c of candidates) if (existsSync(path.join(c, ".opencode"))) return c
  throw new Error(
    `Cannot locate repo root. Saw directory=${JSON.stringify(ctx?.directory)} ` +
    `worktree=${JSON.stringify(ctx?.worktree)} cwd=${JSON.stringify(process.cwd())}. ` +
    `Set TI_ROOT=/path/to/threat-intel-agent in your shell as a workaround.`
  )
}

export function loadEnv(worktree: string): Record<string, string> {
  const out: Record<string, string> = {}
  try {
    const raw = readFileSync(path.join(worktree, ".env"), "utf8")
    for (const line of raw.split("\n")) {
      const t = line.trim()
      if (!t || t.startsWith("#")) continue
      const i = t.indexOf("=")
      if (i < 0) continue
      out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "")
    }
  } catch {}
  return out
}

export function requireKey(worktree: string, name: string): string {
  const v = loadEnv(worktree)[name] || process.env[name]
  if (!v) throw new Error(`${name} not set. Add it to .env (see .env.example).`)
  return v
}
