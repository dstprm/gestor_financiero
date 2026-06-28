# SimplyOrg — Implementation Plan

## 1. Core Feature Set & UX Flows

### Primary User Journey
1. **Load data** → Upload Excel/CSV OR use "Load Sample Data" OR manual entry
2. **Map columns** → Auto-detect or manually map fields
3. **Review data quality** → See flagged issues, click to highlight nodes
4. **Explore org chart** → Zoom, pan, collapse/expand, color by department
5. **Work in scenarios** → Create "Option A", "Option B" branches, switch instantly
6. **Edit the org** → Drag nodes to reassign, click to edit details, flag nodes
7. **Analyze** → View analytics sidebar (headcount, spans, depth, etc.)
8. **Compare scenarios** → Side-by-side diff with color-coded changes
9. **Export** → PNG, SVG, Excel, CSV, PDF change log

### UX Layout
```
┌─────────────────────────────────────────────────────────────┐
│ TopBar: Logo | Scenario Badge + Switcher | Search | Controls │
├──────────┬──────────────────────────────────┬───────────────┤
│ Left     │                                  │ Right Panel   │
│ Sidebar  │     Org Chart Canvas             │ (slides in)   │
│          │     (React Flow)                 │               │
│ - Scen-  │                                  │ - Node Editor │
│   arios  │                                  │ - Analytics   │
│ - Issues │                                  │ - Diff View   │
│ - Files  │                                  │               │
└──────────┴──────────────────────────────────┴───────────────┘
```

---

## 2. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 14 (App Router) | Modern React with SSR capability |
| Language | TypeScript | Type safety for complex data model |
| Styling | Tailwind CSS + shadcn/ui | Fast professional UI without design debt |
| Org Chart | @xyflow/react (React Flow v12) | Best-in-class interactive graph with built-in drag-drop |
| State | Zustand + Immer | Simple, predictable; Immer for immutable updates |
| Excel I/O | SheetJS (xlsx) | Best Excel support in JS ecosystem |
| Export | html-to-image + file-saver | Client-side PNG/SVG from canvas |
| Persistence | localStorage | No backend needed for MVP |

---

## 3. Data Model

### Core Types

```typescript
type EmployeeStatus = 'active' | 'vacant' | 'contractor' | 'on-leave' | 'proposed';
type FlagType = 'at-risk' | 'redundant' | 'key-person' | 'vacant' | 'pinned';

interface Employee {
  id: string;           // Unique employee ID
  name: string;
  title: string;
  managerId: string | null;  // null = root node
  department: string;
  level: string;
  location: string;
  status: EmployeeStatus;
  email?: string;
  photoUrl?: string;
  flags: FlagType[];
  notes: string;
  metadata: Record<string, string>;  // Extra columns from import
}

interface ScenarioSnapshot {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  employees: Employee[];
  isBaseline: boolean;
}

interface OrgStore {
  // Scenarios
  scenarios: Record<string, ScenarioSnapshot>;
  activeScenarioId: string | null;
  baselineScenarioId: string | null;

  // UI State
  selectedNodeId: string | null;
  rightPanelMode: 'editor' | 'analytics' | 'diff' | null;
  compareScenarioId: string | null;
  layoutDirection: 'TB' | 'LR' | 'radial';
  searchQuery: string;
  flagFilter: FlagType | null;
  dataIssueFilter: string | null;

  // Settings
  spanOfControlThreshold: number;

  // Column mapping state
  columnMappingDraft: ColumnMapping | null;
  rawImportData: Record<string, string>[] | null;
}
```

### Scenario Model (Git-branch metaphor)
- **Full snapshots**: each scenario stores a complete copy of the employee array
- **No delta chains**: avoids corrupted-state risk from patch failures
- **Instant switching**: O(1) swap of `activeScenarioId`
- **Baseline tracking**: one scenario is designated "baseline" for delta calculations

---

## 4. Component Architecture

