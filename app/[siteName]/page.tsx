import fs from "fs/promises"
import path from "path"
import { notFound } from "next/navigation"

// Directory where HTML files are stored
const SITES_DIR = path.join(process.cwd(), "public", "sites")

// Get the HTML content for a site
async function getSiteHtml(siteName: string): Promise<string | null> {
  try {
    const filePath = path.join(SITES_DIR, `${siteName}.html`)
    const html = await fs.readFile(filePath, "utf-8")
    return html
  } catch (error) {
    console.error(`Error reading HTML for site ${siteName}:`, error)
    return null
  }
}

export default async function SitePage({ params }: { params: { siteName: string } }) {
  const { siteName } = params

  // Validate site name to prevent directory traversal attacks
  if (!/^[a-zA-Z0-9_-]+$/.test(siteName)) {
    notFound()
  }

  const html = await getSiteHtml(siteName)

  if (!html) {
    notFound()
  }

  // Return the raw HTML directly
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  })
}

