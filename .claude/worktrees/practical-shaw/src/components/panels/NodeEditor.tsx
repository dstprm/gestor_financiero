'use client';
import { useState, useEffect } from 'react';
import { useOrgStore } from '@/store/orgStore';
import { selectEmployees } from '@/store/selectors';
import { FLAG_META, STATUS_META, getDeptColor, type Employee, type FlagType, type EmployeeStatus } from '@/types';
import { cn } from '@/lib/utils';
import { X, Trash2, UserPlus, GitBranch } from 'lucide-react';

const STATUSES: EmployeeStatus[] = ['active', 'vacant', 'contractor', 'on-leave', 'proposed'];
const FLAGS: FlagType[] = ['at-risk', 'redundant', 'key-person', 'vacant', 'pinned'];

export function NodeEditor() {
  const { selectedNodeId, updateEmployee, deleteEmployee, setSelectedNode, addSecondaryRelationship, removeSecondaryRelationship, currentUserRole } = useOrgStore();

  const employees = useOrgStore(selectEmployees);
  const employee = employees.find((e) => e.id === selectedNodeId);

  const [draft, setDraft] = useState<Employee | null>(null);
  const [dirty, setDirty] = useState(false);
  const [newSecSupervisorId, setNewSecSupervisorId] = useState('');
  const [newSecLabel, setNewSecLabel] = useState('');
  const [addingSecRel, setAddingSecRel] = useState(false);
  const [showCloseWarning, setShowCloseWarning] = useState(false);

  const canEdit = currentUserRole !== 'VIEWER';

  useEffect(() => {
    if (employee) {
      setDraft(JSON.parse(JSON.stringify(employee)));
      setDirty(false);
      setShowCloseWarning(false);
    } else {
      setDraft(null);
      setShowCloseWarning(false);
    }
  }, [employee?.id, selectedNodeId]);

  if (!employee || !draft) return null;

  function field(key: keyof Employee, value: string) {
    setDraft((d) => d ? { ...d, [key]: value } : d);
    setDirty(true);
  }

  function handleSave() {
    if (!draft) return;
    updateEmployee(draft.id, draft);
    setDirty(false);
  }

  function handleDelete() {
    if (!window.confirm(`Remove ${employee?.name} from the org chart?`)) return;
    deleteEmployee(employee!.id);
    setSelectedNode(null);
  }

  const managers = employees.filter((e) => e.id !== draft.id);
  const currentMgr = managers.find((e) => e.id === draft.managerId);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: getDeptColor(draft.department) }}
          />
          <span className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">{draft.name}</span>
        </div>
        <button
          onClick={() => {
            if (dirty) {
              setShowCloseWarning(true);
            } else {
              setSelectedNode(null);
            }
          }}
          className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      {showCloseWarning && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-700 text-xs text-amber-700 dark:text-amber-300">
          <span className="flex-1">You have unsaved changes.</span>
          <button
            onClick={() => { handleSave(); setSelectedNode(null); }}
            className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium"
          >
            Save
          </button>
          <button
            onClick={() => setSelectedNode(null)}
            className="px-2 py-1 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 rounded text-xs"
          >
            Discard
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Flags */}
        <div>
          <label className="field-label">Flags</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {FLAGS.map((flag) => {
              const meta = FLAG_META[flag];
              const active = draft.flags.includes(flag);
              return (
                <button
                  key={flag}
                  onClick={() => {
                    const flags = active ? draft.flags.filter((f) => f !== flag) : [...draft.flags, flag];
                    setDraft((d) => d ? { ...d, flags } : d);
                    setDirty(true);
                  }}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors',
                    active
                      ? 'border-current bg-current/10'
                      : 'border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:border-gray-400 dark:hover:border-slate-500'
                  )}
                  style={active ? { color: meta.color, borderColor: meta.color + '80' } : undefined}
                >
                  <span>{meta.emoji}</span>
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Name */}
        <Field label="Full Name">
          <input value={draft.name} onChange={(e) => field('name', e.target.value)} className="input-field" />
        </Field>

        {/* Title */}
        <Field label="Job Title">
          <input value={draft.title} onChange={(e) => field('title', e.target.value)} className="input-field" />
        </Field>

        {/* Status */}
        <Field label="Status">
          <select
            value={draft.status}
            onChange={(e) => field('status', e.target.value)}
            className="input-field"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
        </Field>

        {/* Manager */}
        <Field label="Reports To">
          <select
            value={draft.managerId ?? ''}
            onChange={(e) => { setDraft((d) => d ? { ...d, managerId: e.target.value || null } : d); setDirty(true); }}
            className="input-field"
          >
            <option value="">(No manager — root node)</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>{m.name} — {m.title}</option>
            ))}
          </select>
        </Field>

        {/* Department */}
        <Field label="Department">
          <input value={draft.department} onChange={(e) => field('department', e.target.value)} className="input-field" />
        </Field>

        {/* Level */}
        <Field label="Level / Grade">
          <input value={draft.level} onChange={(e) => field('level', e.target.value)} className="input-field" />
        </Field>

        {/* Location */}
        <Field label="Location">
          <input value={draft.location} onChange={(e) => field('location', e.target.value)} className="input-field" />
        </Field>

        {/* Email */}
        <Field label="Email">
          <input type="email" value={draft.email ?? ''} onChange={(e) => field('email', e.target.value)} className="input-field" />
        </Field>

        {/* Employee ID (read-only) */}
        <Field label="Employee ID">
          <input value={draft.id} readOnly className="input-field opacity-50 cursor-default" />
        </Field>

        {/* Dotted-line supervisors */}
        <div>
          <label className="text-xs text-gray-500 dark:text-slate-500 font-medium block mb-1 flex items-center gap-1">
            <GitBranch size={11} />
            Dotted-line Supervisors
          </label>
          <div className="space-y-1 mt-1">
            {(employee.secondaryManagers ?? []).map((rel) => {
              const sup = employees.find((e) => e.id === rel.supervisorId);
              if (!sup) return null;
              return (
                <div key={rel.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded px-2 py-1 text-xs">
                  <span className="flex-1 text-gray-700 dark:text-slate-300 truncate">
                    {sup.name}
                    {rel.label && <span className="text-gray-400 dark:text-slate-500 ml-1">· {rel.label}</span>}
                  </span>
                  {canEdit && (
                    <button
                      onClick={() => void removeSecondaryRelationship(rel.id, employee.id)}
                      className="text-gray-400 dark:text-slate-500 hover:text-red-400 transition-colors shrink-0"
                      title="Remove"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })}
            {(employee.secondaryManagers ?? []).length === 0 && (
              <p className="text-xs text-gray-400 dark:text-slate-600 italic">None</p>
            )}
          </div>
          {canEdit && (
            <div className="mt-2 space-y-1.5">
              <select
                value={newSecSupervisorId}
                onChange={(e) => setNewSecSupervisorId(e.target.value)}
                className="input-field text-xs"
              >
                <option value="">Add dotted-line supervisor…</option>
                {employees
                  .filter((e) => e.id !== draft.id && e.id !== draft.managerId)
                  .filter((e) => !(employee.secondaryManagers ?? []).some((r) => r.supervisorId === e.id))
                  .map((e) => (
                    <option key={e.id} value={e.id}>{e.name} — {e.title}</option>
                  ))}
              </select>
              {newSecSupervisorId && (
                <input
                  value={newSecLabel}
                  onChange={(e) => setNewSecLabel(e.target.value)}
                  placeholder="Label (optional, e.g. Functional supervisor)"
                  className="input-field text-xs"
                />
              )}
              {newSecSupervisorId && (
                <button
                  disabled={addingSecRel}
                  onClick={async () => {
                    setAddingSecRel(true);
                    await addSecondaryRelationship(employee.id, newSecSupervisorId, newSecLabel || undefined);
                    setNewSecSupervisorId('');
                    setNewSecLabel('');
                    setAddingSecRel(false);
                  }}
                  className="w-full px-3 py-1.5 bg-slate-600 hover:bg-slate-500 disabled:opacity-40 text-white rounded-lg text-xs font-medium"
                >
                  {addingSecRel ? 'Adding…' : 'Add'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <Field label="Notes">
          <textarea
            value={draft.notes}
            onChange={(e) => { setDraft((d) => d ? { ...d, notes: e.target.value } : d); setDirty(true); }}
            rows={3}
            className="input-field resize-none"
            placeholder="Consultant notes, observations…"
          />
        </Field>

        {/* Extra metadata */}
        {Object.keys(draft.metadata).length > 0 && (
          <div>
            <label className="field-label">Additional Fields</label>
            <div className="mt-1 space-y-1.5">
              {Object.entries(draft.metadata).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 dark:text-slate-500 w-24 truncate shrink-0">{k}</span>
                  <span className="text-xs text-gray-600 dark:text-slate-400 truncate">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t border-gray-200 dark:border-slate-700 p-3 flex items-center gap-2">
        <button
          onClick={handleDelete}
          className="flex items-center gap-1 px-2 py-1.5 text-gray-400 dark:text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"
          title="Remove employee"
        >
          <Trash2 size={15} />
          <span className="text-xs">Delete</span>
        </button>
        <div className="flex-1" />
        <button
          onClick={() => { setDraft(JSON.parse(JSON.stringify(employee))); setDirty(false); }}
          disabled={!dirty}
          className="px-3 py-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 disabled:opacity-30"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={!dirty}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-500 dark:text-slate-500 font-medium block mb-1">{label}</label>
      {children}
    </div>
  );
}