```
src/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main app shell
│   └── globals.css
├── components/
│   ├── chart/
│   │   ├── OrgChart.tsx           # React Flow wrapper
│   │   ├── OrgNode.tsx            # Custom node renderer
│   │   ├── OrgEdge.tsx            # Custom edge renderer
│   │   ├── ChartControls.tsx      # Zoom/layout buttons
│   │   └── DiffOverlay.tsx        # Scenario comparison colors
│   ├── panels/
│   │   ├── LeftSidebar.tsx        # Container
│   │   ├── ScenarioPanel.tsx      # Scenario management
│   │   ├── DataIssuesPanel.tsx    # Quality issues list
│   │   ├── RightPanel.tsx         # Slides in on node select
│   │   ├── NodeEditor.tsx         # Edit employee fields
│   │   ├── AnalyticsSidebar.tsx   # Org stats
│   │   └── DiffPanel.tsx          # Compare two scenarios
│   ├── upload/
│   │   ├── UploadZone.tsx         # Drag-drop file zone
│   │   ├── ColumnMapper.tsx       # Map CSV columns to fields
│   │   └── DataQualityReport.tsx  # Issues found on import
│   ├── topbar/
│   │   ├── TopBar.tsx
│   │   ├── ScenarioBadge.tsx
│   │   └── SearchBar.tsx
│   └── ui/                        # shadcn/ui components
├── store/
│   ├── orgStore.ts                # Zustand store
│   ├── actions/
│   │   ├── scenarioActions.ts
│   │   ├── employeeActions.ts
│   │   └── importActions.ts
│   └── selectors.ts               # Derived state
├── lib/
│   ├── dataQuality.ts             # All 8 data quality checks
│   ├── chartLayout.ts             # Build React Flow nodes/edges
│   ├── exporter.ts                # PNG/SVG/Excel/CSV/PDF export
│   ├── importer.ts                # Parse Excel/CSV, auto-detect columns
│   ├── sampleData.ts              # Built-in sample org
│   └── utils.ts                   # clsx, colors, etc.
└── types/
    └── index.ts                   # All TypeScript types
```

---

## 5. Data Quality Checks

All checks run on every data load and after every edit. Each returns `DataIssue[]`.

| Check | Severity | Description |
|-------|----------|-------------|
| Self-reporting | Error | `employee.managerId === employee.id` |
| Circular reporting | Error | Cycle detection via DFS |
| Missing manager | Warning | `managerId` not found in employee list |
| Duplicate IDs | Error | Same `id` appears > once |
| Multiple roots | Info | > 1 node with `managerId === null` |
| Same-level reporting | Warning | Employee and manager have identical `level` |
| Large span of control | Warning | Direct reports count > threshold (default 10) |
| Orphaned subtrees | Warning | Sub-graph not connected to main tree |

### Cycle Detection Algorithm
```typescript
function detectCycles(employees: Employee[]): string[][] {
  // Build adjacency map: id -> managerId
  // DFS with visited + recursion stack
  // Return array of cycle chains [[a, b, c, a], ...]
}
```

---

## 6. Scenario System Design

### State Shape
```typescript
scenarios: Record<string, ScenarioSnapshot>  // keyed by ID
activeScenarioId: string | null
baselineScenarioId: string | null
```

### Key Operations
- `createScenario(name, fromScenarioId?)` → deep clone employees array, assign new ID
- `switchScenario(id)` → set `activeScenarioId`, triggers chart re-render
- `promoteToBaseline(id)` → set `baselineScenarioId = id`
- `deleteScenario(id)` → guard: cannot delete if only 1 scenario

### Diff Algorithm
```typescript
function diffScenarios(baseline: Employee[], target: Employee[]): ScenarioDiff {
  // Added: in target but not baseline (by id)
  // Removed: in baseline but not target
  // Moved: managerId changed
  // Modified: other fields changed
}
```

### Headcount Delta Badge
Shown when active scenario ≠ baseline:
`+{added} / -{removed} / ~{moved} moved vs baseline`

---

## 7. Implementation Order

1. Types + Zustand store
2. Sample data + importer
3. Data quality engine
4. Org chart (React Flow) with basic nodes
5. TopBar + scenario badge/switcher
6. Left sidebar: scenarios panel
7. Left sidebar: data issues panel
8. Right panel: node editor
9. Right panel: analytics
10. Scenario diff view
11. Upload zone + column mapper
12. Export functions
13. Flags + annotations
14. Polish (empty states, animations, accessibility)
