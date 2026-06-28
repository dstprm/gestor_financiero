import type { Employee, PptxTheme } from '@/types';
import { DEFAULT_PPTX_THEME } from '@/types';

// Slide dimensions (16:9 widescreen)
const SLIDE_W = 13.33; // inches
const SLIDE_H = 7.5; // inches
const SLIDE_PADDING = 0.4; // inches

// Node layout dimensions in pixels
const NODE_W_PX = 200;
const NODE_H_PX = 90;
const H_GAP_PX = 48;
const V_GAP_PX = 76;

// Connector / border colors (not themeable — structural)
const COLOR_CONN = '94A3B8'; // slate-400
const COLOR_BORDER = '8C8C8C';
/** Floor font size on detail slides when node boxes are still reasonably large. */
const MIN_FONT_SIZE_DETAIL = 6;
/** All-leaf teams (last level under a manager): two vertical columns. */
const LEAF_TWO_COL_MIN = 2;
/** Collapse repeated final-leaf roles under one manager when count is high. */
const LEAF_ROLE_GROUP_MIN = 3;
const GROUPED_LEAF_ID_PREFIX = 'grp-agg:';

/** Minimum node size on “readable” slides (below this → split into zoom slides). */
const MIN_BOX_W_IN = 2;
const MIN_BOX_H_IN = 0.6;
/** Scale ≥ this ⇒ layout boxes meet MIN_BOX_* at 96dpi logical units. */
const MIN_SCALE_FOR_MIN_BOX = Math.max(
  MIN_BOX_W_IN / (NODE_W_PX / 96),
  MIN_BOX_H_IN / (NODE_H_PX / 96)
);

// 1 inch = 914400 EMUs
const IN_TO_EMU = 914400;

function hex(color: string): string {
  return color.replace('#', '');
}

function emu(inches: number): number {
  return Math.round(inches * IN_TO_EMU);
}

/** Reverse pptxgenjs `encodeXmlEntities` on shape `name="emp-…"` so keys match raw employee ids. */
function decodeXmlEntities(s: string): string {
  return s
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** Map employee id → pptx shape id; tolerates `id` / `name` attribute order in `<p:cNvPr …>`. */
function collectEmpNodeShapeIds(slideXml: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const m of slideXml.matchAll(/<p:cNvPr\b([^>]+)>/g)) {
    const attrs = m[1] ?? '';
    const idMatch = attrs.match(/\bid="(\d+)"/);
    const nameMatch = attrs.match(/\bname="emp-([^"]+)"/);
    if (!idMatch || !nameMatch) continue;
    map.set(decodeXmlEntities(nameMatch[1]), parseInt(idMatch[1], 10));
  }
  return map;
}

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  children: string[];
  parent: string | null;
}

function buildDirectReportCounts(employees: Employee[]): Map<string, number> {
  const counts = new Map<string, number>();
  const ids = new Set(employees.map((e) => e.id));
  for (const e of employees) {
    if (!e.managerId || !ids.has(e.managerId)) continue;
    counts.set(e.managerId, (counts.get(e.managerId) ?? 0) + 1);
  }
  return counts;
}

function safeRoleKey(title: string): string {
  const t = title.trim().toLowerCase();
  return t.length > 0 ? t : '(sin rol)';
}

function safeRoleTitle(title: string): string {
  const t = title.trim();
  return t.length > 0 ? t : 'Sin rol';
}

