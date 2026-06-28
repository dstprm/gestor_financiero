import { SignIn } from "@clerk/nextjs";

const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function SignInPage() {
  if (!clerkConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center text-slate-400">
          <h1 className="text-2xl font-bold mb-2 text-white">Sign In</h1>
          <p>Auth not configured yet.</p>
          <a href="/app" className="mt-4 inline-block text-blue-400 underline">
            Continue to app →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <SignIn fallbackRedirectUrl="/auth/redirect" />
    </div>
  );
}
