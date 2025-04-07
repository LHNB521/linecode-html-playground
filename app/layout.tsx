import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LineCode Playground',
  description: 'Created with LineCode',
  generator: 'LineCode',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