function collapseRepeatedLeafRoles(
  employees: Employee[],
  visibleEdges: Array<{ source: string; target: string; secondary?: boolean }>
): {
  employees: Employee[];
  visibleEdges: Array<{ source: string; target: string; secondary?: boolean }>;
} {
  const ids = new Set(employees.map((e) => e.id));
  const byId = new Map(employees.map((e) => [e.id, e]));
  const childrenByManager = new Map<string, string[]>();
  for (const e of employees) {
    if (!e.managerId || !ids.has(e.managerId)) continue;
    const arr = childrenByManager.get(e.managerId) ?? [];
    arr.push(e.id);
    childrenByManager.set(e.managerId, arr);
  }
  const isLeaf = (id: string): boolean => (childrenByManager.get(id)?.length ?? 0) === 0;

  const groups = new Map<string, Employee[]>();
  for (const e of employees) {
    if (!e.managerId || !ids.has(e.managerId)) continue;
    if (!isLeaf(e.id)) continue;
    const key = `${e.managerId}::${safeRoleKey(e.title)}`;
    const arr = groups.get(key) ?? [];
    arr.push(e);
    groups.set(key, arr);
  }

  const grouped = Array.from(groups.entries()).filter(([, emps]) => emps.length >= LEAF_ROLE_GROUP_MIN);
  if (grouped.length === 0) return { employees, visibleEdges };

  const replacedIds = new Set<string>();
  const syntheticEmployees: Employee[] = [];
  const syntheticByManager = new Map<string, string[]>();
  let groupSeq = 1;

  for (const [groupKey, emps] of grouped) {
    for (const e of emps) replacedIds.add(e.id);
    const [managerIdRaw] = groupKey.split('::');
    const managerId = managerIdRaw ?? emps[0]!.managerId!;
    const sample = emps[0]!;
    const syntheticId = `${GROUPED_LEAF_ID_PREFIX}${managerId}:${groupSeq++}`;
    const synthetic: Employee = {
      ...sample,
      id: syntheticId,
      managerId,
      title: safeRoleTitle(sample.title),
      name: `x ${emps.length}`,
      flags: [],
      notes: '',
      metadata: {
        ...(sample.metadata ?? {}),
        groupedLeafRole: 'true',
        groupedLeafCount: String(emps.length),
      },
    };
    syntheticEmployees.push(synthetic);
    const arr = syntheticByManager.get(managerId) ?? [];
    arr.push(syntheticId);
    syntheticByManager.set(managerId, arr);
  }

  const nextEmployees = employees.filter((e) => !replacedIds.has(e.id)).concat(syntheticEmployees);
  const nextEdges = visibleEdges.filter((e) => !replacedIds.has(e.source) && !replacedIds.has(e.target));

  for (const [managerId, synthIds] of syntheticByManager) {
    for (const synthId of synthIds) {
      nextEdges.push({ source: managerId, target: synthId });
    }
  }

  // Keep deterministic edge order for stable layout/export.
  nextEdges.sort((a, b) =>
    `${a.source}|${a.target}|${a.secondary ? 1 : 0}`.localeCompare(
      `${b.source}|${b.target}|${b.secondary ? 1 : 0}`
    )
  );

  // Preserve deterministic employee ordering by existing order + appended grouped nodes.
  return { employees: nextEmployees, visibleEdges: nextEdges };
}

function buildLayout(employees: Employee[]): Map<string, LayoutNode> {
  const ids = new Set(employees.map((e) => e.id));
  const nodeMap = new Map<string, LayoutNode>();

  for (const e of employees) {
    nodeMap.set(e.id, {
      id: e.id,
      x: 0,
      y: 0,
      children: [],
      parent: e.managerId && ids.has(e.managerId) ? e.managerId : null,
    });
  }
  for (const node of nodeMap.values()) {
    if (node.parent && nodeMap.has(node.parent)) {
      nodeMap.get(node.parent)!.children.push(node.id);
    }
  }
  return nodeMap;
}

function allChildrenAreLeaves(node: LayoutNode, nodeMap: Map<string, LayoutNode>): boolean {
  return node.children.every((cid) => (nodeMap.get(cid)?.children.length ?? 0) === 0);
}

/**
 * Which **visual** column a leaf sits in under an all-leaf two-column manager.
 * Uses child `x` (midpoint between the two column bands), not array order — matches layout and keeps
 * `endCxn` idx aligned with the physical edge for glued connectors.
 */
