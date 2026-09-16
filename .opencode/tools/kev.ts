import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Fetch CISA Known Exploited Vulnerabilities added in the last N days",
  args: {
    days: tool.schema.number().optional().describe("Lookback window in days, default 7"),
  },
  async execute(args) {
    const days = args.days ?? 7
    const res = await fetch("https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json")
    const data = await res.json()
    const cutoff = Date.now() - days * 86400000
    const recent = data.vulnerabilities
      .filter((v: any) => new Date(v.dateAdded).getTime() >= cutoff)
      .map((v: any) => ({
        cve: v.cveID, vendor: v.vendorProject, product: v.product,
        added: v.dateAdded, ransomware: v.knownRansomwareCampaignUse,
        note: v.shortDescription,
      }))
    return JSON.stringify(recent, null, 2)
  },
})