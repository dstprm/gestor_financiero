'use client';
import { useState } from 'react';
import { useOrgStore } from '@/store/orgStore';
import { diffScenarios, computeHeadcountDelta } from '@/lib/scenarioDiff';
import { formatDate, cn } from '@/lib/utils';
import { Plus, Copy, Trash2, Star, Edit2, GitCompare, Check, X } from 'lucide-react';

export function ScenarioPanel() {
  const {
    scenarios, activeScenarioId, baselineScenarioId,
    switchScenario, createScenario, deleteScenario,
    renameScenario, promoteToBaseline, cloneScenario,
    setCompareScenario, compareScenarioId,
  } = useOrgStore();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const sortedScenarios = Object.values(scenarios).sort((a, b) => a.createdAt - b.createdAt);
  const baselineScenario = baselineScenarioId ? scenarios[baselineScenarioId] : null;

  function handleCreate() {
    if (!newName.trim()) return;
    createScenario(newName.trim(), newDesc.trim(), activeScenarioId ?? undefined);
    setNewName('');
    setNewDesc('');
    setCreating(false);
  }

  function startEdit(id: string) {
    const s = scenarios[id];
    setEditingId(id);
    setEditName(s.name);
    setEditDesc(s.description);
  }

  function saveEdit() {
    if (!editingId || !editName.trim()) return;
    renameScenario(editingId, editName.trim(), editDesc.trim());
    setEditingId(null);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 dark:border-slate-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Scenarios</span>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
        >
          <Plus size={13} />
          New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-14">
        {/* Create form */}
        {creating && (
          <div className="p-3 border-b border-gray-200 dark:border-slate-700 space-y-2 bg-gray-50 dark:bg-slate-800/50">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false); }}
              placeholder="Scenario name…"
              className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded px-2.5 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)…"
              className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded px-2.5 py-1.5 text-xs text-gray-600 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-2">
              <button onClick={handleCreate} className="flex-1 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium">
                Create
              </button>
              <button onClick={() => setCreating(false)} className="flex-1 py-1 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-600 dark:text-slate-300 rounded text-xs">
                Cancel
              </button>
            </div>
          </div>
        )}

        {sortedScenarios.map((scenario) => {
          const isActive = scenario.id === activeScenarioId;
          const isBaseline = scenario.id === baselineScenarioId;
          const isCompare = scenario.id === compareScenarioId;
          const isEditing = editingId === scenario.id;

          // Compute delta vs baseline
          let delta = null;
          if (!isBaseline && baselineScenario && !isEditing) {
            const diff = diffScenarios(baselineScenario.employees, scenario.employees);
            const d = computeHeadcountDelta(diff);
            delta = d;
          }

          return (
            <div
              key={scenario.id}
              onClick={() => !isEditing && switchScenario(scenario.id)}
              className={cn(
                'group border-b border-gray-200 dark:border-slate-700/50 cursor-pointer transition-colors',
                isActive ? 'bg-blue-600/10 border-l-2 border-l-blue-500' : 'hover:bg-gray-100 dark:hover:bg-slate-800/50 border-l-2 border-l-transparent'
              )}
            >
              {isEditing ? (
                <div className="p-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <input
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Description…"
                    className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-gray-600 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-1">
                    <button onClick={saveEdit} className="p-1 text-green-400 hover:text-green-300"><Check size={14} /></button>
                    <button onClick={() => setEditingId(null)} className="p-1 text-red-400 hover:text-red-300"><X size={14} /></button>
                  </div>
                </div>
              ) : (
                <div className="p-3">
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className={cn('w-2 h-2 rounded-full shrink-0', isActive ? 'bg-blue-400' : 'bg-gray-300 dark:bg-slate-600')} />
                      <span className={cn('text-sm font-medium truncate', isActive ? 'text-blue-600 dark:text-blue-300' : 'text-gray-800 dark:text-slate-200')}>
                        {scenario.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); startEdit(scenario.id); }}
                        className="p-1 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 rounded"
                        title="Rename"
                      >
                        <Edit2 size={11} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); cloneScenario(scenario.id, `${scenario.name} (copy)`); }}
                        className="p-1 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 rounded"
                        title="Clone"
                      >
                        <Copy size={11} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); promoteToBaseline(scenario.id); }}
                        className={cn('p-1 rounded', isBaseline ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-400 dark:text-slate-500 hover:text-yellow-500 dark:hover:text-yellow-400')}
                        title={isBaseline ? 'This is baseline' : 'Set as baseline'}
                      >
                        <Star size={11} fill={isBaseline ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCompareScenario(isCompare ? null : scenario.id);
                        }}
                        className={cn('p-1 rounded', isCompare ? 'text-purple-500 dark:text-purple-400' : 'text-gray-400 dark:text-slate-500 hover:text-purple-500 dark:hover:text-purple-400')}
                        title={isCompare ? 'Stop comparing' : 'Compare with active'}
                      >
                        <GitCompare size={11} />
                      </button>
                      {Object.keys(scenarios).length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteScenario(scenario.id); }}
                          className="p-1 text-gray-400 dark:text-slate-500 hover:text-red-400 rounded"
                          title="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tags row */}
                  <div className="flex items-center gap-1.5 mt-1">
                    {isBaseline && (
                      <span className="text-xs px-1.5 py-0.5 bg-yellow-500/15 text-yellow-400 rounded">baseline</span>
                    )}
                    {isCompare && (
                      <span className="text-xs px-1.5 py-0.5 bg-purple-500/15 text-purple-400 rounded">comparing</span>
                    )}
                    <span className="text-xs text-gray-400 dark:text-slate-500">{scenario.employees.length} people</span>
                  </div>

                  {/* Description */}
                  {scenario.description && (
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 leading-tight line-clamp-2">{scenario.description}</p>
                  )}

                  {/* Delta badge */}
                  {delta && (delta.added > 0 || delta.removed > 0 || delta.moved > 0) && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {delta.added > 0 && <span className="text-xs text-green-400">+{delta.added}</span>}
                      {delta.removed > 0 && <span className="text-xs text-red-400">-{delta.removed}</span>}
                      {delta.moved > 0 && <span className="text-xs text-blue-400">~{delta.moved} moved</span>}
                      <span className="text-xs text-gray-400 dark:text-slate-500">vs baseline</span>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 dark:text-slate-600 mt-1">{formatDate(scenario.createdAt)}</p>
                </div>
              )}
            </div>
          );
        })}

        {sortedScenarios.length === 0 && (
          <div className="p-4 text-center text-gray-500 dark:text-slate-500 text-sm">
            No scenarios yet. Load data to get started.
          </div>
        )}
      </div>
    </div>
  );
}
