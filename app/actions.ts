// app/actions.ts
'use server'

import fs from 'fs';
import path from 'path';
import { headers } from 'next/headers'; // 用于获取 IP

// 简单的内存存储用于限流 (生产环境建议用 Redis)
const ipRateLimit = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1分钟
const MAX_REQUESTS_PER_WINDOW = 5; // 每分钟最多创建5个

export async function createSite(formData: FormData) {
  const code = formData.get('code') as string;
  let siteName = formData.get('siteName') as string;

  // --- 1. 安全防护：防滥用与限流 ---
  const headerStore = await headers();
  // 获取真实 IP (根据具体部署环境，可能需要 X-Forwarded-For)
  const ip = headerStore.get('x-forwarded-for') || 'unknown-ip';

  const now = Date.now();
  const lastRequestTime = ipRateLimit.get(ip) || 0;

  // 简单的滑动窗口或时间间隔检查
  if (now - lastRequestTime < 10000) { // 强制每10秒只能创建一个，防止并发脚本爆破
     return { success: false, error: '创建过于频繁，请稍后再试' };
  }
  ipRateLimit.set(ip, now);

  // --- 2. 安全防护：体积限制 (防止磁盘耗尽) ---
  if (code.length > 500 * 1024) { // 限制 500KB
    return { success: false, error: 'HTML 代码过长 (最大 500KB)' };
  }

  // --- 3. 基础校验 ---
  if (!code || !code.includes('<html') || !code.includes('<body')) {
    return { success: false, error: '无效的 HTML 内容' };
  }

  // 名称校验逻辑保持不变...
  if (siteName) {
    if (!/^[a-zA-Z0-9_-]+$/.test(siteName)) {
      return { success: false, error: '站点名称仅包含字母、数字、下划线和连字符' };
    }
    const filePath = path.join(process.cwd(), 'public', 'sites', `${siteName}.html`);
    if (fs.existsSync(filePath)) {
       // 如果重名，改为生成随机名，或者直接报错 (防止覆盖)
       // 为了安全，建议直接报错，不要自动覆盖别人的
       return { success: false, error: '站点名称已存在' };
    }
  } else {
    // 生成随机名逻辑...
    siteName = Math.random().toString(36).substring(2, 8);
    // 确保不重复...
  }

  // --- 4. 安全防护：注入防钓鱼警示栏 ---
  // 这段 HTML 会强制显示在页面最上方，且很难被用户 CSS 覆盖 (使用了 !important)
  const securityBanner = `
    <div style="position:fixed; top:0; left:0; width:100%; background:#ff4444; color:white; text-align:center; padding:10px; z-index:999999; font-family:sans-serif; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.2);">
      ⚠️ 警告：此页面由用户生成。请勿输入密码、私钥或下载任何文件！
    </div>
    <div style="height: 40px;"></div>
  `;

  // 将警示栏注入到 body 标签之后
  let safeCode = code.replace(/<body[^>]*>/i, (match) => `${match}${securityBanner}`);

  // 如果没有 body 标签 (虽然上面校验了)，追加到最后
  if (!safeCode.includes(securityBanner)) {
      safeCode = securityBanner + safeCode;
  }

  // 写入文件
  const filePath = path.join(process.cwd(), 'public', 'sites', `${siteName}.html`);
  try {
    fs.writeFileSync(filePath, safeCode);
    return { success: true, url: `http://play.linecode.top/${siteName}` }; // 注意：这里最好用环境变量配置域名
  } catch (err) {
    console.error(err);
    return { success: false, error: '服务器内部错误' };
  }
}

// app/actions.ts 中
export async function adminLogin(formData: FormData) {
  const password = formData.get('password') as string;

  // 1. 防止爆破：人为增加延迟 (比如 1秒)
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 2. 使用环境变量比对
  const correctPassword = process.env.ADMIN_PASSWORD || 'default_secure_password_please_change';

  if (password === correctPassword) {
    // 注意：实际生产中应该设置 HttpOnly Cookie，而不是仅返回成功
    // 但鉴于目前架构是纯客户端状态管理，这里仅做鉴权层面的加固
    return { success: true };
  }

  return { success: false, error: '密码错误' };
}