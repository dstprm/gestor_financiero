/**
 * Stable selectors for Zustand store.
 * React 19 requires selector return values to be referentially stable
 * (or use a custom equality fn) to avoid "getServerSnapshot" infinite loops.
 */
import type { Employee } from '@/types';
import type { OrgState, OrgActions } from './orgStore';

// Stable empty array — avoids creating `[]` literals in selectors
export const EMPTY_EMPLOYEES: Employee[] = [];

/** Select the active scenario's employees. Stable reference when unchanged. */
export function selectEmployees(s: OrgState & OrgActions): Employee[] {
  if (!s.activeScenarioId) return EMPTY_EMPLOYEES;
  return s.scenarios[s.activeScenarioId]?.employees ?? EMPTY_EMPLOYEES;
}
