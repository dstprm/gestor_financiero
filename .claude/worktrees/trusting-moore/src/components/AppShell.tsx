'use client';
import { useEffect, useState } from 'react';
import { TopBar } from './topbar/TopBar';
import { MobileBottomBar } from './topbar/MobileBottomBar';
import { LeftSidebar } from './panels/LeftSidebar';
import { OrgChart } from './chart/OrgChart';
import { RightPanel } from './panels/RightPanel';
import { SpotlightSearch } from './SpotlightSearch';
import { useOrgStore } from '@/store/orgStore';
import { selectEmployees } from '@/store/selectors';
import { WelcomeModal, hasSeenOnboarding, markOnboardingSeen } from './onboarding/WelcomeModal';
import { AddPersonModal } from './panels/AddPersonModal';
import { GettingStartedChecklist } from './onboarding/GettingStartedChecklist';
import { X, Upload } from 'lucide-react';
import type { Employee, ScenarioSnapshot } from '@/types';

const FIRST_VISIT_KEY = 'simplyorg_first_visit_shown';

interface AppShellProps {
  dataReady?: boolean;
  orgName?: string | null;
}

export function AppShell({ dataReady, orgName }: AppShellProps) {
  const activeScenarioId = useOrgStore((s) => s.activeScenarioId);
  const presentMode = useOrgStore((s) => s.presentMode);
  const currentUserRole = useOrgStore((s) => s.currentUserRole);
  const isViewer = currentUserRole === 'VIEWER';
  const selectedNodeId = useOrgStore((s) => s.selectedNodeId);
  const employees = useOrgStore(selectEmployees);
  const setLeftPanel = useOrgStore((s) => s.setLeftPanel);
  const organizationId = useOrgStore((s) => s.organizationId);
  const loadSampleData = useOrgStore((s) => s.loadSampleData);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAddPersonFromOnboarding, setShowAddPersonFromOnboarding] = useState(false);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [showSampleBanner, setShowSampleBanner] = useState(false);

  useEffect(() => {
    // Hydrate persisted state from localStorage on client mount
    try {
      useOrgStore.persist.rehydrate();
    } catch (err) {
      console.error('[SimplyOrg] Rehydration failed — clearing stale localStorage', err);
      try {
        const storeName = 'simplyorg-store';
        localStorage.removeItem(storeName);
        // Also clear any org-specific chart keys
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('simplyorg_chart_')) localStorage.removeItem(key);
        }
      } catch { /* ignore */ }
    }
  }, []);

  // Show onboarding for new users with an empty chart
  useEffect(() => {
    if (!dataReady || employees.length !== 0) return;

    // First-visit anonymous user (no DB org): auto-load sample data
    const isFirstVisit = !localStorage.getItem(FIRST_VISIT_KEY);
    if (isFirstVisit && !organizationId) {
      localStorage.setItem(FIRST_VISIT_KEY, '1');
      markOnboardingSeen();
      loadSampleData();
      setUsingSampleData(true);
      setShowSampleBanner(true);
      return;
    }

    if (!hasSeenOnboarding()) {
      setShowWelcome(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataReady, employees.length]);

  useEffect(() => {
    useOrgStore.getState().rerunChecks();
  }, [activeScenarioId]);

  // Open right panel when a node is selected; auto-switch to editor if no panel is active
  useEffect(() => {
    if (selectedNodeId) {
      setRightPanelOpen(true);
      const { rightPanelMode, setRightPanelMode } = useOrgStore.getState();
      if (!rightPanelMode) {
        setRightPanelMode('editor');
      }
    }
  }, [selectedNodeId]);

  function handleStartFresh() {
    const id = crypto.randomUUID();
    const snap: ScenarioSnapshot = {
      id,
      name: 'Current State',
      description: '',
      employees: [] as Employee[],
      isBaseline: true,
      createdAt: Date.now(),
    };
    useOrgStore.setState({
      scenarios: { [id]: snap },
      activeScenarioId: id,
      baselineScenarioId: id,
      undoStack: [],
      redoStack: [],
      savedPositions: {},
      hasUnsavedChanges: false,
      selectedNodeId: null,
      selectedIds: [],
    });
    setUsingSampleData(false);
    setShowSampleBanner(false);
  }

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Spotlight: Cmd/Ctrl+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSpotlightOpen((o) => !o);
        return;
      }

      // Undo: Ctrl/Cmd+Z — position undo in free style mode, org undo otherwise
      if (!isInput && (e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const state = useOrgStore.getState();
        if (state.layoutMode === 'freeStyle') {
          state.undoPositionChange();
        } else {
          state.undo();
        }
        return;
      }
      // Redo: Ctrl/Cmd+Shift+Z  or Ctrl/Cmd+Y
      if (!isInput && (e.ctrlKey || e.metaKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        useOrgStore.getState().redo();
        return;
      }
      // Present mode: P key (only when not typing)
      if (!isInput && (e.key === 'p' || e.key === 'P') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        useOrgStore.getState().setPresentMode(true);
        return;
      }
      // Exit present mode / close panels: Escape
      if (e.key === 'Escape') {
        useOrgStore.getState().setPresentMode(false);
        setSidebarOpen(false);
        setRightPanelOpen(false);
        setSpotlightOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Present mode: full-screen chart only
  if (presentMode) {
    return (
      <div className="fixed inset-0 bg-gray-50 dark:bg-slate-900 z-50 flex">
        <OrgChart />
        <button
          onClick={() => useOrgStore.getState().setPresentMode(false)}
          className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/80 dark:bg-slate-800/80 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white text-xs rounded-lg backdrop-blur-sm transition-colors z-10"
          title="Exit present mode (Esc)"
        >
          Esc
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950 overflow-hidden">
      <SpotlightSearch open={spotlightOpen} onClose={() => setSpotlightOpen(false)} />
      <TopBar
        onOpenSidebar={() => setSidebarOpen(true)}
        sidebarOpen={sidebarOpen}
        onOpenSpotlight={() => setSpotlightOpen(true)}
        orgName={orgName}
        isViewer={isViewer}
      />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <LeftSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isViewer={isViewer} />

        <main className="flex-1 overflow-hidden flex flex-col min-w-0 mobile-content-pad relative">
          {/* Sample data banner */}
          {showSampleBanner && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700/40 text-amber-800 dark:text-amber-300 text-xs shrink-0">
              <span className="flex-1">You&apos;re looking at sample data. Import your team or edit these people to get started.</span>
              <button
                onClick={() => { setLeftPanel('upload'); setSidebarOpen(true); setShowSampleBanner(false); setUsingSampleData(false); }}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-md font-medium shrink-0 transition-colors"
              >
                <Upload size={11} />
                Import my team
              </button>
              <button
                onClick={handleStartFresh}
                className="px-2.5 py-1 border border-amber-400 dark:border-amber-600 hover:bg-amber-100 dark:hover:bg-amber-800/30 rounded-md font-medium shrink-0 transition-colors"
              >
                Start fresh
              </button>
              <button
                onClick={() => setShowSampleBanner(false)}
                className="p-1 hover:text-amber-600 dark:hover:text-amber-200 shrink-0"
              >
                <X size={13} />
              </button>
            </div>
          )}
          <OrgChart dataReady={dataReady} />
          <GettingStartedChecklist usingSampleData={usingSampleData} />
        </main>

        <RightPanel mobileOpen={rightPanelOpen} onMobileClose={() => setRightPanelOpen(false)} />
      </div>
      <MobileBottomBar onOpenSpotlight={() => setSpotlightOpen(true)} onOpenAnalytics={() => setRightPanelOpen(true)} />

      {showWelcome && (
        <WelcomeModal
          onImport={() => {
            setLeftPanel('upload');
            setSidebarOpen(true);
            setShowWelcome(false);
          }}
          onAddManually={() => {
            setShowWelcome(false);
            setShowAddPersonFromOnboarding(true);
          }}
          onDismiss={() => setShowWelcome(false)}
        />
      )}
      {showAddPersonFromOnboarding && (
        <AddPersonModal onClose={() => setShowAddPersonFromOnboarding(false)} />
      )}
    </div>
  );
}
