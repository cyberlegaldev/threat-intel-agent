import { tool } from "@opencode-ai/plugin"
import { requireKey, root } from "../lib/env"

export default tool({
  description: "GreyNoise: is this IP mass-scanning the internet (noise) or a known benign service (RIOT)? Requires GREYNOISE_API_KEY in .env.",
  args: {
    ip: tool.schema.string().describe("IPv4 address"),
  },
  async execute(args, context) {
    const key = requireKey(root(context), "GREYNOISE_API_KEY")
    const res = await fetch(`https://api.greynoise.io/v3/community/${args.ip.trim()}`, { headers: { key } })
    if (res.status === 404) return `GreyNoise has not observed ${args.ip}`
    if (!res.ok) return `GreyNoise error ${res.status}: ${await res.text()}`
    return JSON.stringify(await res.json(), null, 2)
  },
})
