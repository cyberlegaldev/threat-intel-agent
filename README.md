# threat-intel-agent
# threat-intel-agent

A threat intelligence analyst you run from your laptop. Built on [OpenCode](https://opencode.ai) as the agent harness and Anthropic Claude as the model. It pulls authoritative vulnerability feeds, scores them against *your* environment, and writes a daily brief with a "so what" per item.

Threat news is a commodity. This turns it into intelligence by joining public feeds to a private watchlist that never leaves your machine.

## How it works

```
/brief
  └─ reads context/watchlist.yaml        (your private scope)
  └─ calls kev  → CISA Known Exploited Vulns (last N days)
  └─ calls epss → exploit probability per CVE
  └─ scores: KEV ∧ EPSS ∧ watchlist match
  └─ writes reports/YYYY-MM-DD.md
```

Design rules:

- **Tools are deterministic.** They fetch and normalize. No LLM inside a tool.
- **The model only reads, ranks, and writes.** Cheap, reproducible, auditable.
- **Public vs private split.** Feeds and code are shared; your watchlist, reports, and keys are gitignored.
- **Least privilege.** The agent cannot run shell commands and can only write to `reports/`.

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

**5. Run it**

```
opencode
```

Then type:

```
/brief
```

Your report lands in `reports/YYYY-MM-DD.md`.

## Usage

| Command | What it does |
|---|---|
| `/brief` | Daily brief, 7-day lookback |
| `/brief 14` | Same, 14-day lookback |
| "use the kev tool for the last 30 days" | Call a tool directly |
| "get EPSS for CVE-2024-3400" | Enrich a specific CVE |

Ask it anything in plain English. The tools and rules in `AGENTS.md` shape how it answers.

## Model

Pinned in `opencode.json` so everyone gets consistent output. Change it with `/models` inside OpenCode, then update the `model` field. Avoid models labeled **Fast** — that is a separate speed tier most accounts don't have enabled and it will fail with a rate-limit error.

## Project layout

```
threat-intel-agent/
├── AGENTS.md                 # persona, analytic standards, output format
├── opencode.json             # model pin + permissions
├── .opencode/
│   ├── tools/
│   │   ├── kev.ts            # CISA KEV feed
│   │   └── epss.ts           # FIRST EPSS scores
│   └── commands/
│       └── brief.md          # the /brief pipeline
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

Planned: NVD, vendor research RSS, GitHub Security Advisories, on-demand enrichment (VirusTotal, GreyNoise, urlscan).

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

Tools needing API keys read them from `.env` (gitignored). Copy `.env.example`, fill in your keys.

## Security posture

- `opencode.json` denies `bash` and denies edits outside `reports/`
- API keys live in `~/.local/share/opencode/auth.json` and `.env`, both outside version control
- Client-identifying context stays in gitignored files
- Tools only make outbound HTTPS calls to the feeds listed above — read the source before adding a new one

## Troubleshooting

| Symptom | Fix |
|---|---|
| `command not found: opencode` | PATH not set — see Setup step 1 |
| Rate limit of 0 tokens | You selected a **Fast** model — `/models`, pick the non-Fast version |
| Rate limit on a normal model | Check Billing at console.anthropic.com |
| Tool not appearing | File must be in `.opencode/tools/`, restart OpenCode |
| Can't save into `.opencode` | Open the repo folder in VS Code (File → Open Folder) and create files from the Explorer pane |

## Contributing

Fork, add a tool or source, open a PR. Keep tools deterministic and dependency-free where possible. Never commit a real watchlist, report, or key.

## License


