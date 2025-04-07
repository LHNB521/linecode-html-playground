import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-transparent bg-clip-text">
          404 - 页面未找到
        </h1>
        <p className="text-gray-400 mb-8">您正在寻找的 HTML 站点不存在或已被删除。</p>
        <Link
          href="/"
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-md text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  )
}

