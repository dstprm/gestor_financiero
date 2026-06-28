'use client';
import { useCallback, useMemo, useEffect, useState, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  getViewportForBounds,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
  Panel,
} from '@xyflow/react';
import type { Employee } from '@/types';
import '@xyflow/react/dist/style.css';
import { useOrgStore } from '@/store/orgStore';
import { selectEmployees } from '@/store/selectors';
import { buildFlowGraph } from '@/lib/chartLayout';
import { diffScenarios } from '@/lib/scenarioDiff';
import { OrgNode } from './OrgNode';
import { DeletableEdge } from './DeletableEdge';
import { cn } from '@/lib/utils';
import { getDeptColor } from '@/types';

const nodeTypes = { orgNode: OrgNode };
const edgeTypes = { deletable: DeletableEdge };

interface OrgNodeData {
  employee: Employee;
  isHighlighted: boolean;
  diffStatus?: string;
  childCount: number;
  hiddenChildrenCount: number;
  isCollapsed: boolean;
  isDimmed: boolean;
}

/** Count all descendants recursively */
function countDescendants(id: string, childrenMap: Map<string, string[]>): number {
  let count = 0;
  for (const childId of childrenMap.get(id) ?? []) {
    count += 1 + countDescendants(childId, childrenMap);
  }
  return count;
}

