'use client';
import { useOrgStore } from '@/store/orgStore';
import { cn } from '@/lib/utils';
import type { DataIssue, IssueSeverity } from '@/types';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const SEVERITY_META: Record<IssueSeverity, { icon: typeof AlertCircle; color: string; bg: string }> = {
  error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' },
};

const TYPE_LABELS: Record<DataIssue['type'], string> = {
  'self-reporting': 'Self-Reporting',
  'circular-reporting': 'Circular Chain',
  'missing-manager': 'Missing Manager',
  'duplicate-id': 'Duplicate ID',
  'multiple-roots': 'Multiple Roots',
  'same-level-reporting': 'Same Level',
  'large-span': 'Large Span',
  'orphaned-subtree': 'Orphaned Group',
};

export function DataIssuesPanel() {
  const { dataIssues, issueFilter, setIssueFilter, spanOfControlThreshold, setSpanThreshold } = useOrgStore();

  const errors = dataIssues.filter((i) => i.severity === 'error');
  const warnings = dataIssues.filter((i) => i.severity === 'warning');
  const infos = dataIssues.filter((i) => i.severity === 'info');

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 dark:border-slate-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Data Issues</span>
        <div className="flex items-center gap-1.5">
          {errors.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full">{errors.length} error{errors.length > 1 ? 's' : ''}</span>
          )}
          {warnings.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">{warnings.length} warn</span>
          )}
        </div>
      </div>

      {issueFilter && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-blue-600/10 border-b border-blue-600/20">
          <span className="text-xs text-blue-400">Highlighting issue in chart</span>
          <button onClick={() => setIssueFilter(null)} className="text-blue-400 hover:text-blue-300">
            <X size={12} />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {dataIssues.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <div className="text-2xl">✅</div>
            <p className="text-sm text-gray-500 dark:text-slate-400">No data issues found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-slate-700/50">
            {dataIssues.map((issue) => {
              const meta = SEVERITY_META[issue.severity];
              const Icon = meta.icon;
              const isActive = issueFilter === issue.id;

              return (
                <button
                  key={issue.id}
                  onClick={() => setIssueFilter(isActive ? null : issue.id)}
                  className={cn(
                    'w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-slate-800/50 transition-colors',
                    isActive && 'bg-blue-600/10'
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={cn('p-1 rounded mt-0.5', meta.bg)}>
                      <Icon size={11} className={meta.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={cn('text-xs font-medium', meta.color)}>
                          {TYPE_LABELS[issue.type]}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-slate-600">
                          {issue.affectedIds.length} node{issue.affectedIds.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 leading-tight">{issue.message}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="border-t border-gray-200 dark:border-slate-700 p-3">
        <label className="text-xs text-gray-500 dark:text-slate-500 block mb-1.5">Span of control threshold</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={3}
            max={20}
            value={spanOfControlThreshold}
            onChange={(e) => setSpanThreshold(Number(e.target.value))}
            className="flex-1 accent-blue-500"
          />
          <span className="text-xs text-gray-600 dark:text-slate-300 w-4 text-right">{spanOfControlThreshold}</span>
        </div>
      </div>
    </div>
  );
}