function twoColumnLeafSide(
  nodeMap: Map<string, LayoutNode>,
  targetId: string
): 'left' | 'right' | null {
  const tgt = nodeMap.get(targetId);
  if (!tgt?.parent) return null;
  const parent = nodeMap.get(tgt.parent);
  if (!parent) return null;
  if (parent.children.length < LEAF_TWO_COL_MIN || !allChildrenAreLeaves(parent, nodeMap)) {
    return null;
  }
  const xs = parent.children.map((id) => nodeMap.get(id)!.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  if (minX === maxX) return null;
  const mid = (minX + maxX) / 2;
  return tgt.x < mid ? 'left' : 'right';
}

/** Layout-pixel anchor on a node box; used for connector glue sites and bbox sizing. */
function rectAnchorPx(
  n: LayoutNode,
  site: 'top' | 'right' | 'bottom' | 'left'
): { x: number; y: number } {
  const l = n.x;
  const t = n.y;
  const w = NODE_W_PX;
  const h = NODE_H_PX;
  switch (site) {
    case 'top':
      return { x: l + w / 2, y: t };
    case 'right':
      return { x: l + w, y: t + h / 2 };
    case 'bottom':
      return { x: l + w / 2, y: t + h };
    case 'left':
      return { x: l, y: t + h / 2 };
  }
}

const ROW_STRIDE = NODE_H_PX + V_GAP_PX;

/**
 * Top-down layout: y is explicit (not fixed per depth) so leaf teams can use two
 * vertical columns without overlapping sibling subtrees (siblings stay in
 * separate x bands).
 */
function layoutExportSubtree(
  nodeMap: Map<string, LayoutNode>,
  id: string,
  startX: number,
  yTop: number
): { endX: number; bottom: number } {
  const node = nodeMap.get(id)!;

  if (node.children.length === 0) {
    node.x = startX;
    node.y = yTop;
    return { endX: startX + NODE_W_PX + H_GAP_PX, bottom: yTop + NODE_H_PX };
  }

  const childY = yTop + NODE_H_PX + V_GAP_PX;
  const n = node.children.length;
  const allLeaves = allChildrenAreLeaves(node, nodeMap);

  if (allLeaves && n >= LEAF_TWO_COL_MIN) {
    const leftIds = node.children.slice(0, Math.ceil(n / 2));
    const rightIds = node.children.slice(Math.ceil(n / 2));
    const colGap = H_GAP_PX;
    const blockW = NODE_W_PX + colGap + NODE_W_PX;

    for (let i = 0; i < leftIds.length; i++) {
      const c = nodeMap.get(leftIds[i])!;
      c.x = startX;
      c.y = childY + i * ROW_STRIDE;
    }
    for (let j = 0; j < rightIds.length; j++) {
      const c = nodeMap.get(rightIds[j])!;
      c.x = startX + NODE_W_PX + colGap;
      c.y = childY + j * ROW_STRIDE;
    }

    const maxRows = Math.max(leftIds.length, rightIds.length);
    const kidsBottom = childY + maxRows * NODE_H_PX + (maxRows - 1) * V_GAP_PX;

    node.x = startX + (blockW - NODE_W_PX) / 2;
    node.y = yTop;

    return { endX: startX + blockW + H_GAP_PX, bottom: kidsBottom };
  }

  /* Non-leaf levels: always expand children horizontally (no stacked subtree columns). */
  let cursor = startX;
  let deepestBottom = -Infinity;
  for (const childId of node.children) {
    const r = layoutExportSubtree(nodeMap, childId, cursor, childY);
    cursor = r.endX;
    deepestBottom = Math.max(deepestBottom, r.bottom);
  }

  const first = nodeMap.get(node.children[0])!;
  const last = nodeMap.get(node.children[node.children.length - 1])!;
  node.x = (first.x + last.x) / 2;
  node.y = yTop;
  return { endX: cursor, bottom: deepestBottom };
}

function collectSubtreeIds(rootId: string, nodeMap: Map<string, LayoutNode>): Set<string> {
  const out = new Set<string>();
  function walk(id: string): void {
    out.add(id);
    for (const c of nodeMap.get(id)?.children ?? []) walk(c);
  }
  walk(rootId);
  return out;
}

function findRootEmployees(employees: Employee[]): Employee[] {
  const ids = new Set(employees.map((e) => e.id));
  return employees.filter((e) => !e.managerId || !ids.has(e.managerId));
}

/** Run layout for the given roster (single forest). */
function layoutFullChart(employees: Employee[]): Map<string, LayoutNode> {
  const nodeMap = buildLayout(employees);
  const ids = new Set(employees.map((e) => e.id));
  const roots = employees.filter((e) => !e.managerId || !ids.has(e.managerId));
  let cursor = 0;
  for (const root of roots) {
    const r = layoutExportSubtree(nodeMap, root.id, cursor, 0);
    cursor = r.endX;
  }
  return nodeMap;
}

function boundsPx(nodeMap: Map<string, LayoutNode>): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodeMap.values()) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + NODE_W_PX);
    maxY = Math.max(maxY, node.y + NODE_H_PX);
  }
  return { minX, minY, maxX, maxY };
}

