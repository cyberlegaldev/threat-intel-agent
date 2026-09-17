import { tool } from "@opencode-ai/plugin"
import { requireKey, root } from "../lib/env"

export default tool({
  description: "VirusTotal reputation for an IP, domain, URL, or file hash. Requires VT_API_KEY in .env.",
  args: {
    indicator: tool.schema.string().describe("IP, domain, URL, or MD5/SHA1/SHA256 hash"),
  },
  async execute(args, context) {
    const key = requireKey(root(context), "VT_API_KEY")
    const i = args.indicator.trim()
    let path: string
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(i)) path = `ip_addresses/${i}`
    else if (/^[a-f0-9]{32}$|^[a-f0-9]{40}$|^[a-f0-9]{64}$/i.test(i)) path = `files/${i}`
    else if (/^https?:\/\//i.test(i)) path = `urls/${Buffer.from(i).toString("base64url")}`
    else path = `domains/${i}`
    const res = await fetch(`https://www.virustotal.com/api/v3/${path}`, { headers: { "x-apikey": key } })
    if (res.status === 404) return `VirusTotal has no record for ${i}`
    if (!res.ok) return `VirusTotal error ${res.status}: ${await res.text()}`
    const a = (await res.json()).data.attributes
    return JSON.stringify({
      indicator: i, type: path.split("/")[0],
      verdicts: a.last_analysis_stats,
      reputation: a.reputation,
      tags: a.tags,
      categories: a.categories,
      as_owner: a.as_owner, country: a.country,
      names: a.names?.slice(0, 5), type_description: a.type_description,
      threat_label: a.popular_threat_classification?.suggested_threat_label,
      last_analysis: a.last_analysis_date ? new Date(a.last_analysis_date * 1000).toISOString() : undefined,
    }, null, 2)
  },
})