export function OrgChart({ dataReady }: { dataReady?: boolean }) {
  const {
    layoutDirection,
    searchQuery,
    flagFilter,
    issueFilter,
    dataIssues,
    selectedNodeId,
    selectedIds,
    setSelectedNode,
    toggleSelection,
    clearSelection,
    compareScenarioId,
    scenarios,
    activeScenarioId,
    moveEmployee,
    collapsedNodes,
    deptFilter,
    levelFilter,
    statusFilter,
    flagsOnlyFilter,
    isolateFilter,
    interactionMode,
    setInteractionMode,
    layoutMode,
    setLayoutMode,
    saveNodePosition,
    pushPositionSnapshot,
    currentUserRole,
  } = useOrgStore();

  const isViewer = currentUserRole === 'VIEWER';

  const employees = useOrgStore(selectEmployees);

  // Compute diff map for visual overlay
  const diffMap = useMemo(() => {
    if (!compareScenarioId || !activeScenarioId) return undefined;
    const base = scenarios[compareScenarioId]?.employees ?? [];
    const target = scenarios[activeScenarioId]?.employees ?? [];
    const diff = diffScenarios(base, target);
    const map = new Map<string, 'added' | 'removed' | 'moved' | 'modified'>();
    diff.added.forEach((e) => map.set(e.id, 'added'));
    diff.removed.forEach((e) => map.set(e.id, 'removed'));
    diff.moved.forEach(({ employee }) => map.set(employee.id, 'moved'));
    diff.modified.forEach(({ after }) => map.set(after.id, 'modified'));
    return map;
  }, [compareScenarioId, activeScenarioId, scenarios]);

  // Compute highlighted node IDs (search / flag / issue filters)
  const highlightIds = useMemo(() => {
    const ids = new Set<string>();
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      for (const e of employees) {
        if (
          e.name.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          e.title.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q)
        ) {
          ids.add(e.id);
        }
      }
    }
    if (flagFilter) {
      for (const e of employees) {
        if (e.flags.includes(flagFilter)) ids.add(e.id);
      }
    }
    if (issueFilter) {
      const issue = dataIssues.find((i) => i.id === issueFilter);
      if (issue) issue.affectedIds.forEach((id) => ids.add(id));
    }
    return ids.size > 0 ? ids : undefined;
  }, [searchQuery, flagFilter, issueFilter, dataIssues, employees]);

  // Children map: managerId → [childId, ...]
  const childrenMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const e of employees) {
      if (e.managerId) {
        if (!map.has(e.managerId)) map.set(e.managerId, []);
        map.get(e.managerId)!.push(e.id);
      }
    }
    return map;
  }, [employees]);

  // Hidden IDs: all descendants of collapsed nodes
  const hiddenIds = useMemo(() => {
    const hidden = new Set<string>();
    function markDescendants(id: string) {
      for (const childId of childrenMap.get(id) ?? []) {
        hidden.add(childId);
        markDescendants(childId);
      }
    }
    for (const id of collapsedNodes) {
      markDescendants(id);
    }
    return hidden;
  }, [collapsedNodes, childrenMap]);

  // Filter match IDs (for dimming non-matching nodes)
  const filterMatchIds = useMemo(() => {
    const hasFilter =
      deptFilter.length > 0 ||
      levelFilter.length > 0 ||
      statusFilter.length > 0 ||
      flagsOnlyFilter;
    if (!hasFilter) return undefined;
    const ids = new Set<string>();
    for (const e of employees) {
      const matchDept = deptFilter.length === 0 || deptFilter.includes(e.department);
      const matchLevel = levelFilter.length === 0 || levelFilter.includes(e.level);
      const matchStatus = statusFilter.length === 0 || statusFilter.includes(e.status);
      const matchFlags = !flagsOnlyFilter || e.flags.length > 0;
      if (matchDept && matchLevel && matchStatus && matchFlags) ids.add(e.id);
    }
    return ids;
  }, [deptFilter, levelFilter, statusFilter, flagsOnlyFilter, employees]);

  /** Build augmented nodes and filtered edges */
  const buildGraph = useCallback(() => {
    const { nodes: rawNodes, edges: rawEdges } = buildFlowGraph(
      employees,
      layoutDirection,
      highlightIds,
      diffMap,
      layoutMode
    );

    // Compute isolate visible set: matching nodes + their full ancestor chain
    let isolateVisibleIds: Set<string> | undefined;
    if (isolateFilter && filterMatchIds !== undefined) {
      const empMap = new Map(employees.map((e) => [e.id, e]));
      isolateVisibleIds = new Set<string>();
      for (const id of filterMatchIds) {
        isolateVisibleIds.add(id);
        let cur = empMap.get(id);
        while (cur?.managerId) {
          isolateVisibleIds.add(cur.managerId);
          cur = empMap.get(cur.managerId);
        }
      }
    }

    const augmentedNodes = rawNodes
      .filter((n) => !hiddenIds.has(n.id))
      .filter((n) => isolateVisibleIds === undefined || isolateVisibleIds.has(n.id))
      .map((n) => {
        const emp = (n.data as { employee: Employee }).employee;
        const isCollapsed = collapsedNodes.includes(n.id);
        return {
          ...n,
          data: {
            ...n.data,
            childCount: childrenMap.get(n.id)?.length ?? 0,
            hiddenChildrenCount: isCollapsed
              ? countDescendants(n.id, childrenMap)
              : 0,
            isCollapsed,
            isDimmed: isolateVisibleIds === undefined && (
              (filterMatchIds !== undefined && !filterMatchIds.has(emp.id)) ||
              (!!searchQuery && highlightIds !== undefined && !highlightIds.has(emp.id))
            ),
          },
        };
      });
    const filteredEdges = rawEdges
      .filter((e) => !hiddenIds.has(e.source) && !hiddenIds.has(e.target))
      .filter((e) => isolateVisibleIds === undefined || (isolateVisibleIds.has(e.source) && isolateVisibleIds.has(e.target)))
      .map((e) => ({ ...e, type: 'deletable' }));

    // Dashed secondary edges
    const visibleNodeIds = new Set(augmentedNodes.map((n) => n.id));
    const secondaryEdges: Edge[] = [];
    for (const employee of employees) {
      if (!employee.secondaryManagers?.length) continue;
      for (const rel of employee.secondaryManagers) {
        if (!visibleNodeIds.has(employee.id) || !visibleNodeIds.has(rel.supervisorId)) continue;
        if (hiddenIds.has(employee.id) || hiddenIds.has(rel.supervisorId)) continue;
        if (isolateVisibleIds && (!isolateVisibleIds.has(employee.id) || !isolateVisibleIds.has(rel.supervisorId))) continue;
        secondaryEdges.push({
          id: `secondary-${rel.id}`,
          source: rel.supervisorId,
          target: employee.id,
          type: 'smoothstep',
          style: { strokeDasharray: '6 3', stroke: '#94a3b8', strokeWidth: 1.5 },
          label: rel.label ?? undefined,
          labelStyle: { fontSize: 10, fill: '#94a3b8', fontWeight: 400 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 12, height: 12 },
          data: { type: 'secondary' },
        });
      }
    }

    return { nodes: augmentedNodes, edges: [...filteredEdges, ...secondaryEdges] };
  }, [employees, layoutDirection, highlightIds, diffMap, hiddenIds, collapsedNodes, childrenMap, filterMatchIds, isolateFilter, layoutMode]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => buildGraph(), [buildGraph]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [pendingMove, setPendingMove] = useState<{ empId: string; newMgrId: string | null } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showFreeLayoutWarning, setShowFreeLayoutWarning] = useState(false);
  const pendingDragRef = useRef<Node | null>(null);

  const hasSavedFreeLayout = useMemo(
    () => employees.some((e) => e.positionX != null && e.positionY != null),
    [employees]
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Sync when graph changes
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildGraph();
    setNodes(newNodes);
    setEdges(newEdges);
  }, [buildGraph, setNodes, setEdges]);

  const onNodeDragStart = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (layoutMode !== 'freeStyle') return;
      pushPositionSnapshot({ [node.id]: { x: node.position.x, y: node.position.y } });
    },
    [layoutMode, pushPositionSnapshot]
  );

  const applyOrganizedDrag = useCallback(
    (node: Node) => {
      const draggedId = node.id;
      const draggedPos = node.position;
      const W = 192, H = 80;

      const overlapping = nodes.find(
        (n) =>
          n.id !== draggedId &&
          draggedPos.x < n.position.x + W &&
          draggedPos.x + W > n.position.x &&
          draggedPos.y < n.position.y + H &&
          draggedPos.y + H > n.position.y
      );

      if (overlapping) {
        setPendingMove({ empId: draggedId, newMgrId: overlapping.id });
        const { nodes: freshNodes } = buildGraph();
        setNodes(freshNodes);
      }
    },
    [nodes, buildGraph, setNodes]
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (layoutMode === 'freeStyle') {
        saveNodePosition(node.id, node.position.x, node.position.y);
        return;
      }

      // In auto-layout mode: if there's a saved free layout and no override, warn first
      const overrideSet =
        typeof window !== 'undefined' &&
        sessionStorage.getItem('simplyorg_override_free_layout') === 'true';

      if (hasSavedFreeLayout && !overrideSet) {
        pendingDragRef.current = node;
        // Snap node back while dialog is shown
        const { nodes: freshNodes } = buildGraph();
        setNodes(freshNodes);
        setShowFreeLayoutWarning(true);
        return;
      }

      applyOrganizedDrag(node);
    },
    [layoutMode, hasSavedFreeLayout, applyOrganizedDrag, buildGraph, setNodes, saveNodePosition]
  );

  const empById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const empName = empById.get(connection.target)?.name ?? 'this person';
      const mgrName = empById.get(connection.source)?.name ?? 'the manager';
      if (window.confirm(`Make ${empName} report to ${mgrName}?`)) {
        moveEmployee(connection.target, connection.source);
      }
      setInteractionMode('navigate');
    },
    [empById, moveEmployee, setInteractionMode]
  );

  // Escape key clears multi-selection
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && selectedIds.length > 0) {
        clearSelection();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedIds.length, clearSelection]);

  if (employees.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900" id="org-chart-canvas">
        {dataReady ? <EmptyState /> : <LoadingState />}
      </div>
    );
  }

  return (
    <div className="flex-1 relative bg-slate-50 dark:bg-slate-900" id="org-chart-canvas">
      {pendingMove && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 w-96 shadow-2xl">
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-3">Confirm Reporting Change</h3>
            <p className="text-gray-600 dark:text-slate-300 text-sm mb-5">
              Move <span className="text-blue-500 dark:text-blue-400 font-medium">{empById.get(pendingMove.empId)?.name}</span> from{' '}
              <span className="text-gray-800 dark:text-slate-200">
                {empById.get(empById.get(pendingMove.empId)?.managerId ?? '')?.name ?? '(no manager)'}
              </span> to{' '}
              <span className="text-green-600 dark:text-green-400 font-medium">
                {pendingMove.newMgrId ? empById.get(pendingMove.newMgrId)?.name : '(no manager)'}
              </span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setPendingMove(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  moveEmployee(pendingMove.empId, pendingMove.newMgrId);
                  setPendingMove(null);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium"
              >
                Confirm Move
              </button>
            </div>
          </div>
        </div>
      )}

      {showFreeLayoutWarning && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 w-[26rem] shadow-2xl">
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-3">
              You have a saved free layout
            </h3>
            <p className="text-gray-600 dark:text-slate-300 text-sm mb-5">
              You&apos;re in auto-layout mode but have saved node positions from a previous free layout.
              What would you like to do?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowFreeLayoutWarning(false);
                  const node = pendingDragRef.current;
                  pendingDragRef.current = null;
                  setLayoutMode('freeStyle');
                  if (node) saveNodePosition(node.id, node.position.x, node.position.y);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium text-left"
              >
                Switch to free layout
                <span className="block text-blue-200 text-xs font-normal mt-0.5">
                  Keep saved positions and move freely
                </span>
              </button>
              <button
                onClick={() => {
                  sessionStorage.setItem('simplyorg_override_free_layout', 'true');
                  setShowFreeLayoutWarning(false);
                  const node = pendingDragRef.current;
                  pendingDragRef.current = null;
                  if (node) applyOrganizedDrag(node);
                }}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm text-left"
              >
                Continue anyway
                <span className="block text-gray-400 dark:text-slate-400 text-xs font-normal mt-0.5">
                  Stay in auto-layout — won&apos;t ask again this session
                </span>
              </button>
              <button
                onClick={() => {
                  pendingDragRef.current = null;
                  setShowFreeLayoutWarning(false);
                }}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(e, node) => {
          if (e.ctrlKey || e.metaKey) {
            toggleSelection(node.id);
          } else {
            setSelectedNode(node.id);
          }
        }}
        onPaneClick={() => {
          setSelectedNode(null);
          clearSelection();
        }}
        onNodeDragStart={!isViewer ? onNodeDragStart : undefined}
        onNodeDragStop={!isViewer ? onNodeDragStop : undefined}
        onConnect={!isViewer ? onConnect : undefined}
        connectOnClick={!isViewer && interactionMode === 'connect'}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.1}
        maxZoom={2}
        zoomOnPinch={true}
        panOnDrag={true}
        nodesDraggable={!isMobile && !isViewer}
        className="bg-slate-50 dark:bg-slate-900"
      >
        <AutoFit deps={[employees.length, layoutDirection]} />
        <ChartExporter />
        <SpotlightNavigator />
        <Background color="#94a3b8" gap={24} size={1} />
        <Controls />
        <MiniMap
          className=""
          nodeColor={(n) => {
            const emp = (n.data as unknown as OrgNodeData)?.employee;
            if (!emp) return '#475569';
            return getDeptColor(emp.department);
          }}
        />

        {selectedIds.length > 0 && (
          <Panel position="top-left">
            <div className="flex items-center gap-2 bg-violet-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-md">
              <span>{selectedIds.length} selected</span>
              <button
                onClick={clearSelection}
                className="opacity-70 hover:opacity-100 transition-opacity"
                title="Clear selection (Esc)"
              >
                ✕
              </button>
            </div>
          </Panel>
        )}

        {compareScenarioId && (
          <Panel position="top-right">
            <DiffLegend />
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

/** Fits the viewport whenever the node set or layout direction changes. */
function AutoFit({ deps }: { deps: unknown[] }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.15, duration: 300 }), 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return null;
}

