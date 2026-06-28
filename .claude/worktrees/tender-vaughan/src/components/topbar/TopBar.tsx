'use client';
import { useState, useMemo } from 'react';
import { useOrgStore } from '@/store/orgStore';
import { selectEmployees } from '@/store/selectors';
import { cn } from '@/lib/utils';
import { exportToCSV, exportToExcel } from '@/lib/exporter';
import { chartExportRef, pptxExportRef, spotlightRef } from '@/components/chart/OrgChart';
import { PptxExportModal } from '@/components/export/PptxExportModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { EmployeeStatus } from '@/types';
import {
  Search,
  Download,
  Upload,
  ChevronDown,
  BarChart2,
  GitBranch,
  Undo2,
  Redo2,
  SlidersHorizontal,
  Presentation,
  X,
  Menu,
  Link2,
  MousePointer2,
  Users,
  LayoutGrid,
  Move,
  RotateCcw,
  Clock,
  Save,
  Zap,
  MoreHorizontal,
} from 'lucide-react';

interface TopBarProps {
  onOpenSidebar: () => void;
  sidebarOpen: boolean;
  onOpenSpotlight: () => void;
  orgName?: string | null;
  isViewer?: boolean;
}

export function TopBar({ onOpenSidebar, onOpenSpotlight, orgName, isViewer }: TopBarProps) {
  const {
    searchQuery, setSearchQuery,
    layoutDirection, setLayoutDirection,
    scenarios, activeScenarioId, switchScenario,
    rightPanelMode, setRightPanelMode,
    setLeftPanel,
    undo, redo, undoStack, redoStack,
    setPresentMode,
    interactionMode, setInteractionMode,
    layoutMode, setLayoutMode, resetFreeStylePositions,
    deptFilter, levelFilter, statusFilter, flagsOnlyFilter, isolateFilter,
    setDeptFilter, setLevelFilter, setStatusFilter, toggleFlagsFilter, toggleIsolateFilter, clearFilters,
    organizationId, syncStatus, autosaveEnabled, hasUnsavedChanges,
    setAutosaveEnabled, saveNow,
    pptxTheme, savePptxTheme,
  } = useOrgStore();

  const employees = useOrgStore(selectEmployees);

  const [exportOpen, setExportOpen] = useState(false);
  const [pptxModalOpen, setPptxModalOpen] = useState(false);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const activeScenario = activeScenarioId ? scenarios[activeScenarioId] : null;
  const scenarioList = Object.values(scenarios);

  const hasActiveFilters =
    deptFilter.length > 0 ||
    levelFilter.length > 0 ||
    statusFilter.length > 0 ||
    flagsOnlyFilter ||
    isolateFilter;

  // Unique values from employees
  const allDepts = [...new Set(employees.map((e) => e.department))].sort();
  const allLevels = [...new Set(employees.map((e) => e.level).filter(Boolean))].sort();
  const allStatuses: EmployeeStatus[] = ['active', 'vacant', 'contractor', 'on-leave', 'proposed'];

  const toggleArr = <T extends string>(arr: T[], val: T, setter: (v: T[]) => void) => {
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery, employees]);

  return (
    <header className="relative h-12 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center px-3 gap-2 shrink-0 z-30">
      {/* Hamburger — mobile only */}
      <button
        onClick={onOpenSidebar}
        className="md:hidden p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Open sidebar"
      >
        <Menu size={18} />
      </button>

      {/* Logo / org name — hidden when search is expanded */}
      <div className={cn('flex items-center gap-2 shrink-0', searchExpanded && 'hidden sm:flex')}>
        {/* Desktop: SimplyOrg brand (non-interactive) */}
        <div className="w-6 h-6 bg-blue-600 rounded items-center justify-center hidden md:flex">
          <GitBranch size={14} className="text-white" />
        </div>
        <span className="font-bold text-gray-900 dark:text-white text-sm hidden md:block">SimplyOrg</span>

        {/* Mobile: org name as link back to org list */}
        <a
          href="/app/orgs"
          className="md:hidden flex items-center gap-1 min-w-[44px] min-h-[44px] px-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          title={orgName ? `${orgName} — switch org` : 'Switch organization'}
        >
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center shrink-0">
            <GitBranch size={14} className="text-white" />
          </div>
          {orgName && (
            <span className="text-xs font-medium text-gray-600 dark:text-slate-300 max-w-[72px] truncate">
              {orgName}
            </span>
          )}
        </a>
      </div>

      <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 mx-1 hidden sm:block" />

      {/* Scenario badge + switcher — hidden when search expanded on mobile */}
      <div className={cn('relative', searchExpanded && 'hidden sm:block')}>
        <button
          onClick={() => setScenarioOpen((o) => !o)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500 text-sm"
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          <span className="text-gray-700 dark:text-slate-200 max-w-[52px] sm:max-w-32 truncate">
            {activeScenario?.name ?? 'No scenario'}
          </span>
          <ChevronDown size={13} className="text-gray-400 dark:text-slate-400" />
        </button>

        {scenarioOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setScenarioOpen(false)} />
            <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-50 py-1">
              <p className="text-xs text-gray-400 dark:text-slate-500 px-3 py-1.5 uppercase tracking-wider">Scenarios</p>
              {scenarioList.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { switchScenario(s.id); setScenarioOpen(false); }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-700',
                    s.id === activeScenarioId ? 'text-blue-500 dark:text-blue-400' : 'text-gray-700 dark:text-slate-300'
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full', s.id === activeScenarioId ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600')} />
                  <span className="truncate">{s.name}</span>
                  {s.isBaseline && <span className="ml-auto text-xs text-gray-400 dark:text-slate-500">baseline</span>}
                </button>
              ))}
              <div className="border-t border-gray-200 dark:border-slate-700 mt-1 pt-1">
                <button
                  onClick={() => { setLeftPanel('scenarios'); setScenarioOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-700 dark:hover:text-slate-200"
                >
                  Manage scenarios →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Undo / Redo */}
      <div className={cn('flex items-center gap-0.5', searchExpanded && 'hidden sm:flex', isViewer && 'hidden')}>
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          title="Undo (⌘Z)"
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Undo2 size={14} />
        </button>
        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          title="Redo (⌘⇧Z)"
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Redo2 size={14} />
        </button>
      </div>

      {/* Save button + Autosave toggle — only shown when connected to DB, desktop only, not for viewers */}
      {organizationId && !isViewer && (
        <div className={cn('hidden md:flex items-center gap-0.5 rounded-md border border-gray-200 dark:border-slate-700 p-0.5 bg-gray-50 dark:bg-slate-800/50')}>
          {/* Manual Save button */}
          <button
            onClick={() => void saveNow()}
            disabled={syncStatus === 'saving'}
            title={
              hasUnsavedChanges && !autosaveEnabled
                ? 'Unsaved changes — click to save'
                : 'Save (Ctrl+S)'
            }
            className={cn(
              'relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors min-h-[44px] md:min-h-0 disabled:opacity-50 disabled:cursor-not-allowed',
              hasUnsavedChanges && !autosaveEnabled
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 dark:border-amber-500 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                : 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-slate-500'
            )}
          >
            <Save size={13} />
            <span className="hidden md:inline">Save</span>
            {hasUnsavedChanges && !autosaveEnabled && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-500" />
            )}
          </button>

          {/* Autosave toggle */}
          <button
            onClick={() => setAutosaveEnabled(!autosaveEnabled)}
            title={autosaveEnabled ? 'Autosave ON — click to disable' : 'Autosave OFF — click to enable'}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 rounded-md text-xs border transition-colors min-h-[44px] md:min-h-0',
              autosaveEnabled
                ? 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-blue-500 dark:text-blue-400 hover:border-gray-400 dark:hover:border-slate-500'
                : 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500'
            )}
          >
            <Zap size={12} />
            <span className="hidden md:inline">Auto-save</span>
          </button>
        </div>
      )}

      <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 hidden sm:block" />

      {/* Search — collapsible on mobile */}
      <div className={cn('relative', searchExpanded ? 'flex-1' : 'hidden sm:block sm:flex-1 sm:max-w-64')}>
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onBlur={() => { if (!searchQuery) setSearchExpanded(false); }}
          onKeyDown={(e) => { if (e.key === 'Escape') { setSearchQuery(''); setSearchExpanded(false); } }}
          placeholder="Search name, title, dept…"
          className="w-full bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md pl-8 pr-8 py-1.5 text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
          autoFocus={searchExpanded}
        />
        {(searchExpanded || !!searchQuery) && (
          <button
            onClick={() => { setSearchQuery(''); setSearchExpanded(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
          >
            <X size={13} />
          </button>
        )}
        {searchMatches.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden">
            {searchMatches.map((emp) => (
              <button
                key={emp.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  spotlightRef.fn?.(emp.id);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-700 flex flex-col border-b border-gray-100 dark:border-slate-700 last:border-0"
              >
                <span className="text-xs font-medium text-gray-900 dark:text-slate-100 truncate">{emp.name}</span>
                <span className="text-xs text-gray-400 dark:text-slate-400 truncate">{emp.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search icon — mobile only, when collapsed */}
      {!searchExpanded && (
        <button
          onClick={() => setSearchExpanded(true)}
          className="sm:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800"
          aria-label="Search"
        >
          <Search size={16} />
        </button>
      )}

      <div className="flex-1 hidden sm:block" />

      {/* Layout direction toggle — desktop only */}
      <div className="hidden md:flex items-center gap-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md p-0.5">
        {(['TB', 'LR'] as const).map((dir) => (
          <button
            key={dir}
            onClick={() => setLayoutDirection(dir)}
            className={cn(
              'px-2 py-1 rounded text-xs font-medium transition-colors min-h-[32px]',
              layoutDirection === dir
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
            )}
          >
            {dir === 'TB' ? '⬇ Top-Down' : '➡ Left-Right'}
          </button>
        ))}
      </div>

      {/* Import — desktop only, hidden for viewers */}
      {!isViewer && (
        <button
          onClick={() => setLeftPanel('upload')}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-slate-500 text-xs font-medium"
          title="Import from CSV / Excel"
        >
          <Upload size={13} />
          <span className="hidden md:inline">Import</span>
        </button>
      )}

      {/* Export dropdown — desktop only */}
      <div className="relative hidden md:flex">
        <button
          onClick={() => setExportOpen((o) => !o)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-slate-500 text-xs font-medium min-h-[44px] md:min-h-0"
        >
          <Download size={13} />
          <span className="hidden md:inline">Export</span>
          <ChevronDown size={11} className="hidden md:block" />
        </button>

        {exportOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
            <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-50 py-1">
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
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* More (⋯) overflow menu — desktop only */}
      <div className="relative hidden md:block">
        <button
          onClick={() => setMoreOpen((o) => !o)}
          title="More options"
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-md border transition-colors',
            moreOpen
              ? 'bg-gray-200 dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200'
              : 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:border-gray-400 dark:hover:border-slate-500'
          )}
        >
          <MoreHorizontal size={15} />
        </button>

        {moreOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
            <div className="absolute top-full right-0 mt-1 w-52 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-50 py-1">

              {/* View */}
              <p className="text-xs text-gray-400 dark:text-slate-500 px-3 py-1.5 uppercase tracking-wider">View</p>
              <button
                onClick={() => { setLayoutMode(layoutMode === 'organized' ? 'freeStyle' : 'organized'); setMoreOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300"
              >
                {layoutMode === 'freeStyle' ? <Move size={13} /> : <LayoutGrid size={13} />}
                {layoutMode === 'freeStyle' ? 'Free Layout' : 'Auto Layout'}
              </button>
              {layoutMode === 'freeStyle' && (
                <button
                  onClick={() => {
                    if (window.confirm('Reset free style layout? All stored positions will be cleared and auto layout will be restored.')) {
                      resetFreeStylePositions();
                      setMoreOpen(false);
                    }
                  }}
                  className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400"
                >
                  <RotateCcw size={13} />
                  Reset Layout
                </button>
              )}
              <button
                onClick={() => { setMoreOpen(false); setFilterOpen((o) => !o); }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-700',
                  hasActiveFilters ? 'text-orange-500 dark:text-orange-300' : 'text-gray-700 dark:text-slate-300'
                )}
              >
                <SlidersHorizontal size={13} />
                Filters
                {hasActiveFilters && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />}
              </button>
              <button
                onClick={() => { setRightPanelMode(rightPanelMode === 'analytics' ? null : 'analytics'); setMoreOpen(false); }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-700',
                  rightPanelMode === 'analytics' ? 'text-purple-600 dark:text-purple-300' : 'text-gray-700 dark:text-slate-300'
                )}
              >
                <BarChart2 size={13} />
                Analytics
              </button>

              <div className="border-t border-gray-200 dark:border-slate-700 my-1" />

              {/* Tools */}
              <p className="text-xs text-gray-400 dark:text-slate-500 px-3 py-1.5 uppercase tracking-wider">Tools</p>
              <button
                onClick={() => { setInteractionMode(interactionMode === 'navigate' ? 'connect' : 'navigate'); setMoreOpen(false); }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-700',
                  interactionMode === 'connect' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-slate-300'
                )}
              >
                {interactionMode === 'connect' ? <Link2 size={13} /> : <MousePointer2 size={13} />}
                {interactionMode === 'connect' ? 'Connecting' : 'Navigate'}
              </button>
              <button
                onClick={() => { setPresentMode(true); setMoreOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300"
              >
                <Presentation size={13} />
                Present
              </button>

              <div className="border-t border-gray-200 dark:border-slate-700 my-1" />

              {/* Team */}
              <p className="text-xs text-gray-400 dark:text-slate-500 px-3 py-1.5 uppercase tracking-wider">Team</p>
              <a
                href="/app/members"
                onClick={() => setMoreOpen(false)}
                className="flex px-3 py-2 text-sm items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300"
              >
                <Users size={13} />
                Members
              </a>
              <a
                href="/app/settings?tab=activity"
                onClick={() => setMoreOpen(false)}
                className="flex px-3 py-2 text-sm items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300"
              >
                <Clock size={13} />
                Activity
              </a>

              <div className="border-t border-gray-200 dark:border-slate-700 my-1" />

              {/* Preferences */}
              <p className="text-xs text-gray-400 dark:text-slate-500 px-3 py-1.5 uppercase tracking-wider">Preferences</p>
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-slate-300">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filter panel — fixed position, triggered from More menu */}
      {filterOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
          <div className="fixed left-2 right-2 sm:left-auto sm:right-4 top-14 w-auto sm:w-72 max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-50 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800 dark:text-slate-200">Filter Nodes</span>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300"
                  >
                    Clear all
                  </button>
                )}
                <button onClick={() => setFilterOpen(false)} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Department */}
            {allDepts.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Department</p>
                <div className="flex flex-wrap gap-1.5">
                  {allDepts.map((d) => (
                    <button
                      key={d}
                      onClick={() => toggleArr(deptFilter, d, setDeptFilter)}
                      className={cn(
                        'px-2 py-0.5 rounded text-xs border transition-colors',
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

            {/* Level */}
            {allLevels.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Level</p>
                <div className="flex flex-wrap gap-1.5">
                  {allLevels.map((l) => (
                    <button
                      key={l}
                      onClick={() => toggleArr(levelFilter, l, setLevelFilter)}
                      className={cn(
                        'px-2 py-0.5 rounded text-xs border transition-colors',
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

            {/* Status */}
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {allStatuses.map((st) => (
                  <button
                    key={st}
                    onClick={() => toggleArr(statusFilter, st, setStatusFilter)}
                    className={cn(
                      'px-2 py-0.5 rounded text-xs border transition-colors',
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

            {/* Flags only */}
            <div>
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
                <span>{flagsOnlyFilter ? '✓' : ''}</span>
              </button>
            </div>

            {/* Isolate mode */}
            <div>
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
                <span>{isolateFilter ? '✓' : ''}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {pptxModalOpen && (
        <PptxExportModal
          initialTheme={pptxTheme}
          onExport={(theme) => { pptxExportRef.fn?.(theme); setPptxModalOpen(false); }}
          onSaveAndExport={(theme) => { void savePptxTheme(theme); pptxExportRef.fn?.(theme); setPptxModalOpen(false); }}
          onClose={() => setPptxModalOpen(false)}
        />
      )}
    </header>
  );
}
