'use client';
import { useMemo } from 'react';
import { useOrgStore } from '@/store/orgStore';
import { selectEmployees } from '@/store/selectors';
import { getDeptColor, type Employee } from '@/types';
import { cn } from '@/lib/utils';
import { Users, Building2, Layers, GitBranch, UserX } from 'lucide-react';

function computeAnalytics(employees: Employee[]) {
  if (employees.length === 0) return null;

  const ids = new Set(employees.map((e) => e.id));

  // Direct reports map
  const directReports = new Map<string, string[]>();
  for (const e of employees) {
    if (!e.managerId || !ids.has(e.managerId)) continue;
    const arr = directReports.get(e.managerId) ?? [];
    arr.push(e.id);
    directReports.set(e.managerId, arr);
  }

  // Org depth
  function depth(id: string, memo: Map<string, number>): number {
    if (memo.has(id)) return memo.get(id)!;
    const e = employees.find((emp) => emp.id === id);
    if (!e || !e.managerId || !ids.has(e.managerId)) { memo.set(id, 0); return 0; }
    const d = 1 + depth(e.managerId, memo);
    memo.set(id, d);
    return d;
  }
  const memo = new Map<string, number>();
  const maxDepth = Math.max(...employees.map((e) => depth(e.id, memo)));

  const managers = employees.filter((e) => directReports.has(e.id));
  const ics = employees.filter((e) => !directReports.has(e.id) && e.status !== 'vacant');
  const vacants = employees.filter((e) => e.status === 'vacant');

  const spans = [...directReports.values()].map((arr) => arr.length);
  const avgSpan = spans.length ? spans.reduce((a, b) => a + b, 0) / spans.length : 0;
  const maxSpan = spans.length ? Math.max(...spans) : 0;

  // By department
  const byDept: Record<string, number> = {};
  for (const e of employees) {
    byDept[e.department] = (byDept[e.department] ?? 0) + 1;
  }
  const deptList = Object.entries(byDept).sort((a, b) => b[1] - a[1]);

  // By level
  const byLevel: Record<string, number> = {};
  for (const e of employees) {
    if (!e.level) continue;
    byLevel[e.level] = (byLevel[e.level] ?? 0) + 1;
  }
  const levelList = Object.entries(byLevel).sort((a, b) => b[1] - a[1]);

  return {
    total: employees.length,
    managers: managers.length,
    ics: ics.length,
    vacants: vacants.length,
    avgSpan: avgSpan.toFixed(1),
    maxSpan,
    maxDepth,
    deptList,
    levelList,
    mgrToIcRatio: ics.length ? (managers.length / ics.length).toFixed(2) : '—',
  };
}

export function AnalyticsSidebar() {
  const employees = useOrgStore(selectEmployees);
  const analytics = useMemo(() => computeAnalytics(employees), [employees]);

  if (!analytics) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-slate-500 text-sm">
        Load data to see analytics
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-3 py-2.5 border-b border-gray-200 dark:border-slate-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Analytics</span>
      </div>

      <div className="p-3 space-y-4">
        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-2">
          <KPI icon={<Users size={14} />} label="Total Headcount" value={analytics.total} />
          <KPI icon={<Layers size={14} />} label="Org Depth" value={analytics.maxDepth} />
          <KPI icon={<Building2 size={14} />} label="Managers" value={analytics.managers} />
          <KPI icon={<GitBranch size={14} />} label="Avg Span" value={analytics.avgSpan} />
          <KPI icon={<UserX size={14} />} label="Vacancies" value={analytics.vacants} accent="yellow" />
          <KPI icon={<Users size={14} />} label="Mgr:IC Ratio" value={analytics.mgrToIcRatio} />
        </div>

        {/* Max span */}
        <div className="bg-gray-100/80 dark:bg-slate-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-slate-500 mb-1">Max Span of Control</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{analytics.maxSpan}</p>
        </div>

        {/* By Department */}
        <Section title="By Department">
          {analytics.deptList.slice(0, 8).map(([dept, count]) => (
            <Bar
              key={dept}
              label={dept}
              value={count}
              total={analytics.total}
              color={getDeptColor(dept)}
            />
          ))}
        </Section>

        {/* By Level */}
        {analytics.levelList.length > 0 && (
          <Section title="By Level">
            {analytics.levelList.map(([level, count]) => (
              <Bar
                key={level}
                label={level}
                value={count}
                total={analytics.total}
                color="#6366f1"
              />
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

function KPI({
  icon,
  label,
  value,
  accent = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: 'default' | 'yellow';
}) {
  return (
    <div className="bg-gray-100/80 dark:bg-slate-800/50 rounded-lg p-2.5">
      <div className={cn('flex items-center gap-1 mb-1', accent === 'yellow' ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-500 dark:text-slate-400')}>
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={cn('text-xl font-bold', accent === 'yellow' ? 'text-yellow-600 dark:text-yellow-300' : 'text-gray-900 dark:text-white')}>
        {value}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-slate-500 font-medium uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-xs text-gray-500 dark:text-slate-400 truncate max-w-28">{label}</span>
        <span className="text-xs text-gray-500 dark:text-slate-400">{value}</span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
