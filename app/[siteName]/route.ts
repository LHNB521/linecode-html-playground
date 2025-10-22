import fs from "fs/promises"
import path from "path"
import { type NextRequest, NextResponse } from "next/server"

/** HTML文件存储目录 */
const SITES_DIR = path.join(process.cwd(), "public", "sites")

/**
 * 获取站点的HTML内容
 * @param siteName - 站点名称
 * @returns HTML内容字符串，如果文件不存在则返回null
 */
async function getSiteHtml(siteName: string): Promise<string | null> {
  try {
    const filePath = path.join(SITES_DIR, `${siteName}.html`)
    const html = await fs.readFile(filePath, "utf-8")
    return html
  } catch (error) {
    console.error(`读取站点 ${siteName} 的HTML时发生错误:`, error)
    return null
  }
}

/**
 * GET请求处理函数 - 根据站点名称返回对应的HTML内容
 * @param request - Next.js请求对象
 * @param params - 路由参数，包含站点名称
 * @returns HTML响应或404错误
 */
export async function GET(
  request: NextRequest, 
  { params }: { params: { siteName: string } }
): Promise<NextResponse> {
  const { siteName } = params

  // 验证站点名称以防止目录遍历攻击
  if (!/^[a-zA-Z0-9_-]+$/.test(siteName)) {
    return new NextResponse("页面未找到", { 
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      }
    })
  }

  // 获取HTML内容
  const html = await getSiteHtml(siteName)

  if (!html) {
    return new NextResponse("页面未找到", { 
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      }
    })
  }

  // 返回原始HTML内容，设置正确的Content-Type
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600", // 缓存1小时
    },
  })
}