/** Top inset (inches) for the chart — no slide title text, only padding. */
const CHART_TOP_IN = 0.35;

function chartAreaInches(): { chartTop: number; availW: number; availH: number } {
  const chartTop = CHART_TOP_IN;
  const availW = SLIDE_W - 2 * SLIDE_PADDING;
  const availH = SLIDE_H - chartTop - SLIDE_PADDING;
  return { chartTop, availW, availH };
}

function scaleToFitSlide(minX: number, minY: number, maxX: number, maxY: number): number {
  const contentW = maxX - minX;
  const contentH = maxY - minY;
  const { availW, availH } = chartAreaInches();
  const scaleX = availW / (contentW / 96);
  const scaleY = availH / (contentH / 96);
  return Math.min(scaleX, scaleY, 1);
}

type SlideRole = 'overview' | 'detail' | 'full';

interface ExportSlideSpec {
  title: string;
  employees: Employee[];
  edges: Array<{ source: string; target: string; secondary?: boolean }>;
  useGlobalLayout: boolean;
  slideRole: SlideRole;
}

/** Max number of detail slides (top-level branches merged if needed). */
const MAX_DETAIL_SLIDES = 16;

function filterEdgesForSubset(
  emps: Employee[],
  visibleEdges: Array<{ source: string; target: string; secondary?: boolean }>
): Array<{ source: string; target: string; secondary?: boolean }> {
  const ids = new Set(emps.map((e) => e.id));
  return visibleEdges.filter((e) => ids.has(e.source) && ids.has(e.target));
}

/** Uniform scale that fits bbox in chart area (min of X/Y, capped at 1). */
function scaleFitForBounds(minX: number, minY: number, maxX: number, maxY: number): number {
  const contentW = maxX - minX;
  const contentH = maxY - minY;
  if (contentW <= 0 || contentH <= 0) return 1;
  return scaleToFitSlide(minX, minY, maxX, maxY);
}

/** Subgraph with same pixel positions as the main diagram (for cutout slides). */
function projectGlobalLayout(
  globalNodeMap: Map<string, LayoutNode>,
  empIds: Set<string>
): Map<string, LayoutNode> {
  const out = new Map<string, LayoutNode>();
  for (const id of empIds) {
    const n = globalNodeMap.get(id);
    if (!n) continue;
    out.set(id, {
      ...n,
      children: n.children.filter((c) => empIds.has(c)),
    });
  }
  return out;
}

interface DetailBranch {
  label: string;
  employees: Employee[];
}

function combineBranches(a: DetailBranch, b: DetailBranch): DetailBranch {
  const seen = new Set<string>();
  const merged: Employee[] = [];
  for (const e of [...a.employees, ...b.employees]) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    merged.push(e);
  }
  return {
    label: `${a.label} · ${b.label}`,
    employees: merged,
  };
}

/** Pairwise-merge adjacent branches until at most `max` slides. */
function mergeBranchesToMax(branches: DetailBranch[], max: number): DetailBranch[] {
  let b = [...branches];
  while (b.length > max && b.length >= 2) {
    const next: DetailBranch[] = [];
    for (let i = 0; i < b.length; i += 2) {
      if (i + 1 < b.length) {
        next.push(combineBranches(b[i]!, b[i + 1]!));
      } else {
        next.push(b[i]!);
      }
    }
    b = next;
  }
  return b;
}

/**
 * If the full org is too dense for readable boxes:
 * - Multi-root: keep one overview + detail slides by root branch.
 * - Single-root: split overview into two slides:
 *   1) root + direct reports only (no subtrees)
 *   2) root + only direct reports that have subtrees, with those subtrees expanded
 * Then add detail slides by top-level branch (merged to cap).
 */
