---
description: Deep-dive one CVE — details, exploitation status, context
---
Assess $ARGUMENTS.

1. Read @context/watchlist.yaml
2. Call `nvd` for the CVE.
3. Call `epss` for the CVE.
4. Call `kev` with cves = [the CVE].
5. Call `rss` with hours = 720 and match = the CVE ID.
6. Compose:
   - `# <CVE> — <vendor/product>`
   - **Verdict** (one line): Patch now / Patch this cycle / Track
   - **Exploitation**: KEV yes/no (date added, ransomware use), EPSS score + percentile
   - **Impact**: CVSS score, vector, CWE, plain-English attack scenario
   - **Affected**: products/versions from CPE data
   - **Relevance**: does it touch the watchlist? Which entries?
   - **Reporting**: research posts found, if any
   - **Sources**
7. Call `report` with name = the CVE ID and the markdown.
8. Reply with the verdict line and the file paths.
