'use client';
import { useState } from 'react';
import { TopBar } from './topbar/TopBar';

interface AppShellProps {
  orgName?: string | null;
  children?: React.ReactNode;
}

/**
 * AppShell — the authenticated app wrapper.
 *
 * Provides TopBar + a two-column layout (sidebar slot + main content).
 * Replace the placeholder <main> content with your app pages.
 *
 * To add sidebar navigation:
 *   1. Create src/components/Sidebar.tsx
 *   2. Import and render it in the left column below
 */
export function AppShell({ orgName, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950 overflow-hidden">
      <TopBar
        onOpenSidebar={() => setSidebarOpen(true)}
        sidebarOpen={sidebarOpen}
        orgName={orgName}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar slot — add your nav here */}
        <aside
          className={[
            'w-64 shrink-0 border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900',
            'flex flex-col overflow-y-auto',
            'fixed inset-y-0 left-0 z-50 transition-transform duration-200 md:relative md:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-800 md:hidden">
            <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">Menu</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-300"
            >
              ✕
            </button>
          </div>

          {/* Nav items go here */}
          <nav className="flex-1 p-3 space-y-1">
            <p className="px-3 py-2 text-xs text-gray-400 dark:text-slate-600 font-medium uppercase tracking-wider">
              Navigation
            </p>
            {/* Add NavLink items here:
            <NavLink href="/app/dashboard" icon={<LayoutDashboard size={16} />}>Dashboard</NavLink>
            */}
            <div className="px-3 py-8 text-center">
              <p className="text-sm text-gray-400 dark:text-slate-600">Add nav items here</p>
              <p className="text-xs text-gray-300 dark:text-slate-700 mt-1">src/components/AppShell.tsx</p>
            </div>
          </nav>
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
