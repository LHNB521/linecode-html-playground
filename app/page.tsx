import { CreateSite } from "@/components/create-site"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-transparent bg-clip-text animate-gradient">
            HTML Playground
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            粘贴你的 HTML 代码，给它取个名字（或者让我们为你生成一个），然后立即在 play.linecode.top/你的名字 获得一个可分享的 URL
          </p>
        </div>

        <CreateSite />
      </div>
    </main>
  )
}

