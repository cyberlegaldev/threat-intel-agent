import { tool } from "@opencode-ai/plugin"
import { loadEnv, root } from "../lib/env"

export default tool({
  description: "Full CVE details from NVD: description, CVSS score/vector, CWE, affected products (CPE), references.",
  args: {
    cve: tool.schema.string().describe("CVE ID, e.g. CVE-2024-3400"),
  },
  async execute(args, context) {
    const key = loadEnv(root(context)).NVD_API_KEY
    const headers: Record<string, string> = key ? { apiKey: key } : {}
    const res = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${args.cve.toUpperCase()}`, { headers })
    if (!res.ok) return `NVD error ${res.status}: ${await res.text()}`
    const item = (await res.json()).vulnerabilities?.[0]?.cve
    if (!item) return `NVD has no record for ${args.cve}`
    const m = item.metrics?.cvssMetricV31?.[0] ?? item.metrics?.cvssMetricV40?.[0] ?? item.metrics?.cvssMetricV30?.[0]
    const cpes: string[] = []
    for (const n of item.configurations ?? [])
      for (const node of n.nodes ?? [])
        for (const c of node.cpeMatch ?? []) if (c.vulnerable) cpes.push(c.criteria)
    return JSON.stringify({
      cve: item.id, published: item.published, modified: item.lastModified, status: item.vulnStatus,
      description: item.descriptions?.find((d: any) => d.lang === "en")?.value,
      cvss: m ? { score: m.cvssData.baseScore, severity: m.cvssData.baseSeverity, vector: m.cvssData.vectorString } : null,
      cwe: item.weaknesses?.flatMap((w: any) => w.description.map((d: any) => d.value)) ?? [],
      affected: cpes.slice(0, 25),
      references: (item.references ?? []).slice(0, 10).map((r: any) => ({ url: r.url, tags: r.tags })),
    }, null, 2)
  },
})
