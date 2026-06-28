'use client';
import { useState } from 'react';
import {
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge,
  type EdgeProps,
} from '@xyflow/react';
import { useOrgStore } from '@/store/orgStore';

export function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  target,
  style,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false);
  const updateEmployee = useOrgStore((s) => s.updateEmployee);

  // Place the horizontal segment close to the parent (30 px below source handle)
  // rather than at the midpoint. This prevents the bus line from running through
  // sibling nodes that sit between the parent and a wrapped-row child.
  const busY = targetY > sourceY + 60 ? sourceY + 30 : undefined;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    centerY: busY,
    borderRadius: 8,
  });

  const handleRemove = () => {
    if (window.confirm('Remove this reporting relationship?')) {
      updateEmployee(target, { managerId: null });
    }
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: hovered ? '#94a3b8' : (style?.stroke as string | undefined),
          strokeWidth: hovered ? 2 : (style?.strokeWidth as number | undefined),
        }}
      />
      {/* Wide invisible hit area for hover */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={20}
        stroke="transparent"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: 'pointer' }}
      />
      {hovered && (
        <EdgeLabelRenderer>
          <button
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="w-5 h-5 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white text-xs leading-none font-bold nodrag nopan"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={handleRemove}
            title="Remove reporting relationship"
          >
            ×
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
