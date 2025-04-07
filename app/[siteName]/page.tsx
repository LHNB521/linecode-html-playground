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

// This function tells Next.js which routes to pre-render
export async function generateStaticParams() {
  try {
    const files = await fs.readdir(SITES_DIR)
    return files
      .filter((file) => file.endsWith(".html"))
      .map((file) => ({
        siteName: file.replace(".html", ""),
      }))
  } catch (error) {
    // If the directory doesn't exist yet, return an empty array
    return []
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

  // Instead of returning a Response object, we'll use Next.js's HTML rendering
  return <html dangerouslySetInnerHTML={{ __html: html.replace(/<html.*?>|<\/html>/gi, "") }} />
}

// Configure the metadata for this page
export const dynamic = "force-dynamic"
export const dynamicParams = true

