# threat-intel-agent

A threat intelligence analyst you run from your laptop. Built on [OpenCode](https://opencode.ai) as the agent harness and Anthropic Claude as the model. It pulls authoritative vulnerability feeds and vendor research, scores them against *your* environment, writes briefs with a "so what" per item, and enriches indicators on demand.

Threat news is a commodity. This turns it into intelligence by joining public feeds to a private watchlist that never leaves your machine.

## How it works

```
/brief 7
  └─ reads context/watchlist.yaml          (your private scope)
  └─ kev    → CISA Known Exploited Vulns, last 7 days
  └─ epss   → exploit probability per CVE
  └─ rss    → vendor research + press, last 7 days
  └─ scores: KEV ∧ EPSS ∧ watchlist match
  └─ report → reports/<date>-brief.md  .txt  .pdf

/cve CVE-2024-3400
  └─ nvd + epss + kev + rss → verdict, impact, affected, relevance
  └─ report → reports/CVE-2024-3400.md  .txt  .pdf

/enrich 203.0.113.7
  └─ virustotal + greynoise → verdict in chat (no file)
```

Design rules:

- **Tools are deterministic.** They fetch and normalize. No LLM inside a tool.
- **The model only reads, ranks, and writes.** Cheap, reproducible, auditable.
- **Public vs private split.** Feeds and code are shared; your watchlist, reports, and keys are gitignored.
- **Least privilege.** The agent cannot run shell commands or edit files. Reports exist only because the `report` tool writes them.

## Prerequisites

- macOS (Linux works; Windows via WSL untested)
- An Anthropic API key with a small credit balance — [console.anthropic.com](https://console.anthropic.com) → API Keys, then Billing
- [GitHub Desktop](https://desktop.github.com) if you don't use the git CLI

No Node, Python, or Homebrew required. OpenCode bundles its own runtime.

## Setup

**1. Install OpenCode**

```
curl -fsSL https://opencode.ai/install | bash
```

If Terminal later says `command not found: opencode`, add it to your PATH permanently:

```
echo 'export PATH=$HOME/.opencode/bin:$PATH' >> ~/.zshrc
```

Close and reopen Terminal, then confirm with `opencode --version`.

**2. Get the repo**

GitHub Desktop → File → Clone Repository → paste this repo's URL.
Then Repository → Open in Terminal. Every command below runs in that window.

**3. Connect your Anthropic key**

```
opencode auth login
```

Choose Anthropic, paste the key. It is stored outside the repo and never committed.

**4. Create your private watchlist**

```
cp context/example/watchlist.yaml context/watchlist.yaml
```

Edit `context/watchlist.yaml` with the vendors, products, sectors, and threat actors you care about. This file is gitignored.

**4b. (Optional) Add enrichment keys — see [Enrichment](#enrichment-virustotal--greynoise) below.** `/brief` and `/cve` work without them.

**5. Run it**

```
opencode
```

Then type:

```
/brief
```

Your report lands in `reports/` as `.md`, `.txt`, and `.pdf`.

## Usage

| Command | What it does | Output |
|---|---|---|
| `/brief` | Daily brief, 7-day lookback | `reports/<date>-brief.{md,txt,pdf}` |
| `/brief 14` | Same, 14-day lookback | same |
| `/cve CVE-2024-3400` | Single-CVE assessment with a patch verdict | `reports/CVE-2024-3400.{md,txt,pdf}` |
| `/enrich <indicator>` | IP, domain, URL, or hash reputation | in chat only |
| "use the kev tool for the last 30 days" | Call any tool directly | in chat |
| "what did Unit 42 publish this week about Ivanti" | Free-form; the model picks tools | in chat |

Ask it anything in plain English. The tools and rules in `AGENTS.md` shape how it answers.

## Enrichment: VirusTotal & GreyNoise

`/enrich` needs API keys. Both services have free tiers that are plenty for personal use.

**Get the keys (5 minutes)**

| Service | Sign up | Find your key | Free tier |
|---|---|---|---|
| VirusTotal | [virustotal.com](https://www.virustotal.com) → Sign up | Avatar (top right) → **API Key** | 500 lookups/day, 4/min |
| GreyNoise | [greynoise.io](https://www.greynoise.io) → Sign up | Account → **API Key** | 50 lookups/day |

**Add them to `.env`**

```
cp .env.example .env
```

Open `.env` and paste each key after its `=`, no quotes:

```
VT_API_KEY=your-virustotal-key
GREYNOISE_API_KEY=your-greynoise-key
NVD_API_KEY=
```

`.env` is gitignored. GitHub Desktop should **not** show it as a changed file — if it does, stop and fix `.gitignore` before committing. Keys are read at call time, so no restart is needed.

**Test**

```
/enrich 8.8.8.8
```

Expected: VirusTotal reports clean; GreyNoise classifies it as RIOT (a known benign service). Then try a hash or domain from a recent advisory to see the malicious path.

**What each service tells you**

- **VirusTotal** — how many AV engines flag it, threat label, tags, ASN, country. One engine is noise; ten is a detection.
- **GreyNoise** — whether an IP is mass-scanning the whole internet (background noise you can deprioritize) or a known-good service (RIOT). Answers "is this targeting *me*?"

**NVD key (optional)** — `/cve` works without one at 5 requests per 30 seconds. Request a free key at [nvd.nist.gov/developers/request-an-api-key](https://nvd.nist.gov/developers/request-an-api-key) to raise that to 50 if you hit rate limits.

## Model

Pinned in `opencode.json` so everyone gets consistent output. Change it with `/models` inside OpenCode, then update the `model` field. Avoid models labeled **Fast** — that is a separate speed tier most accounts don't have enabled and it will fail with a rate-limit error.

## Project layout

```
threat-intel-agent/
├── AGENTS.md                 # persona, analytic standards, output format
├── opencode.json             # model pin + permissions
├── .env.example              # copy to .env for API keys
├── .opencode/
│   ├── package.json          # one dependency: pdfkit
│   ├── lib/env.ts            # reads .env, finds repo root (not a tool)
│   ├── tools/
│   │   ├── kev.ts            # CISA KEV: recent additions or CVE lookup
│   │   ├── epss.ts           # FIRST EPSS scores
│   │   ├── nvd.ts            # full CVE record from NVD
│   │   ├── rss.ts            # vendor research + press feeds
│   │   ├── virustotal.ts     # IP / domain / URL / hash reputation
│   │   ├── greynoise.ts      # IP noise vs known-benign
│   │   └── report.ts         # writes .md + .txt + .pdf
│   └── commands/
│       ├── brief.md          # /brief
│       ├── cve.md            # /cve
│       └── enrich.md         # /enrich
├── context/
│   ├── example/watchlist.yaml   # template (committed)
│   └── watchlist.yaml           # yours (gitignored)
└── reports/                  # generated briefs (gitignored)
```

`.opencode` is a hidden folder. In Finder press `Cmd+Shift+.` to see it; VS Code shows it by default.

## Scoring

Priority, highest first:

1. On CISA KEV — it is being exploited, full stop
2. EPSS ≥ 0.5 — likely to be exploited within 30 days
3. Matches your watchlist — it affects something you run
4. Everything else

Known ransomware use is flagged on every item.

## Sources

| Source | Type | Auth |
|---|---|---|
| [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) | Exploited-in-the-wild list | none |
| [FIRST EPSS](https://www.first.org/epss/) | Exploit probability | none |
| [NVD](https://nvd.nist.gov) | CVE details, CVSS, CPE | optional key |
| RSS: CISA advisories, Unit 42, Talos, Microsoft Security, Google TI, Huntress, BleepingComputer, The Record, Krebs | Research + press | none |
| [VirusTotal](https://www.virustotal.com) | Indicator reputation | key |
| [GreyNoise](https://www.greynoise.io) | IP scanning classification | key |

Edit the feed list at the top of `.opencode/tools/rss.ts`. Planned: GitHub Security Advisories, urlscan.io, Shodan.

## Adding a tool

Create `.opencode/tools/<name>.ts`. The filename becomes the tool name.

```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "One sentence: what it returns and when to use it",
  args: {
    query: tool.schema.string().describe("What the model should pass in"),
  },
  async execute(args) {
    const res = await fetch(`https://example.com/api?q=${args.query}`)
    return JSON.stringify(await res.json(), null, 2)
  },
})
```

Then mention it in `AGENTS.md` under **Tools** so the model knows it exists. Use `args.x ?? default` rather than Zod `.default()` — OpenCode does not apply defaults to omitted args on custom tools.

Tools needing API keys: `import { requireKey, root } from "../lib/env"` and call `requireKey(root(context), "MY_KEY")`. Add the key name to `.env.example`.

## Security posture

- `opencode.json` denies `bash` and all file edits; the only write path is the `report` tool, which can only touch `reports/`
- API keys live in `~/.local/share/opencode/auth.json` (Anthropic) and `.env` (enrichment), both outside version control
- Client-identifying context stays in gitignored files
- Tools only make outbound HTTPS calls to the feeds listed above — read the source before adding a new one

## Troubleshooting

| Symptom | Fix |
|---|---|
| `command not found: opencode` | PATH not set — see Setup step 1 |
| Rate limit of 0 tokens | You selected a **Fast** model — `/models`, pick the non-Fast version |
| Rate limit on a normal model | Check Billing at console.anthropic.com |
| Tool not appearing, or a fix "didn't work" | Tools load at startup — `Ctrl+C` and relaunch `opencode` |
| `VT_API_KEY not set` / `GREYNOISE_API_KEY not set` | Key missing from `.env` — see Enrichment |
| `Cannot locate repo root` | Run `export TI_ROOT=$PWD` in the repo folder, then relaunch `opencode` |
| Report tool error mentioning `/reports` at filesystem root | Old `lib/env.ts` — update it and restart |
| Can't save into `.opencode` | Open the repo folder in VS Code (File → Open Folder) and create files from the Explorer pane |

## Contributing

Fork, add a tool or source, open a PR. Keep tools deterministic and dependency-free where possible. Never commit a real watchlist, report, or key.

## License

MIT