// Object ref so webpack live-binding works across modules
export const chartExportRef: { fn: ((format: 'png' | 'svg') => void) | null } = { fn: null };
export const pptxExportRef: { fn: ((theme: import('@/types').PptxTheme) => void) | null } = { fn: null };
/** Pan + zoom to a node by id, then pulse-highlight it for 2 s */
export const spotlightRef: { fn: ((nodeId: string) => void) | null } = { fn: null };

/** Registers the spotlight pan/zoom callback. Lives inside ReactFlow provider. */
function SpotlightNavigator() {
  const rf = useReactFlow();

  useEffect(() => {
    spotlightRef.fn = (nodeId: string) => {
      const node = rf.getNode(nodeId);
      if (!node) return;
      const w = node.measured?.width ?? 192;
      const h = node.measured?.height ?? 80;
      rf.setCenter(node.position.x + w / 2, node.position.y + h / 2, {
        zoom: 1.5,
        duration: 600,
      });
      // Pulse-highlight the node for 2 s
      const el = document.querySelector(`.react-flow__node[data-id="${nodeId}"]`);
      if (el) {
        el.classList.add('spotlight-pulse');
        setTimeout(() => el.classList.remove('spotlight-pulse'), 2000);
      }
    };
    return () => {
      spotlightRef.fn = null;
    };
  }, [rf]);

  return null;
}

