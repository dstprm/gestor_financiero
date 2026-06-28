import type { Employee, DataIssue, IssueType, IssueSeverity } from '@/types';

let issueCounter = 0;
function makeId() {
  return `issue-${++issueCounter}`;
}

function mkIssue(
  type: IssueType,
  severity: IssueSeverity,
  message: string,
  affectedIds: string[]
): DataIssue {
  return { id: makeId(), type, severity, message, affectedIds };
}

/** Detect employees whose managerId equals their own id */
function checkSelfReporting(employees: Employee[]): DataIssue[] {
  return employees
    .filter((e) => e.managerId === e.id)
    .map((e) =>
      mkIssue('self-reporting', 'error', `${e.name} is their own manager`, [e.id])
    );
}

/** Detect duplicate employee IDs */
function checkDuplicateIds(employees: Employee[]): DataIssue[] {
  const seen = new Map<string, string[]>();
  for (const e of employees) {
    const arr = seen.get(e.id) ?? [];
    arr.push(e.name);
    seen.set(e.id, arr);
  }
  const issues: DataIssue[] = [];
  for (const [id, names] of seen.entries()) {
    if (names.length > 1) {
      issues.push(
        mkIssue(
          'duplicate-id',
          'error',
          `ID "${id}" used by ${names.join(', ')}`,
          employees.filter((e) => e.id === id).map((e) => e.id)
        )
      );
    }
  }
  return issues;
}

/** Detect manager IDs that reference no employee */
function checkMissingManagers(employees: Employee[]): DataIssue[] {
  const ids = new Set(employees.map((e) => e.id));
  const issues: DataIssue[] = [];
  for (const e of employees) {
    if (e.managerId && !ids.has(e.managerId)) {
      issues.push(
        mkIssue(
          'missing-manager',
          'warning',
          `${e.name}'s manager ID "${e.managerId}" not found in roster`,
          [e.id]
        )
      );
    }
  }
  return issues;
}

/** Detect cycles in reporting structure (DFS) */
function checkCircularReporting(employees: Employee[]): DataIssue[] {
  const managerMap = new Map<string, string | null>();
  for (const e of employees) managerMap.set(e.id, e.managerId);

  const issues: DataIssue[] = [];
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(id: string, path: string[]): boolean {
    if (inStack.has(id)) {
      const cycleStart = path.indexOf(id);
      const cycle = path.slice(cycleStart);
      const names = cycle.map(
        (cid) => employees.find((e) => e.id === cid)?.name ?? cid
      );
      issues.push(
        mkIssue(
          'circular-reporting',
          'error',
          `Circular chain: ${names.join(' → ')} → ${names[0]}`,
          cycle
        )
      );
      return true;
    }
    if (visited.has(id)) return false;
    visited.add(id);
    inStack.add(id);
    path.push(id);
    const mgr = managerMap.get(id);
    if (mgr && managerMap.has(mgr)) {
      dfs(mgr, path);
    }
    path.pop();
    inStack.delete(id);
    return false;
  }

  for (const e of employees) {
    if (!visited.has(e.id)) dfs(e.id, []);
  }
  return issues;
}

/** Detect multiple root nodes (no manager) */
function checkMultipleRoots(employees: Employee[]): DataIssue[] {
  const ids = new Set(employees.map((e) => e.id));
  const roots = employees.filter(
    (e) => !e.managerId || !ids.has(e.managerId)
  );
  if (roots.length > 1) {
    return [
      mkIssue(
        'multiple-roots',
        'info',
        `${roots.length} root nodes found: ${roots.map((e) => e.name).join(', ')}`,
        roots.map((e) => e.id)
      ),
    ];
  }
  return [];
}

/** Detect same-level reporting (employee and manager share same level) */
function checkSameLevelReporting(employees: Employee[]): DataIssue[] {
  const byId = new Map(employees.map((e) => [e.id, e]));
  const issues: DataIssue[] = [];
  for (const e of employees) {
    if (!e.managerId) continue;
    const mgr = byId.get(e.managerId);
    if (mgr && e.level && mgr.level && e.level === mgr.level) {
      issues.push(
        mkIssue(
          'same-level-reporting',
          'warning',
          `${e.name} (${e.level}) reports to ${mgr.name} who shares the same level`,
          [e.id, mgr.id]
        )
      );
    }
  }
  return issues;
}

/** Detect managers with too many direct reports */
function checkLargeSpans(employees: Employee[], threshold = 10): DataIssue[] {
  const directReports = new Map<string, string[]>();
  for (const e of employees) {
    if (!e.managerId) continue;
    const arr = directReports.get(e.managerId) ?? [];
    arr.push(e.id);
    directReports.set(e.managerId, arr);
  }
  const issues: DataIssue[] = [];
  for (const [mgrId, reports] of directReports.entries()) {
    if (reports.length > threshold) {
      const mgr = employees.find((e) => e.id === mgrId);
      issues.push(
        mkIssue(
          'large-span',
          'warning',
          `${mgr?.name ?? mgrId} has ${reports.length} direct reports (threshold: ${threshold})`,
          [mgrId, ...reports]
        )
      );
    }
  }
  return issues;
}

/** Detect orphaned subtrees not connected to main tree */
function checkOrphanedSubtrees(employees: Employee[]): DataIssue[] {
  const ids = new Set(employees.map((e) => e.id));
  // Build adjacency: child -> parent
  const parentMap = new Map<string, string | null>();
  for (const e of employees) {
    parentMap.set(e.id, e.managerId && ids.has(e.managerId) ? e.managerId : null);
  }

  // Find all roots (no valid parent)
  const roots = employees.filter((e) => !parentMap.get(e.id));
  if (roots.length <= 1) return [];

  // BFS from largest component root
  const childrenMap = new Map<string, string[]>();
  for (const [id, parentId] of parentMap.entries()) {
    if (!parentId) continue;
    const arr = childrenMap.get(parentId) ?? [];
    arr.push(id);
    childrenMap.set(parentId, arr);
  }

  function bfsSize(rootId: string): Set<string> {
    const component = new Set<string>();
    const queue = [rootId];
    while (queue.length) {
      const node = queue.shift()!;
      component.add(node);
      for (const child of childrenMap.get(node) ?? []) queue.push(child);
    }
    return component;
  }

  const components = roots.map((r) => bfsSize(r.id));
  components.sort((a, b) => b.size - a.size); // largest first
  const [main, ...orphans] = components;
  void main;

  const issues: DataIssue[] = [];
  for (const component of orphans) {
    const names = [...component]
      .map((id) => employees.find((e) => e.id === id)?.name ?? id)
      .slice(0, 3);
    issues.push(
      mkIssue(
        'orphaned-subtree',
        'warning',
        `Disconnected group of ${component.size}: ${names.join(', ')}${component.size > 3 ? '…' : ''}`,
        [...component]
      )
    );
  }
  return issues;
}

export function runDataQualityChecks(
  employees: Employee[],
  spanThreshold = 10
): DataIssue[] {
  issueCounter = 0;
  return [
    ...checkSelfReporting(employees),
    ...checkDuplicateIds(employees),
    ...checkMissingManagers(employees),
    ...checkCircularReporting(employees),
    ...checkMultipleRoots(employees),
    ...checkSameLevelReporting(employees),
    ...checkLargeSpans(employees, spanThreshold),
    ...checkOrphanedSubtrees(employees),
  ];
}
