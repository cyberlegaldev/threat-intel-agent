import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Get EPSS exploit probability (0-1) and percentile for a list of CVE IDs",
  args: {
    cves: tool.schema.array(tool.schema.string()).describe("CVE IDs, e.g. CVE-2026-1234"),
  },
  async execute(args) {
    const res = await fetch(`https://api.first.org/data/v1/epss?cve=${args.cves.join(",")}`)
    const data = await res.json()
    return JSON.stringify(data.data.map((d: any) => ({
      cve: d.cve, epss: Number(d.epss), percentile: Number(d.percentile),
    })), null, 2)
  },
})