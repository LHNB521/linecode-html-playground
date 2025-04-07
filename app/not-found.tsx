import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-transparent bg-clip-text">
          404 - Page Not Found
        </h1>
        <p className="text-gray-400 mb-8">The HTML site you're looking for doesn't exist or has been removed.</p>
        <Link
          href="/"
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-md text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-colors"
        >
          Return to Homepage
        </Link>
      </div>
    </div>
  )
}

