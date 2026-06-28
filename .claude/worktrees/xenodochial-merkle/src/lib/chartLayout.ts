import type { Employee } from '@/types';
import type { Node, Edge } from '@xyflow/react';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 88;
const H_GAP = 24;   // tighter horizontal gap — reduces excessive width on wide trees
const V_GAP = 100;  // more vertical breathing room between levels
const V_CLEARANCE = 24; // minimum gap between bottom of one level and top of next
// Max direct children laid out in one horizontal row before wrapping to a new visual row.
// This prevents "flat strip" charts when one manager has many direct reports.
const MAX_CHILDREN_PER_ROW = 7;

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  children: string[];
  parent: string | null;
}

function buildTree(employees: Employee[]): Map<string, LayoutNode> {
  const ids = new Set(employees.map((e) => e.id));
  const nodeMap = new Map<string, LayoutNode>();

  for (const e of employees) {
    nodeMap.set(e.id, {
      id: e.id,
      x: 0,
      y: 0,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
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

/** Reingold-Tilford-inspired recursive layout */
function layoutTree(
  nodeMap: Map<string, LayoutNode>,
  rootId: string,
  startX: number,
  depth: number,
  direction: 'TB' | 'LR'
): number {
  const node = nodeMap.get(rootId)!;
  const isVertical = direction === 'TB';

  if (node.children.length === 0) {
    if (isVertical) {
      node.x = startX;
      node.y = depth * (NODE_HEIGHT + V_GAP);
    } else {
      node.x = depth * (NODE_WIDTH + H_GAP);
      node.y = startX;
    }
    return isVertical ? startX + NODE_WIDTH + H_GAP : startX + NODE_HEIGHT + V_GAP;
  }

  let cursor = startX;
  for (const childId of node.children) {
    cursor = layoutTree(nodeMap, childId, cursor, depth + 1, direction);
  }

  // Center parent over children
  const firstChild = nodeMap.get(node.children[0])!;
  const lastChild = nodeMap.get(node.children[node.children.length - 1])!;

  if (isVertical) {
    node.x = (firstChild.x + lastChild.x) / 2;
    node.y = depth * (NODE_HEIGHT + V_GAP);
  } else {
    node.y = (firstChild.y + lastChild.y) / 2;
    node.x = depth * (NODE_WIDTH + H_GAP);
  }

  return cursor;
}

/** Recursively shift an entire subtree's Y (TB) or X (LR) position by dy. */
function shiftSubtree(
  nodeMap: Map<string, LayoutNode>,
  rootId: string,
  dy: number,
  direction: 'TB' | 'LR'
): void {
  const node = nodeMap.get(rootId);
  if (!node) return;
  if (direction === 'TB') {
    node.y += dy;
  } else {
    node.x += dy;
  }
  for (const childId of node.children) {
    shiftSubtree(nodeMap, childId, dy, direction);
  }
}

/**
 * Post-processing pass: when a parent node has more than MAX_CHILDREN_PER_ROW
 * direct children, wrap the excess children into additional visual rows.
 * Each extra row is pushed down (TB) or right (LR) by one level step so the
 * chart forms a compact grid instead of an unreadably wide flat strip.
 *
 * Processes parents top-to-bottom so that shifting a subtree for one parent
 * carries all of that subtree's descendants — including any that also need
 * wrapping — along with it.
 */
function wrapWideSiblings(nodeMap: Map<string, LayoutNode>, direction: 'TB' | 'LR'): void {
  const ROW_STEP = (direction === 'TB' ? NODE_HEIGHT : NODE_WIDTH) +
                   (direction === 'TB' ? V_GAP : H_GAP);

  // Group children by parent, sorted top-to-bottom (or left-to-right).
  const parentToChildren = new Map<string, string[]>();
  for (const [id, node] of nodeMap) {
    if (node.parent) {
      if (!parentToChildren.has(node.parent)) parentToChildren.set(node.parent, []);
      parentToChildren.get(node.parent)!.push(id);
    }
  }

  // Process shallowest parents first so descendant shifts are already in place.
  const parentsWithMany = Array.from(parentToChildren.entries())
    .filter(([, children]) => children.length > MAX_CHILDREN_PER_ROW)
    .sort(([aId], [bId]) => {
      const aPos = direction === 'TB' ? (nodeMap.get(aId)?.y ?? 0) : (nodeMap.get(aId)?.x ?? 0);
      const bPos = direction === 'TB' ? (nodeMap.get(bId)?.y ?? 0) : (nodeMap.get(bId)?.x ?? 0);
      return aPos - bPos;
    });

  for (const [, children] of parentsWithMany) {
    // Sort children by their primary axis position.
    children.sort((a, b) =>
      direction === 'TB'
        ? (nodeMap.get(a)?.x ?? 0) - (nodeMap.get(b)?.x ?? 0)
        : (nodeMap.get(a)?.y ?? 0) - (nodeMap.get(b)?.y ?? 0)
    );

    // Wrap into rows.
    const rows: string[][] = [];
    for (let i = 0; i < children.length; i += MAX_CHILDREN_PER_ROW) {
      rows.push(children.slice(i, i + MAX_CHILDREN_PER_ROW));
    }

    // Shift each row (and its subtree) by rowIndex * ROW_STEP.
    for (let rowIdx = 1; rowIdx < rows.length; rowIdx++) {
      const shift = rowIdx * ROW_STEP;
      for (const childId of rows[rowIdx]) {
        shiftSubtree(nodeMap, childId, shift, direction);
      }
    }
  }
}

/**
 * After the Reingold-Tilford pass all nodes at the same depth share the same Y
 * (TB) or X (LR). Scan consecutive level pairs and push lower levels down (or
 * right) until there is at least V_CLEARANCE between the bottom of one level
 * and the top of the next.
 */
function resolveVerticalOverlaps(
  nodeMap: Map<string, LayoutNode>,
  direction: 'TB' | 'LR'
): void {
  const isVertical = direction === 'TB';

  // Collect distinct level positions and map them to their nodes.
  const levelMap = new Map<number, LayoutNode[]>();
  for (const node of nodeMap.values()) {
    const pos = isVertical ? node.y : node.x;
    if (!levelMap.has(pos)) levelMap.set(pos, []);
    levelMap.get(pos)!.push(node);
  }

  const levelPositions = Array.from(levelMap.keys()).sort((a, b) => a - b);

  for (let i = 0; i < levelPositions.length - 1; i++) {
    const upperPos = levelPositions[i];
    const lowerPos = levelPositions[i + 1];
    const nodeSize = NODE_HEIGHT;
    const minDistance = nodeSize + V_CLEARANCE;

    if (lowerPos - upperPos < minDistance) {
      const shift = minDistance - (lowerPos - upperPos);
      // Push every level below the upper one down by the required amount.
      for (let j = i + 1; j < levelPositions.length; j++) {
        const nodesAtLevel = levelMap.get(levelPositions[j])!;
        for (const node of nodesAtLevel) {
          if (isVertical) {
            node.y += shift;
          } else {
            node.x += shift;
          }
        }
        levelPositions[j] += shift;
      }
    }
  }
}

export function buildFlowGraph(
  employees: Employee[],
  direction: 'TB' | 'LR' = 'TB',
  highlightIds?: Set<string>,
  diffMap?: Map<string, 'added' | 'removed' | 'moved' | 'modified'>,
  layoutMode: 'organized' | 'freeStyle' = 'organized'
): { nodes: Node[]; edges: Edge[] } {
  const ids = new Set(employees.map((e) => e.id));
  const nodeMap = buildTree(employees);

  // Find roots
  const roots = employees.filter((e) => !e.managerId || !ids.has(e.managerId));

  let cursor = 0;
  for (const root of roots) {
    cursor = layoutTree(nodeMap, root.id, cursor, 0, direction);
  }

  // Wrap parents with many direct children into multiple visual rows so the
  // chart doesn't become an unreadably wide flat strip.
  wrapWideSiblings(nodeMap, direction);

  resolveVerticalOverlaps(nodeMap, direction);

  const nodes: Node[] = employees.map((e) => {
    const layout = nodeMap.get(e.id)!;
    const diffStatus = diffMap?.get(e.id);

    // In free style mode, use stored position if available; fall back to auto layout
    const position =
      layoutMode === 'freeStyle' && e.positionX != null && e.positionY != null
        ? { x: e.positionX, y: e.positionY }
        : { x: layout.x, y: layout.y };

    return {
      id: e.id,
      type: 'orgNode',
      position,
      data: {
        employee: e,
        isHighlighted: highlightIds?.has(e.id) ?? false,
        diffStatus,
      },
      draggable: true,
    };
  });

  const edges: Edge[] = employees
    .filter((e) => e.managerId && ids.has(e.managerId))
    .map((e) => ({
      id: `${e.managerId}-${e.id}`,
      source: e.managerId!,
      target: e.id,
      type: 'smoothstep',
      style: { stroke: '#475569', strokeWidth: 1.5 },
      animated: false,
    }));

  return { nodes, edges };
}
