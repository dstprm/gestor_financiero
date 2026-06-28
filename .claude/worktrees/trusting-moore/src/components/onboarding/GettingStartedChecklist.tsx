'use client';
import { useState, useEffect } from 'react';
import { useOrgStore } from '@/store/orgStore';
import { selectEmployees } from '@/store/selectors';
import { hasSeenOnboarding } from './WelcomeModal';
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const CHECKLIST_KEY = 'simplyorg_checklist';
export const EXPORTED_KEY = 'simplyorg_checklist_exported';

interface ChecklistState {
  dismissed: boolean;
}

function readChecklist(): ChecklistState {
  try {
    const raw = localStorage.getItem(CHECKLIST_KEY);
    return raw ? (JSON.parse(raw) as ChecklistState) : { dismissed: false };
  } catch {
    return { dismissed: false };
  }
}

function writeChecklist(state: ChecklistState) {
  try { localStorage.setItem(CHECKLIST_KEY, JSON.stringify(state)); } catch {}
}

interface Props {
  usingSampleData: boolean;
}

export function GettingStartedChecklist({ usingSampleData }: Props) {
  const employees = useOrgStore(selectEmployees);
  const scenarios = useOrgStore((s) => s.scenarios);

  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [exported, setExported] = useState(false);

  useEffect(() => {
    const state = readChecklist();
    setDismissed(state.dismissed);
    setExported(!!localStorage.getItem(EXPORTED_KEY));
    setMounted(true);

    // Poll for exported flag (set by TopBar when user exports)
    const interval = setInterval(() => {
      setExported(!!localStorage.getItem(EXPORTED_KEY));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const builtChart = employees.length > 0 && !usingSampleData;
  const createdPlan = Object.keys(scenarios).length > 1;
  const allDone = builtChart && createdPlan && exported;

  // Auto-hide once all steps are done
  useEffect(() => {
    if (allDone && mounted) {
      const t = setTimeout(() => {
        setDismissed(true);
        writeChecklist({ dismissed: true });
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [allDone, mounted]);

  // Only show for users who've been through onboarding
  if (!mounted || !hasSeenOnboarding() || dismissed) return null;

  const steps = [
    { label: 'Build your chart', done: builtChart },
    { label: 'Create a plan', done: createdPlan },
    { label: 'Share or export', done: exported },
  ];

  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="absolute bottom-16 left-4 z-10 w-52 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Getting started</span>
          <span className="text-xs text-gray-400 dark:text-slate-500">{doneCount}/3</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-0.5 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 rounded"
          >
            {collapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button
            onClick={() => {
              setDismissed(true);
              writeChecklist({ dismissed: true });
            }}
            className="p-0.5 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 rounded"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="px-3 py-2.5 space-y-2.5">
          {steps.map(({ label, done }) => (
            <div key={label} className="flex items-center gap-2.5">
              <div className={cn(
                'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                done
                  ? 'bg-green-500 border-green-500'
                  : 'border-gray-300 dark:border-slate-600'
              )}>
                {done && <Check size={8} className="text-white" strokeWidth={3} />}
              </div>
              <span className={cn(
                'text-xs leading-snug',
                done
                  ? 'text-gray-400 dark:text-slate-500 line-through'
                  : 'text-gray-700 dark:text-slate-300'
              )}>
                {label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
