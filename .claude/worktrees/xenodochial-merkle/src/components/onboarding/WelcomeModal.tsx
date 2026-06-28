'use client';

import { Upload, UserPlus, LayoutTemplate } from 'lucide-react';
import { useOrgStore } from '@/store/orgStore';
import { cn } from '@/lib/utils';
import type { Employee } from '@/types';

const ONBOARDING_KEY = 'simplyorg_onboarding_seen';

export function markOnboardingSeen() {
  try { localStorage.setItem(ONBOARDING_KEY, '1'); } catch { /* ignore */ }
}

export function hasSeenOnboarding(): boolean {
  try { return !!localStorage.getItem(ONBOARDING_KEY); } catch { return false; }
}

const TEMPLATE_EMPLOYEES: Employee[] = [
  { id: 'OB001', name: 'Alex Johnson', title: 'Chief Executive Officer', managerId: null, department: 'Executive', level: 'C-Suite', location: '', status: 'active', flags: [], notes: '', metadata: {} },
  { id: 'OB002', name: 'Sam Lee', title: 'VP Engineering', managerId: 'OB001', department: 'Engineering', level: 'VP', location: '', status: 'active', flags: [], notes: '', metadata: {} },
  { id: 'OB003', name: 'Jordan Rivera', title: 'VP Operations', managerId: 'OB001', department: 'Operations', level: 'VP', location: '', status: 'active', flags: [], notes: '', metadata: {} },
  { id: 'OB004', name: 'Priya Patel', title: 'Engineering Manager', managerId: 'OB002', department: 'Engineering', level: 'Manager', location: '', status: 'active', flags: [], notes: '', metadata: {} },
  { id: 'OB005', name: 'Chris Davis', title: 'Operations Manager', managerId: 'OB003', department: 'Operations', level: 'Manager', location: '', status: 'active', flags: [], notes: '', metadata: {} },
];

interface WelcomeModalProps {
  onImport: () => void;
  onAddManually: () => void;
  onDismiss: () => void;
}

export function WelcomeModal({ onImport, onAddManually, onDismiss }: WelcomeModalProps) {
  const { applyImport } = useOrgStore();

  function handleImport() {
    markOnboardingSeen();
    onImport();
  }

  function handleAddManually() {
    markOnboardingSeen();
    onAddManually();
  }

  function handleTemplate() {
    markOnboardingSeen();
    applyImport(TEMPLATE_EMPLOYEES, 'Getting Started');
    onDismiss();
  }

  function handleSkip() {
    markOnboardingSeen();
    onDismiss();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mx-auto mb-4 text-2xl select-none">
            🌱
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-1">
            Welcome to SimplyOrg
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Let&apos;s build your first org chart
          </p>
        </div>

        {/* Options */}
        <div className="px-6 pb-4 space-y-2.5">
          <ActionButton
            icon={<Upload size={18} />}
            title="Import from Excel / CSV"
            desc="Upload a spreadsheet with your existing team data"
            onClick={handleImport}
          />
          <ActionButton
            icon={<UserPlus size={18} />}
            title="Add people manually"
            desc="Build your chart one person at a time"
            onClick={handleAddManually}
          />
          <ActionButton
            icon={<LayoutTemplate size={18} />}
            title="Start from a template"
            desc="Generate a 5-person sample chart instantly"
            onClick={handleTemplate}
            highlight
          />
        </div>

        {/* Skip */}
        <div className="px-6 pb-6 text-center">
          <button
            onClick={handleSkip}
            className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  highlight?: boolean;
}

function ActionButton({ icon, title, desc, onClick, highlight }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-all',
        highlight
          ? 'border-blue-200 dark:border-blue-700/60 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50'
      )}
    >
      <div className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
        highlight
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
      )}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className={cn(
          'text-sm font-medium',
          highlight ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-slate-100'
        )}>
          {title}
        </div>
        <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{desc}</div>
      </div>
    </button>
  );
}