function buildExportSlideList(
  employees: Employee[],
  visibleEdges: Array<{ source: string; target: string; secondary?: boolean }>,
  orgName: string,
  globalNodeMap: Map<string, LayoutNode>
): ExportSlideSpec[] {
  if (employees.length === 0) return [];
  if (employees.length === 1) {
    return [
      {
        title: orgName,
        employees,
        edges: filterEdgesForSubset(employees, visibleEdges),
        useGlobalLayout: true,
        slideRole: 'full',
      },
    ];
  }

  const gb = boundsPx(globalNodeMap);
  const fitFull = scaleFitForBounds(gb.minX, gb.minY, gb.maxX, gb.maxY);

  if (fitFull >= MIN_SCALE_FOR_MIN_BOX) {
    return [
      {
        title: orgName,
        employees,
        edges: filterEdgesForSubset(employees, visibleEdges),
        useGlobalLayout: true,
        slideRole: 'full',
      },
    ];
  }

  const roots = findRootEmployees(employees);
  const slides: ExportSlideSpec[] = [];

  if (roots.length === 1) {
    const rootEmp = roots[0]!;
    const rootNode = globalNodeMap.get(rootEmp.id);
    if (rootNode) {
      const directIds = new Set<string>([rootEmp.id, ...rootNode.children]);
      const directOnlyEmployees = employees.filter((e) => directIds.has(e.id));
      if (directOnlyEmployees.length > 0) {
        slides.push({
          title: `${orgName} — Leadership`,
          employees: directOnlyEmployees,
          edges: filterEdgesForSubset(directOnlyEmployees, visibleEdges),
          useGlobalLayout: true,
          slideRole: 'overview',
        });
      }

      const subtreeIds = new Set<string>([rootEmp.id]);
      for (const childId of rootNode.children) {
        const child = globalNodeMap.get(childId);
        if (!child || child.children.length === 0) continue;
        for (const id of collectSubtreeIds(childId, globalNodeMap)) subtreeIds.add(id);
      }
      const subtreeOverviewEmployees = employees.filter((e) => subtreeIds.has(e.id));
      if (subtreeOverviewEmployees.length > 1) {
        slides.push({
          title: `${orgName} — Expanded teams`,
          employees: subtreeOverviewEmployees,
          edges: filterEdgesForSubset(subtreeOverviewEmployees, visibleEdges),
          useGlobalLayout: true,
          slideRole: 'overview',
        });
      }
    }
  } else {
    slides.push({
      title: `${orgName} — Full organization (overview)`,
      employees,
      edges: filterEdgesForSubset(employees, visibleEdges),
      useGlobalLayout: true,
      slideRole: 'overview',
    });
  }

  const branches: DetailBranch[] = [];

  if (roots.length > 1) {
    for (const r of roots) {
      const ids = collectSubtreeIds(r.id, globalNodeMap);
      if (ids.size < 2) continue;
      branches.push({
        label: r.name,
        employees: employees.filter((e) => ids.has(e.id)),
      });
    }
  } else {
    const rootNode = globalNodeMap.get(roots[0]!.id)!;
    for (const childId of rootNode.children) {
      const ids = collectSubtreeIds(childId, globalNodeMap);
      if (ids.size < 2) continue;
      const head = employees.find((e) => e.id === childId);
      branches.push({
        label: head?.name ?? 'Team',
        employees: employees.filter((e) => ids.has(e.id)),
      });
    }
  }

  if (branches.length === 0) {
    return slides;
  }

  const merged = mergeBranchesToMax(branches, MAX_DETAIL_SLIDES);

  for (const br of merged) {
    slides.push({
      title: `${orgName} — ${br.label}`,
      employees: br.employees,
      edges: filterEdgesForSubset(br.employees, visibleEdges),
      useGlobalLayout: true,
      slideRole: 'detail',
    });
  }

  return slides;
}

interface SlideRenderMeta {
  nodeMap: Map<string, LayoutNode>;
  toInX: (px: number) => number;
  toInY: (py: number) => number;
  edges: Array<{ source: string; target: string; secondary?: boolean }>;
}

/** pptxgenjs slide — keep loose to avoid version-specific typings */
type PptxSlideCompat = {
  background: { color: string };
  addText: (text: unknown, options?: Record<string, unknown>) => void;
  addShape: (shapeName: unknown, options?: Record<string, unknown>) => void;
};

function fontSizesForBoxInches(
  nodeWIn: number,
  nodeHIn: number,
  slideRole: SlideRole
): { title: number; name: number } {
  const hPt = nodeHIn * 72;
  const cap = (frac: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Math.floor(hPt * frac)));
  if (slideRole === 'overview') {
    return {
      title: cap(0.2, 3, 9),
      name: cap(0.16, 2, 8),
    };
  }
  const minBase = slideRole === 'detail' ? MIN_FONT_SIZE_DETAIL : 7;
  return {
    title: cap(0.2, minBase, 13),
    name: cap(0.17, Math.max(5, minBase - 1), 11),
  };
}

