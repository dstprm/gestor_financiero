'use client';
import { useState } from 'react';
import { useOrgStore } from '@/store/orgStore';
import { selectEmployees } from '@/store/selectors';
import { cn } from '@/lib/utils';
import { exportToCSV, exportToExcel } from '@/lib/exporter';
import { chartExportRef, pptxExportRef } from '@/components/chart/OrgChart';
import { PptxExportModal } from '@/components/export/PptxExportModal';
import { useTheme } from '@/components/ThemeProvider';
import type { EmployeeStatus } from '@/types';
import {
  SlidersHorizontal,
  BarChart2,
  Building2,
  Download,
  Search,
  X,
  Users,
  Clock,
  MoreHorizontal,
  Sun,
  Moon,
  Undo2,
  Redo2,
  ArrowRightLeft,
  Link2,
  MousePointer2,
  Monitor,
} from 'lucide-react';

interface MobileBottomBarProps {
  onOpenSpotlight: () => void;
  onOpenAnalytics: () => void;
}

export function MobileBottomBar({ onOpenSpotlight, onOpenAnalytics }: MobileBottomBarProps) {
  const {
    rightPanelMode, setRightPanelMode,
    deptFilter, levelFilter, statusFilter, flagsOnlyFilter, isolateFilter,
    setDeptFilter, setLevelFilter, setStatusFilter, toggleFlagsFilter, toggleIsolateFilter, clearFilters,
    undo, redo, undoStack, redoStack,
    setPresentMode,
    layoutDirection, setLayoutDirection,
    interactionMode, setInteractionMode,
    pptxTheme, savePptxTheme,
  } = useOrgStore();

  const employees = useOrgStore(selectEmployees);
  const { theme, toggleTheme } = useTheme();

  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [pptxModalOpen, setPptxModalOpen] = useState(false);

  const hasActiveFilters =
    deptFilter.length > 0 ||
    levelFilter.length > 0 ||
    statusFilter.length > 0 ||
    flagsOnlyFilter ||
    isolateFilter;

  const allDepts = [...new Set(employees.map((e) => e.department))].sort();
  const allLevels = [...new Set(employees.map((e) => e.level).filter(Boolean))].sort();
  const allStatuses: EmployeeStatus[] = ['active', 'vacant', 'contractor', 'on-leave', 'proposed'];

  const toggleArr = <T extends string>(arr: T[], val: T, setter: (v: T[]) => void) => {
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const closeAll = () => { setFilterOpen(false); setExportOpen(false); setMoreOpen(false); };

  return (
    <>
      {/* Filter bottom sheet */}
      {filterOpen && (
        <>
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setFilterOpen(false)} />
          <div className="fixed left-0 right-0 z-50 md:hidden max-h-[70vh] overflow-y-auto bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 rounded-t-2xl shadow-xl p-4 space-y-4" style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800 dark:text-slate-200">Filter Nodes</span>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300">
                    Clear all
                  </button>
                )}
                <button onClick={() => setFilterOpen(false)} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 p-1">
                  <X size={16} />
                </button>
              </div>
            </div>

            {allDepts.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Department</p>
                <div className="flex flex-wrap gap-1.5">
                  {allDepts.map((d) => (
                    <button
                      key={d}
                      onClick={() => toggleArr(deptFilter, d, setDeptFilter)}
                      className={cn(
                        'px-2 py-1 rounded text-xs border transition-colors',
                        deptFilter.includes(d)
                          ? 'bg-blue-600/30 border-blue-500 text-blue-600 dark:text-blue-300'
                          : 'border-gray-300 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {allLevels.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Level</p>
                <div className="flex flex-wrap gap-1.5">
                  {allLevels.map((l) => (
                    <button
                      key={l}
                      onClick={() => toggleArr(levelFilter, l, setLevelFilter)}
                      className={cn(
                        'px-2 py-1 rounded text-xs border transition-colors',
                        levelFilter.includes(l)
                          ? 'bg-purple-600/30 border-purple-500 text-purple-600 dark:text-purple-300'
                          : 'border-gray-300 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {allStatuses.map((st) => (
                  <button
                    key={st}
                    onClick={() => toggleArr(statusFilter, st, setStatusFilter)}
                    className={cn(
                      'px-2 py-1 rounded text-xs border transition-colors',
                      statusFilter.includes(st)
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-600 dark:text-emerald-300'
                        : 'border-gray-300 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={toggleFlagsFilter}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors',
                flagsOnlyFilter
                  ? 'bg-yellow-600/20 border-yellow-600/50 text-yellow-600 dark:text-yellow-300'
                  : 'border-gray-300 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              )}
            >
              <span>Flagged employees only</span>
              {flagsOnlyFilter && <span>✓</span>}
            </button>

            <button
              onClick={toggleIsolateFilter}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors',
                isolateFilter
                  ? 'bg-indigo-600/20 border-indigo-600/50 text-indigo-600 dark:text-indigo-300'
                  : 'border-gray-300 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              )}
            >
              <span>Isolate (hide non-matching)</span>
              {isolateFilter && <span>✓</span>}
            </button>

            <div className="h-2" />
          </div>
        </>
      )}

      {/* Export bottom sheet */}
      {exportOpen && (
        <>
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setExportOpen(false)} />
          <div className="fixed left-0 right-0 z-50 md:hidden bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 rounded-t-2xl shadow-xl py-2" style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
            <div className="flex items-center justify-between px-4 py-2 mb-1">
              <span className="text-sm font-medium text-gray-800 dark:text-slate-200">Export</span>
              <button onClick={() => setExportOpen(false)} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 p-1">
                <X size={16} />
              </button>
            </div>
            {[
              { label: 'Export as PNG', action: () => chartExportRef.fn?.('png') },
              { label: 'Export as SVG', action: () => chartExportRef.fn?.('svg') },
              { label: 'Export as PowerPoint', action: () => { setExportOpen(false); setPptxModalOpen(true); } },
              { label: 'Export as Excel', action: () => exportToExcel(employees) },
              { label: 'Export as CSV', action: () => exportToCSV(employees) },
            ].map(({ label, action }) => (
              <button
                key={label}
                onClick={() => { action(); setExportOpen(false); }}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* More bottom sheet */}
      {moreOpen && (
        <>
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMoreOpen(false)} />
          <div className="fixed left-0 right-0 z-50 md:hidden bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 rounded-t-2xl shadow-xl pb-2" style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
              <span className="text-sm font-medium text-gray-800 dark:text-slate-200">More</span>
              <button onClick={() => setMoreOpen(false)} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 p-1">
                <X size={16} />
              </button>
            </div>

            {/* Orgs / org switcher */}
            <a
              href="/app/orgs"
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-b border-gray-100 dark:border-slate-700"
            >
              <Building2 size={16} />
              <span>Switch Organization</span>
            </a>

            {/* Undo / Redo row */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-slate-700">
              <button
                onClick={() => { undo(); setMoreOpen(false); }}
                disabled={undoStack.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-sm text-gray-600 dark:text-slate-300 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Undo2 size={15} />
                Undo
              </button>
              <button
                onClick={() => { redo(); setMoreOpen(false); }}
                disabled={redoStack.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-sm text-gray-600 dark:text-slate-300 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Redo2 size={15} />
                Redo
              </button>
            </div>

            {/* Layout direction */}
            <button
              onClick={() => { setLayoutDirection(layoutDirection === 'TB' ? 'LR' : 'TB'); setMoreOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowRightLeft size={16} />
              <span>Layout: {layoutDirection === 'TB' ? 'Top-Down' : 'Left-Right'} — tap to switch</span>
            </button>

            {/* Navigate / Connect mode */}
            <button
              onClick={() => { setInteractionMode(interactionMode === 'navigate' ? 'connect' : 'navigate'); setMoreOpen(false); }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-slate-700',
                interactionMode === 'connect'
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-gray-700 dark:text-slate-300'
              )}
            >
              {interactionMode === 'connect' ? <Link2 size={16} /> : <MousePointer2 size={16} />}
              <span>{interactionMode === 'connect' ? 'Mode: Connect — tap to switch' : 'Mode: Navigate — tap to switch'}</span>
            </button>

            {/* Present */}
            <button
              onClick={() => { setPresentMode(true); setMoreOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Monitor size={16} />
              <span>Present</span>
            </button>

            {/* Members */}
            <a
              href="/app/members"
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Users size={16} />
              <span>Members</span>
            </a>

            {/* Activity */}
            <a
              href="/app/settings?tab=activity"
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Clock size={16} />
              <span>Activity</span>
            </a>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              <span>{theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}</span>
            </button>
          </div>
        </>
      )}

      {/* Bottom action bar — mobile only, 5 equal flex-1 buttons (no min-width overflow) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 md:hidden z-30" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="h-16 flex items-stretch">

          {/* Filter */}
          <button
            onClick={() => { closeAll(); setFilterOpen(true); }}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
              hasActiveFilters
                ? 'text-orange-500 dark:text-orange-300'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800'
            )}
          >
            <SlidersHorizontal size={18} />
            <span className="text-[10px] leading-none">
              Filter{hasActiveFilters ? ' •' : ''}
            </span>
          </button>

          {/* Search */}
          <button
            onClick={onOpenSpotlight}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Search size={18} />
            <span className="text-[10px] leading-none">Search</span>
          </button>

          {/* Analytics */}
          <button
            onClick={() => { setRightPanelMode('analytics'); onOpenAnalytics(); }}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
              rightPanelMode === 'analytics'
                ? 'text-purple-600 dark:text-purple-300'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800'
            )}
          >
            <BarChart2 size={18} />
            <span className="text-[10px] leading-none">Analytics</span>
          </button>

          {/* Export */}
          <button
            onClick={() => { closeAll(); setExportOpen(true); }}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Download size={18} />
            <span className="text-[10px] leading-none">Export</span>
          </button>

          {/* More */}
          <button
            onClick={() => { closeAll(); setMoreOpen(true); }}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
              moreOpen
                ? 'text-blue-500 dark:text-blue-400 bg-gray-100 dark:bg-slate-800'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800'
            )}
          >
            <MoreHorizontal size={18} />
            <span className="text-[10px] leading-none">More</span>
          </button>

        </div>
      </div>
      {pptxModalOpen && (
        <PptxExportModal
          initialTheme={pptxTheme}
          onExport={(t) => { pptxExportRef.fn?.(t); setPptxModalOpen(false); }}
          onSaveAndExport={(t) => { void savePptxTheme(t); pptxExportRef.fn?.(t); setPptxModalOpen(false); }}
          onClose={() => setPptxModalOpen(false)}
        />
      )}
    </>
  );
}
