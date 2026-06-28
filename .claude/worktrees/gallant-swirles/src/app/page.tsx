"use client";

import Link from "next/link";
import { useState } from "react";

function OrgIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
      <rect x="10" y="1" width="8" height="6" rx="1.5" fill="#2563eb" />
      <rect x="1" y="18" width="8" height="6" rx="1.5" fill="#2563eb" />
      <rect x="10" y="18" width="8" height="6" rx="1.5" fill="#2563eb" />
      <rect x="19" y="18" width="8" height="6" rx="1.5" fill="#2563eb" />
      <line x1="14" y1="7" x2="14" y2="14" stroke="#2563eb" strokeWidth="1.5" />
      <line x1="5" y1="14" x2="23" y2="14" stroke="#2563eb" strokeWidth="1.5" />
      <line x1="5" y1="14" x2="5" y2="18" stroke="#2563eb" strokeWidth="1.5" />
      <line x1="14" y1="14" x2="14" y2="18" stroke="#2563eb" strokeWidth="1.5" />
      <line x1="23" y1="14" x2="23" y2="18" stroke="#2563eb" strokeWidth="1.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function OrgChartIllustration() {
  return (
    <div className="relative w-full max-w-lg mx-auto select-none" aria-hidden>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 overflow-hidden">
        {/* Label */}
        <div className="flex gap-2 mb-5">
          <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">Current</span>
          <span className="text-xs font-semibold bg-blue-600 text-white px-2.5 py-1 rounded-full">Scenario: Q3 Reorg</span>
        </div>
        {/* Level 1 */}
        <div className="flex justify-center mb-2">
          <div className="bg-blue-600 text-white rounded-xl px-5 py-3 text-sm font-semibold shadow-md w-40 text-center">
            <div className="text-xs text-blue-200 mb-0.5">CEO</div>
            Sarah Chen
          </div>
        </div>
        {/* Connector */}
        <div className="flex justify-center">
          <div className="w-px h-6 bg-gray-300" />
        </div>
        <div className="flex justify-center mb-0">
          <div className="w-64 h-px bg-gray-300" />
        </div>
        {/* Level 2 */}
        <div className="flex justify-between mb-2 px-4">
          <div className="flex flex-col items-center">
            <div className="w-px h-4 bg-gray-300" />
            <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm w-28 text-center">
              <div className="text-xs text-indigo-400 mb-0.5">CTO</div>
              Alex Kim
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-px h-4 bg-gray-300" />
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm w-28 text-center relative">
              <div className="text-xs text-amber-500 mb-0.5">New role</div>
              VP Eng
              <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-400 rounded-full border-2 border-white" />
            </div>
          </div>
        </div>
        {/* Connectors to level 3 */}
        <div className="flex justify-between px-4">
          <div className="flex flex-col items-center w-28 ml-1">
            <div className="w-px h-4 bg-gray-300" />
            <div className="w-full h-px bg-gray-300" />
          </div>
          <div className="flex flex-col items-center w-28 mr-1">
            <div className="w-px h-4 bg-gray-300" />
          </div>
        </div>
        {/* Level 3 */}
        <div className="flex gap-3 px-1 mt-0">
          <div className="flex flex-col items-center flex-1">
            <div className="w-px h-2 bg-gray-300" />
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 text-center w-full">
              <div className="text-gray-400 text-xs">Eng Lead</div>
              J. Park
            </div>
          </div>
          <div className="flex flex-col items-center flex-1">
            <div className="w-px h-2 bg-gray-300" />
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 text-center w-full">
              <div className="text-gray-400 text-xs">Design</div>
              T. Liu
            </div>
          </div>
          <div className="flex flex-col items-center flex-1">
            <div className="w-px h-2 bg-gray-300" />
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-800 text-center w-full relative">
              <div className="text-emerald-500 text-xs">Moved</div>
              R. Patel
              <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
          </div>
        </div>
        {/* Decorative badge */}
        <div className="absolute top-4 right-4 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200">
          2 changes
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900">
            <OrgIcon />
            SimplyOrg
          </Link>
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            <Link href="/app" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Sign in</Link>
            <Link href="/app" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Try it free
            </Link>
          </nav>
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-4">
            <a href="#features" className="text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#pricing" className="text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <Link href="/app" className="text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
            <Link href="/app" className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg text-center" onClick={() => setMobileMenuOpen(false)}>
              Try it free
            </Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-white pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-full mb-6 border border-blue-100">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Free trial — no credit card required
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
              Plan your org{" "}
              <span className="text-blue-600">before you commit to it.</span>
            </h1>
            <p className="text-lg text-gray-500 mb-8 max-w-xl">
              SimplyOrg lets you build your live org chart and create scenarios to model changes — reorgs, new hires, restructures — without touching the real thing. Compare side by side, then export to a deck.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/app"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl text-base transition-colors text-center shadow-sm"
              >
                Try it free
              </Link>
              <a
                href="#features"
                className="border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-xl text-base transition-colors text-center"
              >
                See how it works
              </a>
            </div>
          </div>
          <div className="lg:pl-4">
            <OrgChartIllustration />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Your org chart should show where you&apos;re going</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Not just where you are.</p>
          </div>

          {/* Feature 1: Scenario planning — lead with this */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full mb-4 border border-blue-100">
                  The differentiator
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Scenario planning</h3>
                <p className="text-gray-500 mb-6">Model any change you&apos;re considering — without touching the real org. Build a scenario, make edits freely, and commit only when you&apos;re ready.</p>
                <ul className="space-y-3">
                  {[
                    "Create a scenario for any change you're considering",
                    "Compare current vs. proposed side by side with a visual diff",
                    "Model a reorg, a hiring plan, or a team restructure — commit when you're ready",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <CheckIcon />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lg:w-64 xl:w-80 w-full flex-shrink-0">
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-xs">
                  <div className="flex gap-2 mb-3">
                    <div className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-semibold">Current</div>
                    <div className="bg-blue-600 text-white px-2 py-0.5 rounded font-semibold">Q3 Reorg</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
                      <span className="w-2 h-2 rounded-full bg-gray-300" />
                      <span className="text-gray-600">Engineering — 12 people</span>
                    </div>
                    <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-amber-800">Platform team — new</span>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-emerald-800">R. Patel moved to Platform</span>
                    </div>
                  </div>
                  <div className="mt-3 text-gray-400 text-center">2 changes from current</div>
                </div>
              </div>
            </div>
          </div>

          {/* Features 2–4: 3-column grid */}
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: "📋",
                title: "Your live org chart, always up to date",
                items: [
                  "Import from Excel or CSV in seconds",
                  "Edit directly: add people, change reporting lines, update roles",
                  "Auto-layout keeps everything clean",
                ],
              },
              {
                icon: "📊",
                title: "Present and share",
                items: [
                  "Export to PowerPoint — org chart ready for your board deck",
                  "Share a read-only link with anyone, no login required",
                  "Filter by department, role, or status to tell the right story",
                ],
              },
              {
                icon: "✦",
                title: "Works everywhere",
                items: [
                  "Desktop and mobile",
                  "Dark mode",
                  "Real-time autosave",
                ],
              },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{f.title}</h3>
                <ul className="space-y-2">
                  {f.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-500">
                      <CheckIcon />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-white py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Simple, transparent pricing</h2>
            <p className="text-gray-500 text-lg">Everything included. No tiers, no surprises.</p>
          </div>
          <div className="max-w-sm mx-auto">
            <div className="bg-white rounded-2xl border-2 border-blue-600 shadow-xl p-10 text-center">
              <div className="mb-2">
                <span className="text-6xl font-extrabold text-gray-900">$49</span>
                <span className="text-gray-400 text-xl ml-1">/month</span>
              </div>
              <p className="text-sm text-gray-400 mb-8">Billed monthly. Cancel anytime.</p>
              <ul className="space-y-3 mb-8 text-left">
                {[
                  "Unlimited people",
                  "Unlimited scenarios",
                  "Export to PowerPoint (PPTX)",
                  "Team collaboration",
                  "Mobile & desktop access",
                  "Smart filters & isolation mode",
                  "Share read-only links",
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
            <OrgIcon />
            SimplyOrg
          </div>
          <p>© 2025 SimplyOrg. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
