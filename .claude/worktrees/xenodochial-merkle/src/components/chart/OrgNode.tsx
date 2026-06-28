'use client';
import { memo, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { Employee } from '@/types';
import { getDeptColor, FLAG_META, STATUS_META, DISPLAY_FONT_OPTIONS, DEFAULT_DISPLAY_SETTINGS } from '@/types';
import { useOrgStore } from '@/store/orgStore';
import { cn } from '@/lib/utils';

interface OrgNodeData {
  employee: Employee;
  isHighlighted: boolean;
  diffStatus?: 'added' | 'removed' | 'moved' | 'modified';
  childCount: number;
  hiddenChildrenCount: number;
  isCollapsed: boolean;
  isDimmed: boolean;
}

const DIFF_STYLES = {
  added: 'ring-2 ring-green-500 bg-green-500/10',
  removed: 'ring-2 ring-red-500 bg-red-500/10 opacity-60',
  moved: 'ring-2 ring-blue-500 bg-blue-500/10',
  modified: 'ring-2 ring-yellow-500 bg-yellow-500/10',
};

export const OrgNode = memo(function OrgNode({ data }: NodeProps) {
  const nodeData = data as unknown as OrgNodeData;
  const { employee, isHighlighted, diffStatus, childCount, hiddenChildrenCount, isCollapsed, isDimmed } = nodeData;
  const toggleCollapseNode = useOrgStore((s) => s.toggleCollapseNode);
  const selectedNodeId = useOrgStore((s) => s.selectedNodeId);
  const selectedIds = useOrgStore((s) => s.selectedIds);
  const interactionMode = useOrgStore((s) => s.interactionMode);
  const displaySettings = useOrgStore((s) => s.displaySettings ?? DEFAULT_DISPLAY_SETTINGS);
  const isSelected = selectedNodeId === employee.id;
  const isMultiSelected = selectedIds.includes(employee.id);

  const handleCollapseToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      toggleCollapseNode(employee.id);
    },
    [employee.id, toggleCollapseNode]
  );

  // Native touch handler: fires in capture phase before React Flow can intercept
  const chevronRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const btn = chevronRef.current;
    if (!btn) return;
    const handler = (e: TouchEvent) => {
      if (interactionMode === 'connect') return;
      e.stopImmediatePropagation();
      e.preventDefault();
      toggleCollapseNode(employee.id);
    };
    btn.addEventListener('touchstart', handler, { capture: true, passive: false });
    return () => btn.removeEventListener('touchstart', handler, { capture: true });
  }, [employee.id, toggleCollapseNode, interactionMode]);

  const deptColor = displaySettings.deptColors?.[employee.department] ?? getDeptColor(employee.department);
  const statusMeta = STATUS_META[employee.status];
  const isVacant = employee.status === 'vacant';

  const fontFamily = DISPLAY_FONT_OPTIONS.find((f) => f.id === displaySettings.font)?.family
    ?? DISPLAY_FONT_OPTIONS[0].family;

  const sizeClass = displaySettings.nodeSize === 'small'
    ? 'w-40 min-w-[120px]'
    : displaySettings.nodeSize === 'large'
    ? 'w-56 min-w-[160px]'
    : 'w-48 min-w-[140px]';

  const paddingClass = displaySettings.nodeSize === 'small' ? 'p-2' : 'p-2.5';

  const fields = displaySettings.fields ?? DEFAULT_DISPLAY_SETTINGS.fields;

  return (
    <div
      className={cn(
        'relative rounded-lg border cursor-pointer transition-all duration-150',
        sizeClass,
        'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500',
        isDimmed && 'opacity-40 dark:opacity-20 border-gray-300 dark:border-slate-600',
        isSelected && 'border-blue-500 ring-2 ring-blue-500/40',
        isMultiSelected && 'border-violet-500 ring-2 ring-violet-500/50',
        isHighlighted && !isSelected && !isMultiSelected && 'border-yellow-400 ring-2 ring-yellow-400/40',
        diffStatus && DIFF_STYLES[diffStatus],
        isVacant && 'opacity-70 border-dashed'
      )}
      style={{ fontFamily }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={cn(
          '!bg-gray-300 dark:!bg-slate-600 !border-gray-200 dark:!border-slate-500 transition-all',
          interactionMode === 'connect'
            ? '!w-6 !h-6 !bg-blue-500 !border-blue-400'
            : '!w-2 !h-2 opacity-0 pointer-events-none'
        )}
      />

      {/* Department color strip */}
      <div
        className="h-1 w-full rounded-t-lg"
        style={{ backgroundColor: deptColor }}
      />

      <div className={paddingClass}>
        {/* Name + flags */}
        <div className="flex items-start justify-between gap-1 mb-0.5">
          <span className={cn(
            'text-sm font-semibold leading-tight truncate',
            isVacant ? 'text-gray-400 dark:text-slate-400 italic' : 'text-gray-900 dark:text-slate-100'
          )}>
            {employee.name}
          </span>
          {employee.flags.length > 0 && (
            <div className="flex gap-0.5 shrink-0 mt-0.5">
              {employee.flags.slice(0, 3).map((f) => (
                <span key={f} className="text-xs leading-none" title={FLAG_META[f].label}>
                  {FLAG_META[f].emoji}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Fields in user-defined order */}
        {fields.map((field) => {
          if (!field.enabled) return null;
          if (field.id === 'title') {
            return (
              <p key="title" className="text-xs text-gray-500 dark:text-slate-400 truncate leading-tight">
                {employee.title}
              </p>
            );
          }
          if (field.id === 'department') {
            return (
              <p key="department" className="text-xs truncate mt-0.5" style={{ color: deptColor }}>
                {employee.department}
              </p>
            );
          }
          if (field.id === 'status') {
            return (
              <span
                key="status"
                className="inline-block text-xs px-1.5 py-0.5 rounded-full mt-0.5"
                style={{ backgroundColor: statusMeta.color + '22', color: statusMeta.color }}
              >
                {statusMeta.label}
              </span>
            );
          }
          if (field.id === 'location' && employee.location) {
            return (
              <p key="location" className="text-xs text-gray-400 dark:text-slate-500 truncate mt-0.5">
                📍 {employee.location}
              </p>
            );
          }
          return null;
        })}
      </div>

      {/* Collapse / expand toggle — ref used for native touch capture */}
      {childCount > 0 && (
        <div className="nodrag nopan" onClick={(e) => e.stopPropagation()}>
          <button
            ref={chevronRef}
            onClick={interactionMode === 'navigate' ? handleCollapseToggle : undefined}
            disabled={interactionMode === 'connect'}
            className={cn(
              'w-full flex items-center justify-center min-h-[44px] py-2 text-xs border-t border-gray-200 dark:border-slate-700',
              'text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700/60',
              'rounded-b-lg transition-colors',
              interactionMode === 'connect' && 'opacity-30 cursor-default'
            )}
            title={isCollapsed ? 'Expand children' : 'Collapse children'}
          >
            {isCollapsed
              ? `▶ ${hiddenChildrenCount} hidden`
              : '▼'}
          </button>
        </div>
      )}

      {/* Diff badge */}
      {diffStatus && (
        <div className={cn(
          'absolute -top-2 -right-2 text-xs px-1 py-0.5 rounded font-bold',
          diffStatus === 'added' && 'bg-green-500 text-white',
          diffStatus === 'removed' && 'bg-red-500 text-white',
          diffStatus === 'moved' && 'bg-blue-500 text-white',
          diffStatus === 'modified' && 'bg-yellow-500 text-black',
        )}>
          {diffStatus === 'added' ? '+' : diffStatus === 'removed' ? '−' : diffStatus === 'moved' ? '→' : '~'}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className={cn(
          '!bg-gray-300 dark:!bg-slate-600 !border-gray-200 dark:!border-slate-500 transition-all',
          interactionMode === 'connect'
            ? '!w-6 !h-6 !bg-blue-500 !border-blue-400'
            : '!w-2 !h-2 opacity-0 pointer-events-none'
        )}
      />
    </div>
  );
});
