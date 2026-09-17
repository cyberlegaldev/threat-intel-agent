---
description: Generate the daily threat intelligence brief (md + txt + pdf)
---
Generate today's threat brief. Lookback: $ARGUMENTS days (default 7).

1. Read @context/watchlist.yaml
2. Call `kev` for the lookback window.
3. Call `epss` for every CVE returned.
4. Call `rss` with hours = lookback × 24. Keep only posts relevant to the watchlist
   or to CVEs from step 2. Use them for campaign/actor context, not as findings.
5. Score each CVE: KEV (always) + EPSS + watchlist match. Rank.
6. Compose the report in markdown:
   - `# Threat Brief — <today>`
   - `## Priority items` — top 5: CVE, vendor/product, EPSS, ransomware use,
     one-line "So what" against the watchlist, source link
   - `## Narrative` — one paragraph tying the week's research posts to the items above
   - `## Watchlist mentions` — anything in rss matching watchlist that has no CVE yet
   - `## Sources` — every URL used
7. Call `report` with name `<today>-brief` and the full markdown.
8. Reply with the file paths and a 3-line summary. Do not paste the whole report.
