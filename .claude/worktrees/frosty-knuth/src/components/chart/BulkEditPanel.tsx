'use client';
import { useState, useEffect } from 'react';
import { useOrgStore } from '@/store/orgStore';
import { selectEmployees } from '@/store/selectors';
import { FLAG_META, type FlagType } from '@/types';
import { cn } from '@/lib/utils';
import { Users, X } from 'lucide-react';

const FLAGS: FlagType[] = ['at-risk', 'redundant', 'key-person', 'vacant', 'pinned'];

export function BulkEditPanel() {
  const { selectedIds, clearSelection, bulkUpdateEmployees, bulkToggleFlag } = useOrgStore();
  const employees = useOrgStore(selectEmployees);

  const selected = employees.filter((e) => selectedIds.includes(e.id));

  const departments = [...new Set(selected.map((e) => e.department))];
  const managerIds = [...new Set(selected.map((e) => e.managerId ?? ''))];
  const sharedDept = departments.length === 1 ? (departments[0] ?? '') : '';
  const sharedManagerId = managerIds.length === 1 ? managerIds[0] : '__mixed__';

  const [deptDraft, setDeptDraft] = useState(sharedDept);
  const [managerDraft, setManagerDraft] = useState<string>(
    sharedManagerId === '__mixed__' ? '__mixed__' : sharedManagerId
  );
  const [deptDirty, setDeptDirty] = useState(false);
  const [managerDirty, setManagerDirty] = useState(false);

  // Reset drafts when selection changes
  useEffect(() => {
    setDeptDraft(sharedDept);
    setManagerDraft(sharedManagerId === '__mixed__' ? '__mixed__' : sharedManagerId);
    setDeptDirty(false);
    setManagerDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds.join(',')]);

  const managers = employees.filter((e) => !selectedIds.includes(e.id));

  function applyDept() {
    bulkUpdateEmployees(selectedIds, { department: deptDraft });
    setDeptDirty(false);
  }

  function applyManager() {
    const newManagerId = managerDraft === '__mixed__' || managerDraft === '' ? null : managerDraft;
    bulkUpdateEmployees(selectedIds, { managerId: newManagerId });
    setManagerDirty(false);
  }

  if (selected.length === 0) return null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-violet-500" />
          <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">
            {selectedIds.length} selected
          </span>
        </div>
        <button
          onClick={clearSelection}
          className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
          title="Clear selection"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <p className="text-xs text-gray-400 dark:text-slate-500">
          Changes apply to all {selectedIds.length} employees at once and can be undone together.
        </p>

        {/* Department */}
        <div>
          <label className="text-xs text-gray-500 dark:text-slate-500 font-medium block mb-1">
            Department
          </label>
          <input
            value={deptDraft}
            onChange={(e) => { setDeptDraft(e.target.value); setDeptDirty(true); }}
            placeholder={departments.length > 1 ? `Multiple values (${departments.slice(0, 3).join(', ')}${departments.length > 3 ? '…' : ''})` : undefined}
            className="input-field"
          />
          {deptDirty && (
            <button
              onClick={applyDept}
              className="mt-1.5 w-full px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Apply to all {selectedIds.length}
            </button>
          )}
        </div>

        {/* Manager */}
        <div>
          <label className="text-xs text-gray-500 dark:text-slate-500 font-medium block mb-1">
            Reports To
          </label>
          <select
            value={managerDraft}
            onChange={(e) => { setManagerDraft(e.target.value); setManagerDirty(true); }}
            className="input-field"
          >
            {managerDraft === '__mixed__' && !managerDirty && (
              <option value="__mixed__">— Multiple values —</option>
            )}
            <option value="">(No manager — root)</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.title}
              </option>
            ))}
          </select>
          {managerDirty && (
            <button
              onClick={applyManager}
              className="mt-1.5 w-full px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Apply to all {selectedIds.length}
            </button>
          )}
        </div>

        {/* Flags */}
        <div>
          <label className="text-xs text-gray-500 dark:text-slate-500 font-medium block mb-1">
            Flags
          </label>
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">
            Solid = all have it · Outline = some have it · Empty = none have it
          </p>
          <div className="flex flex-wrap gap-1.5">
            {FLAGS.map((flag) => {
              const meta = FLAG_META[flag];
              const allHave = selected.every((e) => e.flags.includes(flag));
              const someHave = selected.some((e) => e.flags.includes(flag));
              return (
                <button
                  key={flag}
                  onClick={() => bulkToggleFlag(selectedIds, flag)}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors',
                    allHave
                      ? 'border-current bg-current/10'
                      : someHave
                      ? 'border-dashed border-current opacity-60'
                      : 'border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:border-gray-400 dark:hover:border-slate-500'
                  )}
                  style={someHave ? { color: meta.color, borderColor: meta.color + '80' } : undefined}
                  title={allHave ? `Remove ${meta.label} from all` : `Add ${meta.label} to all`}
                >
                  <span>{meta.emoji}</span>
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-slate-700 p-3">
        <button
          onClick={clearSelection}
          className="w-full px-3 py-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-lg transition-colors"
        >
          Clear selection
        </button>
      </div>
    </div>
  );
}