/** Lives inside the ReactFlow provider so it can use useReactFlow(). */
function ChartExporter() {
  const rf = useReactFlow();

  useEffect(() => {
    pptxExportRef.fn = async (theme) => {
      const rfNodes = rf.getNodes();
      const rfEdges = rf.getEdges();
      if (rfNodes.length === 0) return;

      const employees = rfNodes.map((n) => (n.data as { employee: Employee }).employee);
      const visibleIds = new Set(employees.map((e) => e.id));
      const visibleEdges = rfEdges
        .filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target))
        .map((e) => ({ source: e.source, target: e.target, secondary: e.data?.type === 'secondary' }));

      try {
        const { exportToPptx } = await import('@/lib/exportToPptx');
        await exportToPptx({ employees, visibleEdges, theme });
      } catch (err) {
        console.error('[SimplyOrg] PPTX export failed:', err);
      }
    };

    chartExportRef.fn = async (format: 'png' | 'svg') => {
      const nodes = rf.getNodes();
      if (nodes.length === 0) return;

      rf.fitView({ padding: 0.05, duration: 0 });
      await new Promise((r) => setTimeout(r, 150));

      const el = document.getElementById('org-chart-canvas');
      if (!el) return;

      const currentZoom = rf.getViewport().zoom;
      const NODE_WIDTH_PX = 192;
      const TARGET_NODE_PX = 130;
      const dynamicRatio = Math.max(3, TARGET_NODE_PX / (NODE_WIDTH_PX * currentZoom));

      const origFetch = window.fetch;
      window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        if (typeof url === 'string' && (url.includes('/_next/') || url.startsWith('http://localhost'))) {
          return new Response('', { status: 200, headers: { 'Content-Type': 'text/css' } });
        }
        return origFetch(input, init);
      };

      try {
        const { saveAs } = await import('file-saver');
        const opts = {
          backgroundColor: '#0f172a',
          skipFonts: true,
          pixelRatio: dynamicRatio,
          filter: (node: HTMLElement) => {
            const cls = typeof node.className === 'string' ? node.className : '';
            return (
              !cls.includes('react-flow__controls') &&
              !cls.includes('react-flow__minimap') &&
              !cls.includes('react-flow__attribution') &&
              !cls.includes('react-flow__panel')
            );
          },
        };

        if (format === 'png') {
          const { toPng } = await import('html-to-image');
          const dataUrl = await toPng(el, opts);
          saveAs(dataUrl, 'org-chart.png');
        } else {
          const { toSvg } = await import('html-to-image');
          const dataUrl = await toSvg(el, opts);
          saveAs(dataUrl, 'org-chart.svg');
        }
      } catch (err) {
        console.error('[SimplyOrg] Chart export failed:', err);
      } finally {
        window.fetch = origFetch;
      }
    };
    return () => { chartExportRef.fn = null; pptxExportRef.fn = null; };
  }, [rf]);

  return null;
}

