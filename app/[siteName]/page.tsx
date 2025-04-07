import { notFound } from "next/navigation"

// In a real implementation, this would fetch the HTML from your storage
async function getSiteHtml(siteName: string): Promise<string | null> {
  // This is a placeholder - in a real app, you'd fetch from a database or file storage
  // For demo purposes, we'll just return null to show the 404 page
  return null
}

export default async function SitePage({ params }: { params: { siteName: string } }) {
  const html = await getSiteHtml(params.siteName)

  if (!html) {
    notFound()
  }

  // This is a simplified example - in a real app, you'd need to handle
  // security concerns like sanitizing HTML and proper Content-Security-Policy
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

