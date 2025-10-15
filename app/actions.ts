"use server"

import fs from "fs/promises"
import path from "path"
import { parse } from "node-html-parser"

// Directory where HTML files will be stored
const SITES_DIR = path.join(process.cwd(), "public", "sites")

/**
 * Generate a random alphanumeric name with length between 6 and 9 characters.
 * Includes letters (a-z, A-Z) and digits (0-9).
 */
function generateRandomName(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const length = Math.floor(Math.random() * 4) + 6 // 6-9
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Validate HTML content
function validateHtml(html: string): { valid: boolean; error?: string } {
  try {
    // Try to parse the HTML
    const root = parse(html)

    // Check for basic structure
    if (!html.includes("<html") || !html.includes("</html>")) {
      return { valid: false, error: "HTML must include <html> tags" }
    }

    if (!html.includes("<body") || !html.includes("</body>")) {
      return { valid: false, error: "HTML must include <body> tags" }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: "Invalid HTML structure. Please check your code for syntax errors.",
    }
  }
}

// Ensure the sites directory exists
async function ensureSitesDirectory() {
  try {
    await fs.access(SITES_DIR)
  } catch (error) {
    // Directory doesn't exist, create it
    await fs.mkdir(SITES_DIR, { recursive: true })
  }
}

// Check if a site name is already taken
async function isSiteNameTaken(name: string): Promise<boolean> {
  try {
    await fs.access(path.join(SITES_DIR, `${name}.html`))
    return true // File exists
  } catch (error) {
    return false // File doesn't exist
  }
}

export async function createSite(
  html: string,
  siteName: string,
): Promise<{ url: string; generatedName?: string; error?: string }> {
  // Validate HTML
  const validation = validateHtml(html)
  if (!validation.valid) {
    return { url: "", error: validation.error }
  }

  // Ensure sites directory exists
  await ensureSitesDirectory()

  // Generate a random name if none provided
  let finalSiteName = siteName.trim()
  let isGenerated = false

  if (!finalSiteName) {
    // Keep generating until we find an unused name
    do {
      finalSiteName = generateRandomName()
    } while (await isSiteNameTaken(finalSiteName))

    isGenerated = true
  } else {
    // Check if the provided name is already taken
    if (await isSiteNameTaken(finalSiteName)) {
      // If taken, auto-generate a new unique random name
      do {
        finalSiteName = generateRandomName()
      } while (await isSiteNameTaken(finalSiteName))
      isGenerated = true
    } else {
      // Validate site name (only allow letters, numbers, hyphens, and underscores)
      if (!/^[a-zA-Z0-9_-]+$/.test(finalSiteName)) {
        return {
          url: "",
          error: "Site name can only contain letters, numbers, hyphens, and underscores.",
        }
      }
    }
  }

  // Save the HTML to a file
  const filePath = path.join(SITES_DIR, `${finalSiteName}.html`)
  await fs.writeFile(filePath, html, "utf-8")

  // Return the URL
  const url = `http://play.linecode.top/${finalSiteName}`

  return {
    url,
    ...(isGenerated && { generatedName: finalSiteName }),
  }
}

