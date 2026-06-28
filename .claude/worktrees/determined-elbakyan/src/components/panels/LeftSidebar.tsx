'use client';
import { useState } from 'react';
import { useOrgStore } from '@/store/orgStore';
import { ScenarioPanel } from './ScenarioPanel';
import { DataIssuesPanel } from './DataIssuesPanel';
import { UploadPanel } from '../upload/UploadPanel';
import { AddPersonModal } from './AddPersonModal';
import { cn } from '@/lib/utils';
import { GitBranch, AlertTriangle, Upload, X, UserPlus } from 'lucide-react';

interface LeftSidebarProps {
  open: boolean;
  onClose: () => void;
  isViewer?: boolean;
}

export function LeftSidebar({ open, onClose, isViewer }: LeftSidebarProps) {
  const { leftPanel, setLeftPanel, dataIssues } = useOrgStore();
  const [showAddPerson, setShowAddPerson] = useState(false);

  const errors = dataIssues.filter((i) => i.severity === 'error').length;
  const warnings = dataIssues.filter((i) => i.severity === 'warning').length;

  const tabs = [
    { id: 'scenarios' as const, icon: GitBranch, label: 'Scenarios', badge: null },
    { id: 'issues' as const, icon: AlertTriangle, label: 'Issues', badge: errors + warnings > 0 ? errors + warnings : null, badgeColor: errors > 0 ? 'bg-red-500' : 'bg-yellow-500' },
    { id: 'upload' as const, icon: Upload, label: 'Upload', badge: null },
  ];

  return (
    <aside
      className={cn(
        'bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col shrink-0',
        // Desktop: always visible, relative, fixed width
        'md:relative md:translate-x-0 md:w-64',
        // Mobile: overlay drawer
        'fixed inset-y-0 left-0 w-72 z-50 md:z-auto transform transition-transform duration-200 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}
    >
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 dark:border-slate-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = leftPanel === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setLeftPanel(tab.id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors relative',
                isActive ? 'text-blue-500 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
              )}
            >
              <div className="relative">
                <Icon size={15} />
                {tab.badge !== null && (
                  <span className={cn(
                    'absolute -top-1 -right-2 text-xs text-white rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold text-[9px]',
                    tab.badgeColor ?? 'bg-slate-500'
                  )}>
                    {tab.badge}
                  </span>
                )}
              </div>
              <span>{tab.label}</span>
            </button>
          );
        })}

        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="md:hidden px-3 py-2 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 flex items-center justify-center"
          aria-label="Close sidebar"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {leftPanel === 'scenarios' && <ScenarioPanel />}
        {leftPanel === 'issues' && <DataIssuesPanel />}
        {leftPanel === 'upload' && <UploadPanel />}
      </div>

      {/* Add Person button — hidden for viewers */}
      {!isViewer && (
        <div className="border-t border-gray-200 dark:border-slate-700 p-3 shrink-0">
          <button
            onClick={() => setShowAddPerson(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-600/50 text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 rounded-lg text-sm font-medium transition-colors"
          >
            <UserPlus size={14} />
            Add Person
          </button>
        </div>
      )}

      {showAddPerson && <AddPersonModal onClose={() => setShowAddPerson(false)} />}
    </aside>
  );
}
