'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  Employee,
  EmployeeStatus,
  ScenarioSnapshot,
  DataIssue,
  FlagType,
  LayoutDirection,
  RightPanelMode,
  ColumnMapping,
  PptxTheme,
} from '@/types';
import { DEFAULT_PPTX_THEME } from '@/types';
import { runDataQualityChecks } from '@/lib/dataQuality';
import { generateId } from '@/lib/utils';
import { SAMPLE_EMPLOYEES } from '@/lib/sampleData';
import { buildFlowGraph } from '@/lib/chartLayout';

export interface OrgState {
  // DB sync
  organizationId: string | null;
  currentUserRole: string | null;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  syncStatus: 'idle' | 'saving' | 'saved' | 'error';
  autosaveEnabled: boolean;
  hasUnsavedChanges: boolean;
  lastSaveError: string | null;

  // Scenarios
  scenarios: Record<string, ScenarioSnapshot>;
  activeScenarioId: string | null;
  baselineScenarioId: string | null;

  // UI
  selectedNodeId: string | null;
  selectedIds: string[];
  rightPanelMode: RightPanelMode;
  compareScenarioId: string | null;
  layoutDirection: LayoutDirection;
  searchQuery: string;
  flagFilter: FlagType | null;
  issueFilter: string | null;
  leftPanel: 'scenarios' | 'issues' | 'upload';
  collapsedNodes: string[];
  presentMode: boolean;
  interactionMode: 'navigate' | 'connect';
  layoutMode: 'organized' | 'freeStyle';
  positionUndoStack: Array<Record<string, { x: number; y: number }>>;

  // Filters
  deptFilter: string[];
  levelFilter: string[];
  statusFilter: EmployeeStatus[];
  flagsOnlyFilter: boolean;
  isolateFilter: boolean;

  // Saved positions per layout direction (for freeStyle mode)
  savedPositions: Partial<Record<LayoutDirection, Record<string, { x: number; y: number }>>>;

  // Undo / Redo
  undoStack: Employee[][];
  redoStack: Employee[][];

  // Settings
  spanOfControlThreshold: number;
  pptxTheme: PptxTheme;

  // Import state
  columnMappingDraft: ColumnMapping | null;
  rawImportData: Record<string, string>[] | null;
  importHeaders: string[] | null;

  // Data quality
  dataIssues: DataIssue[];
}

export interface OrgActions {
  // Scenario management
  createScenario: (name: string, description?: string, fromScenarioId?: string) => string;
  deleteScenario: (id: string) => void;
  renameScenario: (id: string, name: string, description?: string) => void;
  switchScenario: (id: string) => void;
  promoteToBaseline: (id: string) => void;
  cloneScenario: (id: string, newName: string) => string;

