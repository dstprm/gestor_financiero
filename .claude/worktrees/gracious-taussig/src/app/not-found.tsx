import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="text-center space-y-4">
        <p className="text-slate-500 text-sm font-mono">404</p>
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="text-slate-400">The page you're looking for doesn't exist.</p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
