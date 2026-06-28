'use client';
import { useMemo } from 'react';
import { useOrgStore } from '@/store/orgStore';
import { diffScenarios, computeHeadcountDelta } from '@/lib/scenarioDiff';
import { exportChangeLogCSV } from '@/lib/exporter';
import { cn } from '@/lib/utils';
import { X, Download } from 'lucide-react';

export function DiffPanel() {
  const { scenarios, activeScenarioId, compareScenarioId, setCompareScenario } = useOrgStore();

  const activeScenario = activeScenarioId ? scenarios[activeScenarioId] : null;
  const compareScenario = compareScenarioId ? scenarios[compareScenarioId] : null;

  const diff = useMemo(() => {
    if (!compareScenario || !activeScenario) return null;
    return diffScenarios(compareScenario.employees, activeScenario.employees);
  }, [compareScenario, activeScenario]);

  const delta = diff ? computeHeadcountDelta(diff) : null;

  if (!compareScenarioId || !compareScenario || !diff) return null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">Scenario Diff</p>
          <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">
            {compareScenario.name} → {activeScenario?.name}
          </p>
        </div>
        <button onClick={() => setCompareScenario(null)} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300">
          <X size={15} />
        </button>
      </div>

      {/* Delta summary */}
      {delta && (
        <div className="flex gap-3 px-4 py-3 bg-gray-50 dark:bg-slate-800/30 border-b border-gray-200 dark:border-slate-700">
          <DeltaBadge value={delta.added} color="green" label="Added" />
          <DeltaBadge value={delta.removed} color="red" label="Removed" />
          <DeltaBadge value={delta.moved} color="blue" label="Moved" />
          <DeltaBadge value={diff.modified.length} color="yellow" label="Modified" />
        </div>
      )}

      <div className="flex-1 overflow-y-auto divide-y divide-gray-200 dark:divide-slate-700/50">
        {/* Added */}
        {diff.added.map((e) => (
          <DiffRow key={e.id} color="green" badge="+" label={e.name} sub={e.title} detail={`New manager: ${e.managerId ?? '(none)'}`} />
        ))}

        {/* Removed */}
        {diff.removed.map((e) => (
          <DiffRow key={e.id} color="red" badge="−" label={e.name} sub={e.title} detail="Removed from org" />
        ))}

        {/* Moved */}
        {diff.moved.map(({ employee, oldManagerId, newManagerId }) => (
          <DiffRow
            key={employee.id}
            color="blue"
            badge="→"
            label={employee.name}
            sub={employee.title}
            detail={`${oldManagerId ?? 'root'} → ${newManagerId ?? 'root'}`}
          />
        ))}

        {/* Modified */}
        {diff.modified.map(({ before, after, changedFields }) => (
          <DiffRow
            key={after.id}
            color="yellow"
            badge="~"
            label={after.name}
            sub={after.title}
            detail={`Changed: ${changedFields.join(', ')}`}
          />
        ))}

        {diff.added.length + diff.removed.length + diff.moved.length + diff.modified.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <div className="text-2xl">🟰</div>
            <p className="text-sm text-gray-500 dark:text-slate-400">No differences found</p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-slate-700 p-3">
        <button
          onClick={() => exportChangeLogCSV(diff, compareScenario.name, activeScenario?.name ?? 'Active')}
          className="w-full flex items-center justify-center gap-2 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-600 dark:text-slate-300"
        >
          <Download size={13} />
          Export Change Log CSV
        </button>
      </div>
    </div>
  );
}

function DeltaBadge({ value, color, label }: { value: number; color: string; label: string }) {
  const colors: Record<string, string> = {
    green: 'text-green-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    yellow: 'text-yellow-400',
  };
  return (
    <div className="text-center">
      <p className={cn('text-lg font-bold', colors[color])}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-slate-500">{label}</p>
    </div>
  );
}

function DiffRow({
  color,
  badge,
  label,
  sub,
  detail,
}: {
  color: string;
  badge: string;
  label: string;
  sub: string;
  detail: string;
}) {
  const bgs: Record<string, string> = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
  };
  const texts: Record<string, string> = {
    green: 'text-green-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    yellow: 'text-yellow-400',
  };
  return (
    <div className="flex items-start gap-3 px-4 py-2.5">
      <span className={cn('text-xs font-bold px-1 py-0.5 rounded text-white mt-0.5 shrink-0', bgs[color])}>
        {badge}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 dark:text-slate-200 font-medium truncate">{label}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{sub}</p>
        <p className={cn('text-xs mt-0.5 truncate', texts[color])}>{detail}</p>
      </div>
    </div>
  );
}
