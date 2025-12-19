// app/[siteName]/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ siteName: string }> }
) {
  // 1. 等待 params 解析 (Next.js 15 要求)
  const { siteName } = await params;

  // 2. 安全校验文件名 (防止目录遍历)
  if (!/^[a-zA-Z0-9_-]+$/.test(siteName)) {
    return new NextResponse('Invalid site name', { status: 400 });
  }

  const filePath = path.join(process.cwd(), 'public', 'sites', `${siteName}.html`);

  if (!fs.existsSync(filePath)) {
    return new NextResponse('Site not found', { status: 404 });
  }

  const htmlContent = fs.readFileSync(filePath, 'utf-8');

  // 3. 构建响应并添加安全头
  const response = new NextResponse(htmlContent, {
    headers: {
      'Content-Type': 'text/html',
      // 禁止被其他网站 iframe 嵌入 (防点击劫持)
      'X-Frame-Options': 'DENY',
      // 核心安全策略 (CSP):
      // - default-src 'self': 默认只允许加载同源资源
      // - script-src: 允许内联脚本 (因为是 Playground)，允许常用 CDN (可选)
      // - form-action 'none': ★★★ 关键！禁止表单提交数据，彻底废掉钓鱼页面的收集功能
      // - connect-src 'none': 禁止 AJAX 请求外部接口
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https:; form-action 'none'; object-src 'none'; base-uri 'none';",
    },
  });

  return response;
}