function DiffLegend() {
  return (
    <div className="bg-white/90 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-lg p-3 text-xs space-y-1">
      <p className="text-gray-500 dark:text-slate-400 font-medium mb-2">Diff Legend</p>
      {[
        { color: 'bg-green-500', label: 'Added' },
        { color: 'bg-red-500', label: 'Removed' },
        { color: 'bg-blue-500', label: 'Moved' },
        { color: 'bg-yellow-500', label: 'Modified' },
      ].map(({ color, label }) => (
        <div key={label} className="flex items-center gap-2">
          <div className={cn('w-3 h-3 rounded', color)} />
          <span className="text-gray-700 dark:text-slate-300">{label}</span>
        </div>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center space-y-3">
      <div className="w-8 h-8 border-2 border-gray-300 dark:border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto" />
      <p className="text-sm text-gray-400 dark:text-slate-500">Loading org data…</p>
    </div>
  );
}

function EmptyState() {
  const { loadSampleData, setLeftPanel } = useOrgStore();
  return (
    <div className="text-center space-y-4 max-w-md">
      <div className="text-6xl">🏢</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">No org data yet</h2>
      <p className="text-gray-500 dark:text-slate-400">
        Upload an Excel or CSV roster, start building manually, or load our sample org to explore.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => setLeftPanel('upload')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm"
        >
          Upload File
        </button>
        <button
          onClick={loadSampleData}
          className="px-4 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-lg font-medium text-sm"
        >
          Load Sample Data
        </button>
      </div>
    </div>
  );
}
