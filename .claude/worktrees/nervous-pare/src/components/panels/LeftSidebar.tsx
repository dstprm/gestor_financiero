'use client';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface LeftSidebarProps {
  open: boolean;
  onClose: () => void;
}

/**
 * LeftSidebar — mobile slide-out sidebar shell.
 * On desktop this component is not rendered; the sidebar in AppShell is used instead.
 * Add your mobile nav items here if needed.
 */
export function LeftSidebar({ open, onClose }: LeftSidebarProps) {
  return (
    <div
      className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col transition-transform duration-200',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-800">
        <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">Menu</span>
        <button
          onClick={onClose}
          className="p-1 rounded text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-300"
        >
          <X size={16} />
        </button>
      </div>
      <nav className="flex-1 p-3">
        {/* Add your mobile nav items here */}
      </nav>
    </div>
  );
}
