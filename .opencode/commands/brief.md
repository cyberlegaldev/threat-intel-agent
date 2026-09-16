---
description: Generate the daily threat intelligence brief
---
Generate today's threat brief. Lookback: $ARGUMENTS days (default 7).

1. Read @context/watchlist.yaml
2. Call `kev` for the lookback window.
3. Call `epss` for every CVE returned.
4. Score each: KEV (always) + EPSS + watchlist match. Rank.
5. Write reports/<today>.md with: top 5 items (CVE, product, EPSS, ransomware use,
   "So what" for the watchlist, source link), then a one-paragraph outlook.