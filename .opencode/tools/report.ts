import { tool } from "@opencode-ai/plugin"
import { mkdirSync, writeFileSync, createWriteStream } from "fs"
import path from "path"
import PDFDocument from "pdfkit"
import { root } from "../lib/env"

function mdToText(md: string): string {
  return md
    .replace(/^#{1,6}\s+(.*)$/gm, (_, t) => `\n${t.toUpperCase()}\n${"=".repeat(t.length)}`)
    .replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/^\s*[-*]\s+/gm, "  - ")
    .replace(/\n{3,}/g, "\n\n").trim() + "\n"
}

function mdToPdf(md: string, file: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 54, size: "LETTER" })
    const stream = createWriteStream(file)
    doc.pipe(stream)
    for (const raw of md.split("\n")) {
      const line = raw.replace(/\*\*(.*?)\*\*/g, "$1").replace(/`([^`]*)`/g, "$1").replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
      const h = line.match(/^(#{1,6})\s+(.*)$/)
      if (h) { doc.moveDown(0.6).font("Helvetica-Bold").fontSize(h[1].length === 1 ? 18 : h[1].length === 2 ? 14 : 12).text(h[2]).moveDown(0.3); continue }
      const li = line.match(/^\s*[-*]\s+(.*)$/)
      if (li) { doc.font("Helvetica").fontSize(10).text(`\u2022 ${li[1]}`, { indent: 12 }); continue }
      if (!line.trim()) { doc.moveDown(0.4); continue }
      doc.font("Helvetica").fontSize(10).text(line)
    }
    doc.end()
    stream.on("finish", () => resolve())
    stream.on("error", reject)
  })
}

export default tool({
  description: "Save a finished report as .md, .txt, and .pdf in reports/. Pass the complete markdown body.",
  args: {
    name: tool.schema.string().describe("Base filename without extension, e.g. 2026-09-16-brief or CVE-2024-3400"),
    markdown: tool.schema.string().describe("Full report content in markdown"),
  },
  async execute(args, context) {
    const dir = path.join(root(context), "reports")
    mkdirSync(dir, { recursive: true })
    const base = path.join(dir, args.name.replace(/[^\w.-]+/g, "-"))
    writeFileSync(`${base}.md`, args.markdown)
    writeFileSync(`${base}.txt`, mdToText(args.markdown))
    await mdToPdf(args.markdown, `${base}.pdf`)
    return `Saved:\n${base}.md\n${base}.txt\n${base}.pdf`
  },
})
