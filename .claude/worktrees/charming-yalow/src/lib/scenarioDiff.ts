import type { Employee, ScenarioDiff } from '@/types';

export function diffScenarios(baseline: Employee[], target: Employee[]): ScenarioDiff {
  const baseMap = new Map(baseline.map((e) => [e.id, e]));
  const targetMap = new Map(target.map((e) => [e.id, e]));

  const added: Employee[] = [];
  const removed: Employee[] = [];
  const moved: ScenarioDiff['moved'] = [];
  const modified: ScenarioDiff['modified'] = [];

  // Added: in target but not baseline
  for (const e of target) {
    if (!baseMap.has(e.id)) added.push(e);
  }

  // Removed: in baseline but not target
  for (const e of baseline) {
    if (!targetMap.has(e.id)) removed.push(e);
  }

  // Changed: in both
  for (const after of target) {
    const before = baseMap.get(after.id);
    if (!before) continue;

    const wasMoved = before.managerId !== after.managerId;
    const changedFields: string[] = [];

    const compareFields: (keyof Employee)[] = [
      'name', 'title', 'department', 'level', 'location', 'status', 'email',
    ];
    for (const f of compareFields) {
      if (before[f] !== after[f]) changedFields.push(f);
    }

    if (wasMoved) {
      moved.push({ employee: after, oldManagerId: before.managerId, newManagerId: after.managerId });
    } else if (changedFields.length > 0) {
      modified.push({ before, after, changedFields });
    }
  }

  return { added, removed, moved, modified };
}

export interface HeadcountDelta {
  added: number;
  removed: number;
  moved: number;
}

export function computeHeadcountDelta(diff: ScenarioDiff): HeadcountDelta {
  return {
    added: diff.added.length,
    removed: diff.removed.length,
    moved: diff.moved.length,
  };
}
