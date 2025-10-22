"use server"

import fs from "fs/promises"
import path from "path"
import { parse } from "node-html-parser"

// HTML文件存储目录
const SITES_DIR = path.join(process.cwd(), "public", "sites")

/**
 * 生成随机字母数字名称，长度在6-9个字符之间
 * 包含字母（a-z, A-Z）和数字（0-9）
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

/**
 * 验证HTML内容
 * @param html - 要验证的HTML字符串
 * @returns 验证结果对象
 */
function validateHtml(html: string): { valid: boolean; error?: string } {
  try {
    // 尝试解析HTML
    const root = parse(html)

    // 检查基本结构
    if (!html.includes("<html") || !html.includes("</html>")) {
      return { valid: false, error: "HTML必须包含<html>标签" }
    }

    if (!html.includes("<body") || !html.includes("</body>")) {
      return { valid: false, error: "HTML必须包含<body>标签" }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: "HTML结构无效。请检查代码语法错误。",
    }
  }
}

/**
 * 确保站点目录存在
 */
async function ensureSitesDirectory(): Promise<void> {
  try {
    await fs.access(SITES_DIR)
  } catch (error) {
    // 目录不存在，创建它
    await fs.mkdir(SITES_DIR, { recursive: true })
  }
}

/**
 * 检查站点名称是否已被占用
 * @param name - 要检查的站点名称
 * @returns 是否已被占用
 */
async function isSiteNameTaken(name: string): Promise<boolean> {
  try {
    await fs.access(path.join(SITES_DIR, `${name}.html`))
    return true // 文件存在
  } catch (error) {
    return false // 文件不存在
  }
}

/**
 * 创建HTML站点
 * @param html - HTML内容
 * @param siteName - 站点名称（可选，为空则自动生成）
 * @returns 创建结果，包含URL和可能的生成名称
 */
export async function createSite(
  html: string,
  siteName: string,
): Promise<{ url: string; generatedName?: string; error?: string }> {
  // 验证HTML
  const validation = validateHtml(html)
  if (!validation.valid) {
    return { url: "", error: validation.error }
  }

  // 确保站点目录存在
  await ensureSitesDirectory()

  // 生成随机名称（如果未提供）
  let finalSiteName = siteName.trim()
  let isGenerated = false

  if (!finalSiteName) {
    // 持续生成直到找到未使用的名称
    do {
      finalSiteName = generateRandomName()
    } while (await isSiteNameTaken(finalSiteName))

    isGenerated = true
  } else {
    // 检查提供的名称是否已被占用
    if (await isSiteNameTaken(finalSiteName)) {
      // 如果已被占用，自动生成新的唯一随机名称
      do {
        finalSiteName = generateRandomName()
      } while (await isSiteNameTaken(finalSiteName))
      isGenerated = true
    } else {
      // 验证站点名称（只允许字母、数字、连字符和下划线）
      if (!/^[a-zA-Z0-9_-]+$/.test(finalSiteName)) {
        return {
          url: "",
          error: "站点名称只能包含字母、数字、连字符和下划线。",
        }
      }
    }
  }

  try {
    // 保存HTML到文件
    const filePath = path.join(SITES_DIR, `${finalSiteName}.html`)
    await fs.writeFile(filePath, html, "utf-8")

    // 动态获取当前地址并拼接URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   process.env.VERCEL_URL || 
                   'http://localhost:3001'
    const url = `${baseUrl}/${finalSiteName}`

    return {
      url,
      ...(isGenerated && { generatedName: finalSiteName }),
    }
  } catch (error) {
    return {
      url: "",
      error: "保存文件时发生错误。请稍后重试。",
    }
  }
}


//   admin----
export async function adminLogin(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  if (username === "ldpadmin" && password === "ldp123456789..") {
    return { success: true }
  }
  return { success: false, error: "用户名或密码错误" }
}
interface Site {
  name: string
  html: string
  createdAt: Date
}

/**
 * 获取所有站点的信息
 * @returns 站点信息数组
 */
export async function getAllSites(): Promise<Site[]> {
  try {
    // 确保站点目录存在
    await ensureSitesDirectory()
    
    // 读取目录中的所有文件
    const files = await fs.readdir(SITES_DIR)
    
    // 过滤出HTML文件
    const htmlFiles = files.filter(file => file.endsWith('.html'))
    
    const sites: Site[] = []
    
    // 并行处理所有文件，提高效率
    const sitePromises = htmlFiles.map(async (file) => {
      try {
        const filePath = path.join(SITES_DIR, file)
        
        // 读取文件内容和文件状态
        const [html, stats] = await Promise.all([
          fs.readFile(filePath, 'utf-8'),
          fs.stat(filePath)
        ])
        
        // 提取文件名（不含扩展名）
        const name = file.replace(/\.html$/, '')
        
        return {
          name,
          html,
          createdAt: stats.birthtime || stats.ctime
        }
      } catch (error) {
        console.error(`读取站点文件 ${file} 时发生错误:`, error)
        return null
      }
    })
    
    // 等待所有文件处理完成
    const results = await Promise.all(sitePromises)
    
    // 过滤掉处理失败的文件
    return results.filter((site): site is Site => site !== null)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // 按创建时间倒序排列
      
  } catch (error) {
    console.error('获取所有站点信息时发生错误:', error)
    return []
  }
}

/**
 * 删除站点
 * @param siteName - 要删除的站点名称
 * @returns 删除结果
 */
export async function deleteSite(siteName: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 验证站点名称格式
    if (!/^[a-zA-Z0-9_-]+$/.test(siteName)) {
      return { success: false, error: "站点名称格式无效" }
    }
    
    // 确保站点目录存在
    await ensureSitesDirectory()
    
    const filePath = path.join(SITES_DIR, `${siteName}.html`)
    
    // 检查文件是否存在
    try {
      await fs.access(filePath)
    } catch (error) {
      return { success: false, error: "站点不存在" }
    }
    
    // 删除文件
    await fs.unlink(filePath)
    
    return { success: true }
  } catch (error) {
    console.error(`删除站点 ${siteName} 时发生错误:`, error)
    return { success: false, error: "删除站点时发生错误" }
  }
}

/**
 * 重命名站点
 * @param oldName - 原站点名称
 * @param newName - 新站点名称
 * @returns 重命名结果
 */
export async function renameSite(oldName: string, newName: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 验证站点名称格式
    if (!/^[a-zA-Z0-9_-]+$/.test(oldName) || !/^[a-zA-Z0-9_-]+$/.test(newName)) {
      return { success: false, error: "站点名称格式无效" }
    }
    
    // 确保新名称与原名称不同
    if (oldName === newName) {
      return { success: false, error: "新名称与原名称相同" }
    }
    
    // 确保站点目录存在
    await ensureSitesDirectory()
    
    const oldFilePath = path.join(SITES_DIR, `${oldName}.html`)
    const newFilePath = path.join(SITES_DIR, `${newName}.html`)
    
    // 检查原文件是否存在
    try {
      await fs.access(oldFilePath)
    } catch (error) {
      return { success: false, error: "原站点不存在" }
    }
    
    // 检查新名称是否已被占用
    try {
      await fs.access(newFilePath)
      return { success: false, error: "新站点名称已被占用" }
    } catch (error) {
      // 新名称可用，继续执行
    }
    
    // 重命名文件
    await fs.rename(oldFilePath, newFilePath)
    
    return { success: true }
  } catch (error) {
    console.error(`重命名站点 ${oldName} 为 ${newName} 时发生错误:`, error)
    return { success: false, error: "重命名站点时发生错误" }
  }
}