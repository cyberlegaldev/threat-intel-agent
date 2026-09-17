---
description: Enrich an indicator (IP, domain, URL, hash)
---
Enrich the indicator: $ARGUMENTS

1. Call `virustotal` with the indicator.
2. If it is an IPv4 address, also call `greynoise`.
3. If either tool reports a missing API key, say so plainly and stop.
4. Reply in-chat (no report file) with:
   - **Verdict**: Malicious / Suspicious / Benign-noise / Unknown, with confidence
   - Detection ratio, threat label, tags, ASN/country
   - GreyNoise classification if present (noise vs RIOT)
   - One-line recommended action
