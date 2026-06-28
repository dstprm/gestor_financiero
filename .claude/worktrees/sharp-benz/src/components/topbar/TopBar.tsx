'use client';
import Link from 'next/link';
import { Menu, Settings } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { ThemeToggle } from '@/components/ThemeToggle';

interface TopBarProps {
  onOpenSidebar: () => void;
  sidebarOpen: boolean;
  orgName?: string | null;
}

export function TopBar({ onOpenSidebar, orgName }: TopBarProps) {
  const { user } = useUser();

  return (
    <header className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-[60]">
      {/* Mobile sidebar toggle */}
      <button
        onClick={onOpenSidebar}
        className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Logo / app name */}
      <Link
        href="/app"
        className="flex items-center gap-2 font-bold text-gray-900 dark:text-slate-100 text-sm mr-2"
      >
        {/* Replace with your app logo */}
        <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
          A
        </div>
        <span className="hidden sm:inline">
          {orgName ?? 'ClaudeKit'}
        </span>
      </Link>

      {/* Center slot — add your primary nav or breadcrumbs here */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <Link
          href="/app/settings"
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Settings"
        >
          <Settings size={18} />
        </Link>

        {user && (
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-700 dark:text-blue-300 text-xs font-semibold ml-1 select-none">
            {(user.firstName?.[0] ?? user.primaryEmailAddress?.emailAddress?.[0] ?? '?').toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