  // Employee CRUD
  addEmployee: (employee: Omit<Employee, 'flags' | 'notes' | 'metadata'> & Partial<Pick<Employee, 'flags' | 'notes' | 'metadata'>>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  moveEmployee: (employeeId: string, newManagerId: string | null) => void;

  // Flags / notes
  toggleFlag: (employeeId: string, flag: FlagType) => void;
  setNotes: (employeeId: string, notes: string) => void;

  // Import
  setImportData: (rows: Record<string, string>[], headers: string[], mapping: ColumnMapping) => void;
  applyImport: (employees: Employee[], scenarioName?: string) => void;
  clearImport: () => void;

  // Load sample data
  loadSampleData: () => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;

  // Multi-select
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  setSelection: (ids: string[]) => void;
  bulkUpdateEmployees: (ids: string[], patch: Partial<Employee>) => void;
  bulkToggleFlag: (ids: string[], flag: FlagType) => void;

  // UI
  setSelectedNode: (id: string | null) => void;
  setRightPanelMode: (mode: RightPanelMode) => void;
  setCompareScenario: (id: string | null) => void;
  setLayoutDirection: (dir: LayoutDirection) => void;
  setSearchQuery: (q: string) => void;
  setFlagFilter: (flag: FlagType | null) => void;
  setIssueFilter: (issueId: string | null) => void;
  setLeftPanel: (panel: OrgState['leftPanel']) => void;
  toggleCollapseNode: (id: string) => void;
  setSpanThreshold: (n: number) => void;
  setPresentMode: (on: boolean) => void;
  setInteractionMode: (mode: 'navigate' | 'connect') => void;
  setLayoutMode: (mode: 'organized' | 'freeStyle') => void;
  saveNodePosition: (id: string, x: number, y: number) => void;
  pushPositionSnapshot: (snapshot: Record<string, { x: number; y: number }>) => void;
  undoPositionChange: () => void;
  resetFreeStylePositions: () => Promise<void>;

  // Filters
  setDeptFilter: (depts: string[]) => void;
  setLevelFilter: (levels: string[]) => void;
  setStatusFilter: (statuses: EmployeeStatus[]) => void;
  toggleFlagsFilter: () => void;
  toggleIsolateFilter: () => void;
  clearFilters: () => void;

  // Secondary relationships
  addSecondaryRelationship: (employeeId: string, supervisorId: string, label?: string) => Promise<void>;
  removeSecondaryRelationship: (relationshipId: string, employeeId: string) => Promise<void>;

  // PPTX theme
  savePptxTheme: (theme: PptxTheme) => Promise<void>;

  // DB sync
  setCurrentUserRole: (role: string | null) => void;
  loadFromDB: (organizationId: string) => Promise<void>;
  syncToDB: () => void;
  loadFromLocalStorage: () => void;
  setAutosaveEnabled: (enabled: boolean) => void;
  saveNow: () => Promise<void>;

  // Derived helpers
  getActiveEmployees: () => Employee[];
  rerunChecks: () => void;
}

function freshScenario(
  name: string,
  employees: Employee[],
  description = '',
  isBaseline = false
): ScenarioSnapshot {
  return {
    id: generateId(),
    name,
    description,
    createdAt: Date.now(),
    employees,
    isBaseline,
  };
}

/** Snapshot current employees for undo — call BEFORE mutating. */
function snapshotEmployees(get: () => OrgState & OrgActions): Employee[] | null {
  const { activeScenarioId, scenarios } = get();
  if (!activeScenarioId) return null;
  return JSON.parse(JSON.stringify(scenarios[activeScenarioId]?.employees ?? []));
}

export const useOrgStore = create<OrgState & OrgActions>()(
  persist(
    immer((set, get) => {
      let _autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

      function afterMutation() {
        if (typeof window === 'undefined') return;
        const s = get();

        // Always persist to localStorage immediately
        const key = `simplyorg_chart_${s.organizationId ?? 'local'}`;
        const sid = s.activeScenarioId;
        const employees = sid ? (s.scenarios[sid]?.employees ?? []) : [];
        try {
          localStorage.setItem(key, JSON.stringify({ employees }));
        } catch { /* quota exceeded */ }

        // Always mark as having unsaved changes
        set((st) => { st.hasUnsavedChanges = true; });

        // Only auto-save to API if autosave is enabled and we have an org
        if (!s.organizationId || !s.autosaveEnabled) return;
        if (_autoSaveTimer) clearTimeout(_autoSaveTimer);
        set((st) => { st.syncStatus = 'saving'; });
        _autoSaveTimer = setTimeout(() => { void get().saveNow(); }, 1500);
      }

      return {
        // Initial state
        organizationId: null,
        currentUserRole: null,
        isSyncing: false,
        lastSyncedAt: null,
        syncStatus: 'idle' as const,
        autosaveEnabled: true,
        hasUnsavedChanges: false,
        lastSaveError: null,
        scenarios: {},
        activeScenarioId: null,
        baselineScenarioId: null,
        selectedNodeId: null,
        selectedIds: [],
        rightPanelMode: null,
        compareScenarioId: null,
        layoutDirection: 'TB',
        searchQuery: '',
        flagFilter: null,
        issueFilter: null,
        leftPanel: 'scenarios',
        collapsedNodes: [],
        presentMode: false,
        interactionMode: 'navigate' as const,
        layoutMode: 'organized' as const,
        positionUndoStack: [],
        savedPositions: {},
        deptFilter: [],
        levelFilter: [],
        statusFilter: [],
        flagsOnlyFilter: false,
        isolateFilter: false,
        undoStack: [],
        redoStack: [],
        spanOfControlThreshold: 10,
        pptxTheme: DEFAULT_PPTX_THEME,
        columnMappingDraft: null,
        rawImportData: null,
        importHeaders: null,
        dataIssues: [],

        // ── Scenarios ──────────────────────────────────────────────
        createScenario(name, description = '', fromScenarioId) {
          const source = fromScenarioId
            ? get().scenarios[fromScenarioId]?.employees ?? []
            : [];
          const snap = freshScenario(name, JSON.parse(JSON.stringify(source)), description);
          set((s) => {
            s.scenarios[snap.id] = snap;
            s.activeScenarioId = snap.id;
          });
          return snap.id;
        },

        deleteScenario(id) {
          set((s) => {
            if (Object.keys(s.scenarios).length <= 1) return;
            delete s.scenarios[id];
            if (s.activeScenarioId === id) {
              s.activeScenarioId = Object.keys(s.scenarios)[0] ?? null;
            }
            if (s.baselineScenarioId === id) {
              s.baselineScenarioId = s.activeScenarioId;
            }
            if (s.compareScenarioId === id) s.compareScenarioId = null;
          });
        },

        renameScenario(id, name, description) {
          set((s) => {
            if (s.scenarios[id]) {
              s.scenarios[id].name = name;
              if (description !== undefined) s.scenarios[id].description = description;
            }
          });
        },

        switchScenario(id) {
          set((s) => {
            s.activeScenarioId = id;
            s.selectedNodeId = null;
            s.selectedIds = [];
            s.rightPanelMode = null;
            s.undoStack = [];
            s.redoStack = [];
            s.savedPositions = {};
          });
          get().rerunChecks();
        },

        promoteToBaseline(id) {
          set((s) => {
            if (s.baselineScenarioId && s.scenarios[s.baselineScenarioId]) {
              s.scenarios[s.baselineScenarioId].isBaseline = false;
            }
            s.baselineScenarioId = id;
            if (s.scenarios[id]) s.scenarios[id].isBaseline = true;
          });
        },

        cloneScenario(id, newName) {
          const source = get().scenarios[id];
          if (!source) return id;
          const snap = freshScenario(newName, JSON.parse(JSON.stringify(source.employees)), `Cloned from ${source.name}`);
          set((s) => {
            s.scenarios[snap.id] = snap;
            s.activeScenarioId = snap.id;
          });
          return snap.id;
        },

        // ── Employees ──────────────────────────────────────────────
        addEmployee(emp) {
          const snap = snapshotEmployees(get);
          const full: Employee = {
            flags: [],
            notes: '',
            metadata: {},
            ...emp,
          };
          set((s) => {
            if (snap) {
              s.undoStack.push(snap);
              if (s.undoStack.length > 50) s.undoStack.shift();
              s.redoStack = [];
            }
            const sid = s.activeScenarioId;
            if (sid && s.scenarios[sid]) {
              s.scenarios[sid].employees.push(full);
            }
          });
          get().rerunChecks();
          afterMutation();
        },

        updateEmployee(id, updates) {
          const snap = snapshotEmployees(get);
          set((s) => {
            if (snap) {
              s.undoStack.push(snap);
              if (s.undoStack.length > 50) s.undoStack.shift();
              s.redoStack = [];
            }
            const sid = s.activeScenarioId;
            if (!sid || !s.scenarios[sid]) return;
            const idx = s.scenarios[sid].employees.findIndex((e) => e.id === id);
            if (idx !== -1) Object.assign(s.scenarios[sid].employees[idx], updates);
          });
          get().rerunChecks();
          afterMutation();
        },

        deleteEmployee(id) {
          const snap = snapshotEmployees(get);
          set((s) => {
            if (snap) {
              s.undoStack.push(snap);
              if (s.undoStack.length > 50) s.undoStack.shift();
              s.redoStack = [];
            }
            const sid = s.activeScenarioId;
            if (!sid || !s.scenarios[sid]) return;
            s.scenarios[sid].employees = s.scenarios[sid].employees.filter((e) => e.id !== id);
            for (const e of s.scenarios[sid].employees) {
              if (e.managerId === id) e.managerId = null;
            }
            if (s.selectedNodeId === id) s.selectedNodeId = null;
          });
          get().rerunChecks();
          afterMutation();
        },

        moveEmployee(employeeId, newManagerId) {
          const snap = snapshotEmployees(get);
          set((s) => {
            if (snap) {
              s.undoStack.push(snap);
              if (s.undoStack.length > 50) s.undoStack.shift();
              s.redoStack = [];
            }
            const sid = s.activeScenarioId;
            if (!sid || !s.scenarios[sid]) return;
            const emp = s.scenarios[sid].employees.find((e) => e.id === employeeId);
            if (emp) emp.managerId = newManagerId;
          });
          get().rerunChecks();
          afterMutation();
        },

        toggleFlag(employeeId, flag) {
          const snap = snapshotEmployees(get);
          set((s) => {
            if (snap) {
              s.undoStack.push(snap);
              if (s.undoStack.length > 50) s.undoStack.shift();
              s.redoStack = [];
            }
            const sid = s.activeScenarioId;
            if (!sid || !s.scenarios[sid]) return;
            const emp = s.scenarios[sid].employees.find((e) => e.id === employeeId);
            if (!emp) return;
            const idx = emp.flags.indexOf(flag);
            if (idx === -1) emp.flags.push(flag);
            else emp.flags.splice(idx, 1);
          });
          afterMutation();
        },

        setNotes(employeeId, notes) {
          set((s) => {
            const sid = s.activeScenarioId;
            if (!sid || !s.scenarios[sid]) return;
            const emp = s.scenarios[sid].employees.find((e) => e.id === employeeId);
            if (emp) emp.notes = notes;
          });
          afterMutation();
        },

        // ── Import ─────────────────────────────────────────────────
        setImportData(rows, headers, mapping) {
          set((s) => {
            s.rawImportData = rows;
            s.importHeaders = headers;
            s.columnMappingDraft = mapping;
            s.leftPanel = 'upload';
          });
        },

        applyImport(employees, scenarioName = 'Imported Data') {
          const snap = freshScenario(scenarioName, employees, 'Imported from file', false);
          set((s) => {
            s.scenarios[snap.id] = snap;
            s.activeScenarioId = snap.id;
            if (!s.baselineScenarioId) {
              s.baselineScenarioId = snap.id;
              s.scenarios[snap.id].isBaseline = true;
            }
            s.rawImportData = null;
            s.importHeaders = null;
            s.columnMappingDraft = null;
            s.leftPanel = 'scenarios';
            s.selectedIds = [];
            s.undoStack = [];
            s.redoStack = [];
            s.savedPositions = {};
            // Imported data: autosave OFF until user explicitly saves once
            s.autosaveEnabled = false;
            s.hasUnsavedChanges = true;
          });
          get().rerunChecks();
          afterMutation();
        },

        clearImport() {
          set((s) => {
            s.rawImportData = null;
            s.importHeaders = null;
            s.columnMappingDraft = null;
          });
        },

        loadSampleData() {
          const employees: Employee[] = JSON.parse(JSON.stringify(SAMPLE_EMPLOYEES));
          const snap = freshScenario('Current State', employees, 'Baseline loaded from sample data', true);
          set((s) => {
            s.scenarios = { [snap.id]: snap };
            s.activeScenarioId = snap.id;
            s.baselineScenarioId = snap.id;
            s.selectedNodeId = null;
            s.selectedIds = [];
            s.rightPanelMode = null;
            s.leftPanel = 'scenarios';
            s.undoStack = [];
            s.redoStack = [];
            s.savedPositions = {};
            s.autosaveEnabled = false;
            s.hasUnsavedChanges = false;
          });
          get().rerunChecks();
          afterMutation();
        },

        // ── Undo / Redo ────────────────────────────────────────────
        undo() {
          const state = get();
          const sid = state.activeScenarioId;
          if (!sid || state.undoStack.length === 0) return;
          const prev = state.undoStack[state.undoStack.length - 1];
          const current = JSON.parse(JSON.stringify(state.scenarios[sid]?.employees ?? []));
          set((s) => {
            s.undoStack.pop();
            s.redoStack.push(current);
            if (s.redoStack.length > 50) s.redoStack.shift();
            if (sid && s.scenarios[sid]) s.scenarios[sid].employees = prev;
          });
          get().rerunChecks();
          afterMutation();
        },

        redo() {
          const state = get();
          const sid = state.activeScenarioId;
          if (!sid || state.redoStack.length === 0) return;
          const next = state.redoStack[state.redoStack.length - 1];
          const current = JSON.parse(JSON.stringify(state.scenarios[sid]?.employees ?? []));
          set((s) => {
            s.redoStack.pop();
            s.undoStack.push(current);
            if (s.undoStack.length > 50) s.undoStack.shift();
            if (sid && s.scenarios[sid]) s.scenarios[sid].employees = next;
          });
          get().rerunChecks();
          afterMutation();
        },

        // ── UI ─────────────────────────────────────────────────────
        setSelectedNode(id) {
          set((s) => {
            s.selectedNodeId = id;
            s.selectedIds = [];
            s.rightPanelMode = id ? 'editor' : null;
          });
        },

        toggleSelection(id) {
          set((s) => {
            const idx = s.selectedIds.indexOf(id);
            if (idx !== -1) {
              s.selectedIds.splice(idx, 1);
            } else {
              s.selectedIds.push(id);
            }
            s.selectedNodeId = null;
            if (s.selectedIds.length >= 2) {
              s.rightPanelMode = 'bulk-edit';
            } else if (s.selectedIds.length === 1) {
              s.selectedNodeId = s.selectedIds[0];
              s.selectedIds = [];
              s.rightPanelMode = 'editor';
            } else {
              s.rightPanelMode = null;
            }
          });
        },

        clearSelection() {
          set((s) => {
            s.selectedIds = [];
            if (s.rightPanelMode === 'bulk-edit') {
              s.rightPanelMode = null;
            }
          });
        },

        setSelection(ids) {
          set((s) => {
            if (ids.length >= 2) {
              s.selectedIds = [...ids];
              s.selectedNodeId = null;
              s.rightPanelMode = 'bulk-edit';
            } else if (ids.length === 1) {
              s.selectedIds = [];
              s.selectedNodeId = ids[0];
              s.rightPanelMode = 'editor';
            } else {
              s.selectedIds = [];
              s.selectedNodeId = null;
              s.rightPanelMode = null;
            }
          });
        },

        bulkUpdateEmployees(ids, patch) {
          const snap = snapshotEmployees(get);
          set((s) => {
            if (snap) {
              s.undoStack.push(snap);
              if (s.undoStack.length > 50) s.undoStack.shift();
              s.redoStack = [];
            }
            const sid = s.activeScenarioId;
            if (!sid || !s.scenarios[sid]) return;
            for (const id of ids) {
              const emp = s.scenarios[sid].employees.find((e) => e.id === id);
              if (emp) Object.assign(emp, patch);
            }
          });
          get().rerunChecks();
          afterMutation();
        },

        bulkToggleFlag(ids, flag) {
          const snap = snapshotEmployees(get);
          set((s) => {
            if (snap) {
              s.undoStack.push(snap);
              if (s.undoStack.length > 50) s.undoStack.shift();
              s.redoStack = [];
            }
            const sid = s.activeScenarioId;
            if (!sid || !s.scenarios[sid]) return;
            const selected = s.scenarios[sid].employees.filter((e) => ids.includes(e.id));
            const allHave = selected.every((e) => e.flags.includes(flag));
            for (const emp of selected) {
              if (allHave) {
                emp.flags = emp.flags.filter((f) => f !== flag);
              } else if (!emp.flags.includes(flag)) {
                emp.flags.push(flag);
              }
            }
          });
          afterMutation();
        },
        setRightPanelMode(mode) { set((s) => { s.rightPanelMode = mode; }); },
        setCompareScenario(id) { set((s) => { s.compareScenarioId = id; }); },
        setLayoutDirection(dir) {
          const state = get();
          const currentDir = state.layoutDirection;
          if (currentDir === dir) return;

          if (state.layoutMode !== 'freeStyle') {
            set((s) => { s.layoutDirection = dir; });
            return;
          }

          // freeStyle: save current positions, then restore or compute for new direction
          const employees = state.getActiveEmployees();
          const currentPositions: Record<string, { x: number; y: number }> = {};
          for (const emp of employees) {
            if (emp.positionX != null && emp.positionY != null) {
              currentPositions[emp.id] = { x: emp.positionX, y: emp.positionY };
            }
          }

          const savedForNewDir = state.savedPositions[dir];
          let positionsToApply: Record<string, { x: number; y: number }>;
          if (savedForNewDir && Object.keys(savedForNewDir).length > 0) {
            positionsToApply = savedForNewDir;
          } else {
            // First time in this direction — auto-compute starting positions
            const { nodes } = buildFlowGraph(employees, dir);
            positionsToApply = {};
            for (const node of nodes) {
              positionsToApply[node.id] = node.position;
            }
          }

          set((s) => {
            s.savedPositions = { ...s.savedPositions, [currentDir]: currentPositions };
            s.layoutDirection = dir;
            const sid = s.activeScenarioId;
            if (!sid || !s.scenarios[sid]) return;
            for (const emp of s.scenarios[sid].employees) {
              const pos = positionsToApply[emp.id];
              if (pos) { emp.positionX = pos.x; emp.positionY = pos.y; }
            }
          });
        },
        setSearchQuery(q) { set((s) => { s.searchQuery = q; }); },
        setFlagFilter(flag) { set((s) => { s.flagFilter = flag; }); },
        setIssueFilter(id) { set((s) => { s.issueFilter = id; s.leftPanel = 'issues'; }); },
        setLeftPanel(panel) { set((s) => { s.leftPanel = panel; }); },
        toggleCollapseNode(id) {
          set((s) => {
            const idx = s.collapsedNodes.indexOf(id);
            if (idx !== -1) s.collapsedNodes.splice(idx, 1);
            else s.collapsedNodes.push(id);
          });
        },
        setSpanThreshold(n) { set((s) => { s.spanOfControlThreshold = n; }); get().rerunChecks(); },
        setPresentMode(on) { set((s) => { s.presentMode = on; }); },
        setInteractionMode(mode) { set((s) => { s.interactionMode = mode; }); },

        setLayoutMode(mode) {
          const state = get();
          if (mode === 'freeStyle' && state.layoutMode === 'organized') {
            // Capture auto-layout positions for employees that have none stored yet
            const employees = state.getActiveEmployees();
            const { nodes } = buildFlowGraph(employees, state.layoutDirection);
            const posMap = new Map(nodes.map((n) => [n.id, n.position]));
            const orgId = state.organizationId;

            set((s) => {
              const sid = s.activeScenarioId;
              if (!sid || !s.scenarios[sid]) return;
              for (const emp of s.scenarios[sid].employees) {
                if (emp.positionX == null && emp.positionY == null) {
                  const pos = posMap.get(emp.id);
                  if (pos) { emp.positionX = pos.x; emp.positionY = pos.y; }
                }
              }
              s.layoutMode = mode;
            });

            if (orgId) {
              const updated = get().getActiveEmployees();
              for (const emp of updated) {
                if (emp.positionX != null || emp.positionY != null) {
                  fetch(`/api/employees/${emp.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ positionX: emp.positionX, positionY: emp.positionY }),
                  }).catch(() => null);
                }
              }
            }
          } else {
            set((s) => { s.layoutMode = mode; });
          }
        },

        saveNodePosition(id, x, y) {
          const orgId = get().organizationId;
          set((s) => {
            const sid = s.activeScenarioId;
            if (!sid || !s.scenarios[sid]) return;
            const emp = s.scenarios[sid].employees.find((e) => e.id === id);
            if (emp) { emp.positionX = x; emp.positionY = y; }
          });
          if (orgId) {
            fetch(`/api/employees/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ positionX: x, positionY: y }),
            }).catch(() => null);
          }
        },

        pushPositionSnapshot(snapshot) {
          set((s) => {
            s.positionUndoStack.push(snapshot);
            if (s.positionUndoStack.length > 20) s.positionUndoStack.shift();
          });
        },

        undoPositionChange() {
          const stack = get().positionUndoStack;
          if (stack.length === 0) return;
          const snapshot = stack[stack.length - 1];
          const orgId = get().organizationId;

          set((s) => {
            const sid = s.activeScenarioId;
            if (!sid || !s.scenarios[sid]) return;
            for (const [id, pos] of Object.entries(snapshot)) {
              const emp = s.scenarios[sid].employees.find((e) => e.id === id);
              if (emp) { emp.positionX = pos.x; emp.positionY = pos.y; }
            }
            s.positionUndoStack.pop();
          });

          if (orgId) {
            for (const [id, pos] of Object.entries(snapshot)) {
              fetch(`/api/employees/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ positionX: pos.x, positionY: pos.y }),
              }).catch(() => null);
            }
          }
        },

        async resetFreeStylePositions() {
          const employees = get().getActiveEmployees();
          const orgId = get().organizationId;

          set((s) => {
            const sid = s.activeScenarioId;
            if (!sid || !s.scenarios[sid]) return;
            for (const emp of s.scenarios[sid].employees) {
              emp.positionX = null;
              emp.positionY = null;
            }
            s.layoutMode = 'organized';
            s.positionUndoStack = [];
            s.savedPositions = {};
          });

          if (orgId) {
            await Promise.all(
              employees.map((emp) =>
                fetch(`/api/employees/${emp.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ positionX: null, positionY: null }),
                }).catch(() => null)
              )
            );
          }
        },

        // ── Filters ────────────────────────────────────────────────
        setDeptFilter(depts) { set((s) => { s.deptFilter = depts; }); },
        setLevelFilter(levels) { set((s) => { s.levelFilter = levels; }); },
        setStatusFilter(statuses) { set((s) => { s.statusFilter = statuses; }); },
        toggleFlagsFilter() { set((s) => { s.flagsOnlyFilter = !s.flagsOnlyFilter; }); },
        toggleIsolateFilter() { set((s) => { s.isolateFilter = !s.isolateFilter; }); },
        clearFilters() {
          set((s) => {
            s.deptFilter = [];
            s.levelFilter = [];
            s.statusFilter = [];
            s.flagsOnlyFilter = false;
            s.isolateFilter = false;
          });
        },

        // ── PPTX Theme ─────────────────────────────────────────────
        async savePptxTheme(theme: PptxTheme) {
          set((s) => { s.pptxTheme = theme; });
          const orgId = get().organizationId;
          if (!orgId) return;
          try {
            await fetch(`/api/org/settings?organizationId=${encodeURIComponent(orgId)}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pptxTheme: theme }),
            });
          } catch (err) {
            console.error('[SimplyOrg] Failed to save PPTX theme', err);
          }
        },

        // ── DB Sync ────────────────────────────────────────────────
        async loadFromDB(organizationId: string) {
          // Clear stale scenarios immediately before the async fetch so that any
          // persisted/rehydrated data from a previous org cannot bleed into this one.
          set((s) => {
            s.organizationId = organizationId;
            s.isSyncing = true;
            s.scenarios = {};
            s.activeScenarioId = null;
            s.baselineScenarioId = null;
          });
          try {
            const res = await fetch(`/api/employees?organizationId=${encodeURIComponent(organizationId)}`);
            if (!res.ok) return;
            const rows: Array<{
              id: string; name: string; title?: string | null; department?: string | null;
              email?: string | null; managerId?: string | null; status: string;
              positionX?: number | null; positionY?: number | null;
              secondaryManagers?: { id: string; supervisorId: string; label?: string | null }[];
            }> = await res.json();

            const employees: Employee[] = rows.map((r) => ({
              id: r.id,
              name: r.name,
              title: r.title ?? '',
              department: r.department ?? '',
              level: '',
              location: '',
              status: (r.status?.toLowerCase() as Employee['status']) ?? 'active',
              email: r.email ?? undefined,
              managerId: r.managerId ?? null,
              flags: [],
              notes: '',
              metadata: {},
              positionX: r.positionX ?? null,
              positionY: r.positionY ?? null,
              secondaryManagers: r.secondaryManagers ?? [],
            }));

            const hasSavedPositions = employees.some(
              (e) => e.positionX != null || e.positionY != null
            );
            const snap = freshScenario('Current State', employees, 'Loaded from database', true);
            set((s) => {
              s.scenarios = { [snap.id]: snap };
              s.activeScenarioId = snap.id;
              s.baselineScenarioId = snap.id;
              s.isSyncing = false;
              s.lastSyncedAt = Date.now();
              s.savedPositions = {};
              s.autosaveEnabled = true;
              s.hasUnsavedChanges = false;
              s.lastSaveError = null;
              s.undoStack = [];
              s.redoStack = [];
              if (hasSavedPositions) {
                s.layoutMode = 'freeStyle';
              }
            });
            get().rerunChecks();

            // Load org settings (pptxTheme etc.) — non-blocking
            fetch(`/api/org/settings?organizationId=${encodeURIComponent(organizationId)}`)
              .then((r) => r.ok ? r.json() : null)
              .then((data: { settings?: { pptxTheme?: PptxTheme } } | null) => {
                if (data?.settings?.pptxTheme) {
                  set((s) => { s.pptxTheme = { ...DEFAULT_PPTX_THEME, ...data.settings!.pptxTheme }; });
                }
              })
              .catch(() => { /* non-critical */ });
          } catch {
            set((s) => { s.isSyncing = false; });
          }
        },

        syncToDB() {
          const state = get();
          if (!state.organizationId) return;
          set((s) => { s.isSyncing = true; });
          const employees = state.getActiveEmployees();
          const orgId = state.organizationId;
          Promise.all(
            employees.map((emp) =>
              fetch(`/api/employees/${emp.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: emp.name,
                  title: emp.title,
                  department: emp.department,
                  email: emp.email,
                  managerId: emp.managerId,
                  organizationId: orgId,
                }),
              }).catch(() => null)
            )
          ).then(() => {
            set((s) => { s.isSyncing = false; s.lastSyncedAt = Date.now(); });
          });
        },

        // ── Secondary Relationships ────────────────────────────────
        async addSecondaryRelationship(employeeId: string, supervisorId: string, label?: string) {
          const orgId = get().organizationId;
          if (!orgId) return;
          const res = await fetch('/api/org/secondary-relationships', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId, supervisorId, label, orgId }),
          });
          if (!res.ok) return;
          const created: { id: string; supervisorId: string; label?: string | null } = await res.json();
          set((s) => {
            const sid = s.activeScenarioId;
            if (!sid || !s.scenarios[sid]) return;
            const emp = s.scenarios[sid].employees.find((e) => e.id === employeeId);
            if (emp) {
              if (!emp.secondaryManagers) emp.secondaryManagers = [];
              emp.secondaryManagers.push({ id: created.id, supervisorId: created.supervisorId, label: created.label ?? null });
            }
          });
        },

        async removeSecondaryRelationship(relationshipId: string, employeeId: string) {
          const res = await fetch(`/api/org/secondary-relationships/${relationshipId}`, {
            method: 'DELETE',
          });
          if (!res.ok) return;
          set((s) => {
            const sid = s.activeScenarioId;
            if (!sid || !s.scenarios[sid]) return;
            const emp = s.scenarios[sid].employees.find((e) => e.id === employeeId);
            if (emp && emp.secondaryManagers) {
              emp.secondaryManagers = emp.secondaryManagers.filter((r) => r.id !== relationshipId);
            }
          });
        },

        setCurrentUserRole(role: string | null) {
          set((s) => { s.currentUserRole = role; });
        },

        loadFromLocalStorage() {
          if (typeof window === 'undefined') return;
          const s = get();
          const key = `simplyorg_chart_${s.organizationId ?? 'local'}`;
          const raw = localStorage.getItem(key);
          if (!raw) return;
          try {
            const { employees } = JSON.parse(raw) as { employees: Employee[] };
            if (!Array.isArray(employees) || employees.length === 0) return;
            const snap = freshScenario('Restored', employees, 'Loaded from local storage', true);
            set((st) => {
              st.scenarios = { [snap.id]: snap };
              st.activeScenarioId = snap.id;
              st.baselineScenarioId = snap.id;
              st.selectedIds = [];
              st.savedPositions = {};
              st.undoStack = [];
              st.redoStack = [];
            });
            get().rerunChecks();
          } catch { /* corrupt data — ignore */ }
        },

        setAutosaveEnabled(enabled) {
          set((st) => { st.autosaveEnabled = enabled; });
          // If turning autosave on with pending changes, save immediately
          if (enabled) {
            const state = get();
            if (state.hasUnsavedChanges && state.organizationId) {
              void get().saveNow();
            }
          }
        },

        async saveNow() {
          const state = get();
          if (!state.organizationId) return;
          // Cancel any pending debounced auto-save
          if (_autoSaveTimer) { clearTimeout(_autoSaveTimer); _autoSaveTimer = null; }
          set((st) => { st.syncStatus = 'saving'; });
          const sid = state.activeScenarioId;
          const emps = sid ? (state.scenarios[sid]?.employees ?? []) : [];
          try {
            const res = await fetch('/api/employees', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ organizationId: state.organizationId, nodes: emps }),
            });
            if (res.ok) {
              set((st) => { st.syncStatus = 'saved'; st.hasUnsavedChanges = false; st.lastSaveError = null; });
              // After first explicit save, enable autosave
              if (!get().autosaveEnabled) {
                set((st) => { st.autosaveEnabled = true; });
              }
            } else {
              const data: { error?: string } | null = await res.json().catch(() => null);
              set((st) => { st.syncStatus = 'error'; st.lastSaveError = data?.error ?? `HTTP ${res.status}`; });
            }
          } catch (err) {
            set((st) => { st.syncStatus = 'error'; st.lastSaveError = err instanceof Error ? err.message : 'Network error'; });
          }
        },

        getActiveEmployees() {
          const s = get();
          if (!s.activeScenarioId) return [];
          return s.scenarios[s.activeScenarioId]?.employees ?? [];
        },

        rerunChecks() {
          const s = get();
          const employees = s.getActiveEmployees();
          const issues = runDataQualityChecks(employees, s.spanOfControlThreshold);
          set((state) => { state.dataIssues = issues; });
        },
      };
    }),
    {
      name: 'simplyorg-store',
      skipHydration: true,
      partialize: (s) => ({
        scenarios: s.scenarios,
        activeScenarioId: s.activeScenarioId,
        baselineScenarioId: s.baselineScenarioId,
        layoutDirection: s.layoutDirection,
        spanOfControlThreshold: s.spanOfControlThreshold,
        layoutMode: s.layoutMode,
        savedPositions: s.savedPositions,
      }),
    }
  )
);
