'use client';
import { useOrgStore } from '@/store/orgStore';
import { NodeEditor } from './NodeEditor';
import { AnalyticsSidebar } from './AnalyticsSidebar';
import { DiffPanel } from './DiffPanel';
import { AddEmployeePanel } from './AddEmployeePanel';
import { BulkEditPanel } from '@/components/chart/BulkEditPanel';
import { cn } from '@/lib/utils';
import { UserCog, BarChart2, GitCompare, UserPlus, X } from 'lucide-react';

interface RightPanelProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function RightPanel({ mobileOpen, onMobileClose }: RightPanelProps) {
  const { rightPanelMode, setRightPanelMode, selectedNodeId, compareScenarioId, selectedIds, currentUserRole } = useOrgStore();
  const isViewer = currentUserRole === 'VIEWER';

  const isOpen = rightPanelMode !== null || compareScenarioId !== null;

  // Priority: bulk-edit > add-employee > diff overlay > other modes
  // Viewers cannot see bulk-edit or add-employee panels
  const activeMode = (!isViewer && rightPanelMode === 'bulk-edit')
    ? 'bulk-edit'
    : (!isViewer && rightPanelMode === 'add-employee')
    ? 'add-employee'
    : compareScenarioId && rightPanelMode !== 'editor'
      ? 'diff'
      : rightPanelMode === 'bulk-edit' || rightPanelMode === 'add-employee'
      ? null
      : rightPanelMode;

  if (!isOpen) {
    return (
      <aside className="hidden md:flex w-10 bg-gray-50 dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 flex-col items-center py-2 gap-2">
        {!isViewer && (
          <button
            onClick={() => setRightPanelMode('add-employee')}
            className="p-2 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Add Employee"
          >
            <UserPlus size={15} />
          </button>
        )}
        <button
          onClick={() => setRightPanelMode('analytics')}
          className="p-2 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Analytics"
        >
          <BarChart2 size={15} />
        </button>
      </aside>
    );
  }

  const tabs = [
    ...(!isViewer ? [{ id: 'add-employee' as const, icon: UserPlus, label: 'Add', disabled: false }] : []),
    { id: 'editor' as const, icon: UserCog, label: 'Editor', disabled: !selectedNodeId || selectedIds.length > 1 },
    { id: 'analytics' as const, icon: BarChart2, label: 'Analytics', disabled: false },
    ...(compareScenarioId ? [{ id: 'diff' as const, icon: GitCompare, label: 'Diff', disabled: false }] : []),
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 flex flex-col shrink-0',
          // Desktop: side panel
          'md:relative md:w-72 md:border-l md:translate-y-0',
          // Mobile: bottom sheet
          'fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t transition-transform duration-200 ease-in-out md:rounded-none md:border-t-0',
          mobileOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Drag handle — mobile only */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-slate-600" />
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-200 dark:border-slate-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMode === tab.id || (tab.id === 'diff' && activeMode === 'diff');
            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setRightPanelMode(tab.id as 'editor' | 'analytics' | 'diff' | 'add-employee')}
                disabled={tab.disabled}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 py-2.5 text-xs transition-colors',
                  isActive ? 'text-blue-500 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300',
                  tab.disabled && 'opacity-30 cursor-not-allowed'
                )}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}

          {/* Close button — mobile only */}
          <button
            onClick={onMobileClose}
            className="md:hidden px-3 py-2 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 flex items-center justify-center"
            aria-label="Close panel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-hidden flex flex-col"
          style={{ height: 'calc(65vh - 80px)' }}
        >
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {activeMode === 'add-employee' && <AddEmployeePanel />}
            {activeMode === 'editor' && <NodeEditor />}
            {activeMode === 'bulk-edit' && <BulkEditPanel />}
            {activeMode === 'analytics' && <AnalyticsSidebar />}
            {activeMode === 'diff' && <DiffPanel />}
          </div>
        </div>
      </aside>
    </>
  );
}
