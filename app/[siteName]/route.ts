import fs from "fs/promises"
import path from "path"
import { type NextRequest, NextResponse } from "next/server"

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

export async function GET(request: NextRequest, { params }: { params: { siteName: string } }) {
  const { siteName } = params

  // Validate site name to prevent directory traversal attacks
  if (!/^[a-zA-Z0-9_-]+$/.test(siteName)) {
    return new NextResponse("Not Found", { status: 404 })
  }

  const html = await getSiteHtml(siteName)

  if (!html) {
    return new NextResponse("Not Found", { status: 404 })
  }

  // Return the raw HTML with the correct content type
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  })
}

