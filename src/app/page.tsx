"use client";

import Link from "next/link";
import { useState } from "react";

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

const FEATURES = [
  {
    title: "Auth — Clerk",
    description: "Sign up, sign in, webhooks, and user sync to your database. Role-based access (Owner, Admin, Editor, Viewer) built in.",
    items: ["Sign in / Sign up pages", "Clerk → DB user sync webhook", "Protected routes via middleware"],
  },
  {
    title: "Billing — Mercado Pago",
    description: "Hosted checkout redirect, trial enforcement, and webhook handling. Built for LATAM markets with Mercado Pago.",
    items: ["Mercado Pago checkout", "Trial + subscription gate", "IPN / webhook handler"],
  },
  {
    title: "Org Management",
    description: "Multi-tenant org system with invites, roles, and member management — ready to extend with your own features.",
    items: ["Create / join organizations", "Email invites with 7-day expiry", "Member roles & permissions"],
  },
  {
    title: "Dark Mode + UI",
    description: "Tailwind v4 with dark mode, Radix UI primitives, Lucide icons, and Sonner toasts. No flash on load.",
    items: ["Dark / light / system modes", "Radix UI component primitives", "Responsive AppShell with sidebar"],
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold">C</div>
            ClaudeKit
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            <Link href="/app" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Sign in</Link>
            <Link href="/app" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Get started free
            </Link>
          </nav>
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-4">
            <a href="#features" className="text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#pricing" className="text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <Link href="/app" className="text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
            <Link href="/app" className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg text-center" onClick={() => setMobileMenuOpen(false)}>
              Get started free
            </Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="bg-white pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-full mb-6 border border-blue-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Optimized for Claude Code
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Build your SaaS{" "}
            <span className="text-blue-600">faster.</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            ClaudeKit is a production-ready Next.js starter with auth, billing, org management, and dark mode wired up and ready to go. Built to work great with Claude Code.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/app"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors shadow-sm"
            >
              Get started free
            </Link>
            <a
              href="#features"
              className="border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold px-8 py-3.5 rounded-xl text-base transition-colors"
            >
              See what&apos;s included
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Everything wired up. Nothing to figure out.
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Skip weeks of boilerplate. ClaudeKit gives you a complete SaaS foundation so you can ship what matters.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm mb-5">{f.description}</p>
                <ul className="space-y-2">
                  {f.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckIcon />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Stack callout */}
          <div className="mt-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
            <h3 className="text-base font-bold text-gray-900 mb-4">The stack</h3>
            <div className="flex flex-wrap gap-3">
              {[
                "Next.js 16 App Router",
                "TypeScript",
                "Tailwind CSS v4",
                "Clerk Auth",
                "Mercado Pago",
                "Prisma ORM",
                "Supabase (PostgreSQL)",
                "Radix UI",
                "Sonner Toasts",
                "Lucide Icons",
                "Dark Mode",
                "Vercel-ready",
              ].map((tech) => (
                <span key={tech} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-white py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Simple pricing</h2>
            <p className="text-gray-500 text-lg">Set your own price. This is the starter — configure Mercado Pago with your access token.</p>
          </div>
          <div className="max-w-sm mx-auto">
            <div className="bg-white rounded-2xl border-2 border-blue-600 shadow-xl p-10 text-center">
              <div className="mb-2">
                <span className="text-6xl font-extrabold text-gray-900">$XX</span>
                <span className="text-gray-400 text-xl ml-1">/month</span>
              </div>
              <p className="text-sm text-gray-400 mb-8">Your pricing here. Configure in <code>src/lib/mercadopago.ts</code>.</p>
              <ul className="space-y-3 mb-8 text-left">
                {[
                  "Everything in ClaudeKit",
                  "Add your features here",
                  "Unlimited orgs / members",
                  "Priority support",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <CheckIcon />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/app"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl text-center transition-colors text-sm mb-3"
              >
                Start free trial
              </Link>
              <p className="text-xs text-gray-400">Free trial — no credit card required</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2 font-semibold text-gray-700">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white text-xs font-bold">C</div>
            ClaudeKit
          </div>
          <p>© {new Date().getFullYear()} ClaudeKit. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
