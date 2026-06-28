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
import { WelcomeModal, hasSeenOnboarding } from './onboarding/WelcomeModal';
import { AddPersonModal } from './panels/AddPersonModal';

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

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAddPersonFromOnboarding, setShowAddPersonFromOnboarding] = useState(false);

  useEffect(() => {
    // Hydrate persisted state from localStorage on client mount
    useOrgStore.persist.rehydrate();
  }, []);

  // Show onboarding modal for new users with an empty chart
  useEffect(() => {
    if (dataReady && employees.length === 0 && !hasSeenOnboarding()) {
      setShowWelcome(true);
    }
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

        <main className="flex-1 overflow-hidden flex flex-col min-w-0 mobile-content-pad">
          <OrgChart />
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
