export type EmployeeStatus = 'active' | 'vacant' | 'contractor' | 'on-leave' | 'proposed';
export type FlagType = 'at-risk' | 'redundant' | 'key-person' | 'vacant' | 'pinned';
export type LayoutDirection = 'TB' | 'LR';
export type RightPanelMode = 'editor' | 'analytics' | 'diff' | 'add-employee' | 'bulk-edit' | null;
export type IssueSeverity = 'error' | 'warning' | 'info';

export type IssueType =
  | 'self-reporting'
  | 'circular-reporting'
  | 'missing-manager'
  | 'duplicate-id'
  | 'multiple-roots'
  | 'same-level-reporting'
  | 'large-span'
  | 'orphaned-subtree';

export interface Employee {
  id: string;
  name: string;
  title: string;
  managerId: string | null;
  department: string;
  level: string;
  location: string;
  status: EmployeeStatus;
  email?: string;
  flags: FlagType[];
  notes: string;
  metadata: Record<string, string>;
  positionX?: number | null;
  positionY?: number | null;
  secondaryManagers?: { id: string; supervisorId: string; label?: string | null }[];
}

export interface DataIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  message: string;
  affectedIds: string[];
}

export interface ScenarioSnapshot {
  id: string;
  /** DB Scenario table row ID (null for baseline, which lives in the Employee table) */
  dbId?: string | null;
  name: string;
  description: string;
  createdAt: number;
  employees: Employee[];
  isBaseline: boolean;
}

export interface ScenarioDiff {
  added: Employee[];
  removed: Employee[];
  moved: Array<{ employee: Employee; oldManagerId: string | null; newManagerId: string | null }>;
  modified: Array<{ before: Employee; after: Employee; changedFields: string[] }>;
}

export interface ColumnMapping {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  managerId?: string;
  managerName?: string;
  department?: string;
  level?: string;
  location?: string;
  status?: string;
  email?: string;
}

// PPTX export theming
export interface PptxTheme {
  /** 6 hex colors (no #) for depth levels 0–5; depth 5 applies to all deeper levels */
  colors: [string, string, string, string, string, string];
  fontFace: string;
  /** Label shown under direct-report count, e.g. "direct reports". Empty = hidden. */
  directReportsLabel: string;
}

export const PPTX_DEPTH_LABELS: [string, string, string, string, string, string] = [
  'Root (CEO)',
  'Executive',
  'Senior Leadership',
  'Management',
  'Team Lead',
  'Individual / Other',
];

export const DEFAULT_PPTX_THEME: PptxTheme = {
  colors: ['194388', 'C4D6F4', 'D9EEF2', 'D5E8D4', 'D9D9D9', 'F0F0F0'],
  fontFace: 'Calibri',
  directReportsLabel: '',
};

export const PPTX_FONT_OPTIONS = [
  'Calibri',
  'Arial',
  'Helvetica Neue',
  'Georgia',
  'Trebuchet MS',
  'Poppins',
] as const;

// Node display settings
export type DisplayFont = 'inter' | 'helvetica' | 'georgia' | 'trebuchet' | 'monospace';
export type NodeSize = 'small' | 'medium' | 'large';

export interface DisplayNodeField {
  id: 'title' | 'department' | 'status' | 'location';
  label: string;
  enabled: boolean;
}

export interface DisplaySettings {
  font: DisplayFont;
  nodeSize: NodeSize;
  fields: DisplayNodeField[];
  deptColors: Record<string, string>;
}

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  font: 'inter',
  nodeSize: 'medium',
  fields: [
    { id: 'title', label: 'Title/Role', enabled: true },
    { id: 'department', label: 'Department', enabled: true },
    { id: 'status', label: 'Status badge', enabled: true },
    { id: 'location', label: 'Location', enabled: true },
  ],
  deptColors: {},
};

export const DISPLAY_FONT_OPTIONS: { id: DisplayFont; label: string; family: string }[] = [
  { id: 'inter', label: 'Inter', family: "'Inter', ui-sans-serif, system-ui, sans-serif" },
  { id: 'helvetica', label: 'Helvetica', family: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  { id: 'georgia', label: 'Georgia', family: "Georgia, 'Times New Roman', serif" },
  { id: 'trebuchet', label: 'Trebuchet MS', family: "'Trebuchet MS', Tahoma, Geneva, sans-serif" },
  { id: 'monospace', label: 'Roboto Mono', family: "'Roboto Mono', 'Courier New', Courier, monospace" },
];

export const DEPARTMENT_COLORS: Record<string, string> = {
  Engineering: '#3b82f6',
  Product: '#8b5cf6',
  Design: '#ec4899',
  Marketing: '#f59e0b',
  Sales: '#10b981',
  Finance: '#6366f1',
  HR: '#ef4444',
  Operations: '#14b8a6',
  Legal: '#f97316',
  'Customer Success': '#06b6d4',
  Executive: '#1f2937',
  Default: '#6b7280',
};

export function getDeptColor(dept: string): string {
  return DEPARTMENT_COLORS[dept] ?? DEPARTMENT_COLORS['Default'];
}

export const FLAG_META: Record<FlagType, { label: string; emoji: string; color: string }> = {
  'at-risk': { label: 'At Risk', emoji: '⚠️', color: '#f59e0b' },
  redundant: { label: 'Redundant Role', emoji: '🔴', color: '#ef4444' },
  'key-person': { label: 'Key Person', emoji: '⭐', color: '#8b5cf6' },
  vacant: { label: 'Vacant', emoji: '🚧', color: '#6b7280' },
  pinned: { label: 'Pinned', emoji: '📌', color: '#3b82f6' },
};

export const STATUS_META: Record<EmployeeStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: '#10b981' },
  vacant: { label: 'Vacant', color: '#6b7280' },
  contractor: { label: 'Contractor', color: '#f59e0b' },
  'on-leave': { label: 'On Leave', color: '#3b82f6' },
  proposed: { label: 'Proposed', color: '#8b5cf6' },
};
