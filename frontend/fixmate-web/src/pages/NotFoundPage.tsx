export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="text-lg text-gray-600">Page not found</p>
      <a href="/" className="btn-primary">Go home</a>
    </div>
  )
}