type DepthStyle = {
  fill: string;
  text: string;
};

function depthStyle(depth: number, theme: PptxTheme): DepthStyle {
  const idx = Math.min(Math.max(depth, 0), 5);
  const fill = theme.colors[idx];
  // Dark backgrounds (depth 0 default) get white text; light backgrounds get dark text.
  const r = parseInt(fill.slice(0, 2), 16);
  const g = parseInt(fill.slice(2, 4), 16);
  const b = parseInt(fill.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const text = luminance < 0.5 ? 'FFFFFF' : '1F1F1F';
  return { fill, text };
}

function buildDepthMap(nodeMap: Map<string, LayoutNode>): Map<string, number> {
  const depth = new Map<string, number>();
  const visit = (id: string): number => {
    const cached = depth.get(id);
    if (cached != null) return cached;
    const node = nodeMap.get(id);
    if (!node) return 0;
    const parent = node.parent ? nodeMap.get(node.parent) : null;
    const d = parent ? visit(parent.id) + 1 : 0;
    depth.set(id, d);
    return d;
  };
  for (const id of nodeMap.keys()) visit(id);
  return depth;
}


function renderSlideChart(
  slide: PptxSlideCompat,
  spec: ExportSlideSpec,
  globalNodeMap: Map<string, LayoutNode>,
  directReportsById: Map<string, number>,
  theme: PptxTheme
): SlideRenderMeta {
  slide.background = { color: 'FFFFFF' };

  const nodeMap = spec.useGlobalLayout
    ? projectGlobalLayout(globalNodeMap, new Set(spec.employees.map((e) => e.id)))
    : layoutFullChart(spec.employees);

  const { minX, minY, maxX, maxY } = boundsPx(nodeMap);
  const CHART_TOP = CHART_TOP_IN;
  const { availW } = chartAreaInches();

  const contentW = Math.max(maxX - minX, 1);
  const contentH = Math.max(maxY - minY, 1);

  const scale = scaleFitForBounds(minX, minY, maxX, maxY);
  const chartW = (contentW / 96) * scale;
  const chartOffsetX = SLIDE_PADDING + (availW - chartW) / 2;

  const toInX = (px: number) => chartOffsetX + ((px - minX) / 96) * scale;
  const toInY = (py: number) => CHART_TOP + ((py - minY) / 96) * scale;

  const nodeWIn = (NODE_W_PX / 96) * scale;
  const nodeHIn = (NODE_H_PX / 96) * scale;

  const { title: titleFontSize, name: nameFontSize } = fontSizesForBoxInches(
    nodeWIn,
    nodeHIn,
    spec.slideRole
  );
  const reportsFontSize = nameFontSize;
  /* Keep layer colors consistent with the full org chart:
   * depth comes from the global tree, not from the projected subtree slide. */
  const depthById = buildDepthMap(globalNodeMap);
  const useShrink = spec.slideRole === 'overview' || scale < 0.42;
  const lineW = 0.5;
  /* pptxgen `margin` is in **points**; array order is [left, right, bottom, top] (see library text-shape path). */
  const isZoomSlide = spec.slideRole === 'detail';
  const marginPt = isZoomSlide
    ? nodeHIn < 0.4
      ? ([7, 7, 5, 5] as const)
      : ([12, 12, 8, 8] as const)
    : nodeHIn < 0.4
      ? ([3, 3, 2, 2] as const)
      : ([4, 4, 3, 3] as const);

  for (const emp of spec.employees) {
    const node = nodeMap.get(emp.id);
    if (!node) continue;

    const nx = toInX(node.x);
    const ny = toInY(node.y);
    const style = depthStyle(depthById.get(emp.id) ?? 0, theme);
    const directReports =
      emp.id.startsWith(GROUPED_LEAF_ID_PREFIX) ? 0 : (directReportsById.get(emp.id) ?? 0);
    const runs: Array<{ text: string; options: Record<string, unknown> }> = [
      {
        text: emp.title,
        options: { bold: true, fontSize: titleFontSize, color: style.text, breakLine: true },
      },
      {
        text: emp.name,
        options: { fontSize: nameFontSize, color: style.text, breakLine: true },
      },
    ];
    if (directReports > 0 && theme.directReportsLabel) {
      runs.push({
        text: `${directReports} ${theme.directReportsLabel}`,
        options: { fontSize: reportsFontSize, color: style.text, breakLine: true },
      });
    }

    slide.addText(
      runs,
      {
        x: nx,
        y: ny,
        w: nodeWIn,
        h: nodeHIn,
        fill: { color: style.fill },
        line: { color: COLOR_BORDER, width: lineW },
        valign: 'middle',
        margin: [...marginPt],
        wrap: true,
        shrinkText: useShrink,
        fontFace: theme.fontFace,
        objectName: `emp-${emp.id}`,
      }
    );

  }

  return { nodeMap, toInX, toInY, edges: spec.edges };
}

/**
 * Glued elbow connector (`cxnSp`).
 * Use `bentConnector2` (one 90° bend, two segments). `bentConnector3` often adds a second bend
 * so the path looks like two elbows — avoid for “single elbow” org links.
 * Preset `rect` connection sites (DrawingML): 0 top, 1 right, 2 bottom, 3 left — **but** shapes
 * emitted by pptxgenjs for `addText` use **mirrored** L/R indices in practice: **1 = left**,
 * **3 = right**. `endCxn idx` must match the same physical edge as `rectAnchorPx` or glue breaks.
 */
function makeCxnSpXml(
  connId: number,
  srcShapeId: number,
  tgtShapeId: number,
  endCxnIdx: number,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  flipH: boolean,
  flipV: boolean,
  secondary = false
): string {
  const xE = emu(boxX);
  const yE = emu(boxY);
  const cxE = Math.max(1, emu(boxW));
  const cyE = Math.max(1, emu(boxH));
  const lw = Math.round(0.75 * 12700);
  const lineXml = secondary
    ? `<a:ln w="${lw}"><a:solidFill><a:srgbClr val="${COLOR_CONN}"/></a:solidFill><a:prstDash val="dash"/></a:ln>`
    : `<a:ln w="${lw}"><a:solidFill><a:srgbClr val="${COLOR_CONN}"/></a:solidFill></a:ln>`;
  const flipAttr = (flipH ? ' flipH="1"' : '') + (flipV ? ' flipV="1"' : '');

  return (
    `<p:cxnSp>` +
    `<p:nvCxnSpPr>` +
    `<p:cNvPr id="${connId}" name="Connector ${connId}"/>` +
    `<p:cNvCxnSpPr>` +
    `<a:stCxn id="${srcShapeId}" idx="2"/>` +
    `<a:endCxn id="${tgtShapeId}" idx="${endCxnIdx}"/>` +
    `</p:cNvCxnSpPr>` +
    `<p:nvPr/>` +
    `</p:nvCxnSpPr>` +
    `<p:spPr>` +
    `<a:xfrm${flipAttr}>` +
    `<a:off x="${xE}" y="${yE}"/>` +
    `<a:ext cx="${cxE}" cy="${cyE}"/>` +
    `</a:xfrm>` +
    `<a:prstGeom prst="bentConnector2"><a:avLst/></a:prstGeom>` +
    lineXml +
    `</p:spPr>` +
    `</p:cxnSp>`
  );
}

export interface PptxExportOptions {
  /** Visible employees (already filtered/collapsed by caller) */
  employees: Employee[];
  /** Visible parent→child edges */
  visibleEdges: Array<{ source: string; target: string; secondary?: boolean }>;
  orgName?: string;
  filename?: string;
  theme?: PptxTheme;
}

export async function exportToPptx(opts: PptxExportOptions): Promise<void> {
  const { employees, visibleEdges, orgName = 'Org Chart', filename = 'org-chart.pptx', theme = DEFAULT_PPTX_THEME } = opts;

  if (employees.length === 0) return;

  const directReportsById = buildDirectReportCounts(employees);
  const collapsed = collapseRepeatedLeafRoles(employees, visibleEdges);
  const exportEmployees = collapsed.employees;
  const exportEdges = collapsed.visibleEdges;

  const globalNodeMap = layoutFullChart(exportEmployees);
  const slidesSpec = buildExportSlideList(exportEmployees, exportEdges, orgName, globalNodeMap);

  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 × 7.5 inches

  const slideMetas: SlideRenderMeta[] = [];
  for (const spec of slidesSpec) {
    const slide = pptx.addSlide();
    slideMetas.push(renderSlideChart(slide as PptxSlideCompat, spec, globalNodeMap, directReportsById, theme));
  }

  const rawBuffer = (await pptx.write({ outputType: 'arraybuffer' })) as ArrayBuffer;

  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(rawBuffer);

  const slidePaths = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)/)![1], 10);
      const nb = parseInt(b.match(/slide(\d+)/)![1], 10);
      return na - nb;
    });

  if (slidePaths.length === 0) {
    _downloadBlob(new Blob([rawBuffer]), filename);
    return;
  }

  for (let i = 0; i < slidePaths.length; i++) {
    const path = slidePaths[i];
    const meta = slideMetas[i];
    const slideFile = zip.file(path);
    if (!slideFile || !meta) continue;

    let slideXml = await slideFile.async('string');

    const nodeShapeId = collectEmpNodeShapeIds(slideXml);

    let maxId = 1;
    for (const match of slideXml.matchAll(/\bid="(\d+)"/g)) {
      const n = parseInt(match[1], 10);
      if (n > maxId) maxId = n;
    }
    let connId = maxId + 1;

    const { nodeMap, toInX, toInY, edges } = meta;
    let connectorXml = '';
    for (const edge of edges) {
      const srcNode = nodeMap.get(edge.source);
      const tgtNode = nodeMap.get(edge.target);
      const srcSid = nodeShapeId.get(edge.source);
      const tgtSid = nodeShapeId.get(edge.target);

      if (!srcNode || !tgtNode || srcSid == null || tgtSid == null) continue;

      const srcPt = rectAnchorPx(srcNode, 'bottom');
      const col = twoColumnLeafSide(nodeMap, edge.target);
      let tgtSite: 'top' | 'left' | 'right';
      let endCxnIdx: number;
      if (col === 'left') {
        tgtSite = 'right';
        endCxnIdx = 3;
      } else if (col === 'right') {
        tgtSite = 'left';
        endCxnIdx = 1;
      } else {
        tgtSite = 'top';
        endCxnIdx = 0;
      }
      const tgtPt = rectAnchorPx(tgtNode, tgtSite);

      const x1 = toInX(srcPt.x);
      const y1 = toInY(srcPt.y);
      const x2 = toInX(tgtPt.x);
      const y2 = toInY(tgtPt.y);
      /* Include leaf box center so bentConnector2’s single bend sits in the middle of the card
       * (OOXML has no “center” glue site on rect — this nudges routing via the connector bounds). */
      const leafMidX = toInX(tgtNode.x + NODE_W_PX / 2);
      const leafMidY = toInY(tgtNode.y + NODE_H_PX / 2);

      const MIN_CONN_IN = 0.1;
      const left = Math.min(x1, x2, leafMidX);
      const right = Math.max(x1, x2, leafMidX);
      const top = Math.min(y1, y2, leafMidY);
      const bottom = Math.max(y1, y2, leafMidY);
      const boxW = Math.max(right - left, MIN_CONN_IN);
      const boxH = Math.max(bottom - top, MIN_CONN_IN);
      const boxX = left;
      const boxY = top;
      const flipH = x2 < x1;
      const flipV = y2 < y1;

      connectorXml += makeCxnSpXml(
        connId,
        srcSid,
        tgtSid,
        endCxnIdx,
        boxX,
        boxY,
        boxW,
        boxH,
        flipH,
        flipV,
        edge.secondary ?? false
      );
      connId++;
    }

    if (connectorXml) {
      const empLead = /(?=<p:sp>\s*<p:nvSpPr>\s*<p:cNvPr[^>]*name="emp-)/;
      if (empLead.test(slideXml)) {
        slideXml = slideXml.replace(empLead, connectorXml);
      } else {
        slideXml = slideXml.replace('</p:grpSpPr>', `</p:grpSpPr>${connectorXml}`);
      }
    }
    zip.file(path, slideXml);
  }

  const finalBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
  _downloadBlob(finalBlob, filename);
}

function _downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
