'use client';
import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useOrgStore } from '@/store/orgStore';
import { selectEmployees } from '@/store/selectors';
import { cn } from '@/lib/utils';
import {
  DISPLAY_FONT_OPTIONS,
  DEFAULT_DISPLAY_SETTINGS,
  getDeptColor,
  type DisplayNodeField,
} from '@/types';
import { X, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';

interface DisplayOptionsPanelProps {
  onClose: () => void;
}

export function DisplayOptionsPanel({ onClose }: DisplayOptionsPanelProps) {
  const { displaySettings, setDisplaySettings, saveDisplaySettings } = useOrgStore((s) => ({
    displaySettings: s.displaySettings,
    setDisplaySettings: s.setDisplaySettings,
    saveDisplaySettings: s.saveDisplaySettings,
  }));
  const employees = useOrgStore(selectEmployees);

  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);

  const fields = displaySettings.fields ?? DEFAULT_DISPLAY_SETTINGS.fields;
  const deptColors = displaySettings.deptColors ?? {};

  // Unique departments present in the current chart
  const departments = [...new Set(employees.map((e) => e.department))].sort();

  function updateAndSave(patch: Parameters<typeof setDisplaySettings>[0]) {
    setDisplaySettings(patch);
    void saveDisplaySettings();
  }

  function toggleField(id: DisplayNodeField['id']) {
    const updated = fields.map((f) =>
      f.id === id ? { ...f, enabled: !f.enabled } : f
    );
    updateAndSave({ fields: updated });
  }

  function moveField(index: number, direction: -1 | 1) {
    const swapIdx = index + direction;
    if (swapIdx < 0 || swapIdx >= fields.length) return;
    const updated = [...fields];
    [updated[index], updated[swapIdx]] = [updated[swapIdx], updated[index]];
    updateAndSave({ fields: updated });
  }

  function setDeptColor(dept: string, color: string) {
    updateAndSave({ deptColors: { ...deptColors, [dept]: color } });
  }

  function resetDeptColor(dept: string) {
    const updated = { ...deptColors };
    delete updated[dept];
    updateAndSave({ deptColors: updated });
  }

  return (
    <div className="fixed left-2 right-2 sm:left-auto sm:right-4 top-14 w-auto sm:w-72 max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-50 p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-800 dark:text-slate-200">Display Options</span>
        <button
          onClick={onClose}
          className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
        >
          <X size={14} />
        </button>
      </div>

      {/* Section A — Font */}
      <div>
        <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Font</p>
        <div className="flex flex-col gap-1">
          {DISPLAY_FONT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => updateAndSave({ font: opt.id })}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md text-sm border transition-colors',
                displaySettings.font === opt.id
                  ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 hover:text-gray-900 dark:hover:text-white'
              )}
              style={{ fontFamily: opt.family }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section B — Fields to show */}
      <div>
        <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Fields to show</p>
        <div className="flex flex-col gap-1">
          {/* Name is always on */}
          <div className="flex items-center justify-between px-3 py-2 rounded-md bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600">
            <span className="text-sm text-gray-500 dark:text-slate-400">Name</span>
            <span className="text-xs text-gray-400 dark:text-slate-500">Always on</span>
          </div>

          {fields.map((field, idx) => (
            <div
              key={field.id}
              className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800"
            >
              {/* Toggle */}
              <button
                onClick={() => toggleField(field.id)}
                className={cn(
                  'w-8 h-4 rounded-full relative transition-colors shrink-0',
                  field.enabled
                    ? 'bg-blue-500 dark:bg-blue-600'
                    : 'bg-gray-200 dark:bg-slate-600'
                )}
                title={field.enabled ? 'Hide field' : 'Show field'}
              >
                <span
                  className={cn(
                    'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform',
                    field.enabled ? 'translate-x-4' : 'translate-x-0.5'
                  )}
                />
              </button>

              {/* Label */}
              <span className={cn(
                'flex-1 text-sm',
                field.enabled ? 'text-gray-700 dark:text-slate-200' : 'text-gray-400 dark:text-slate-500'
              )}>
                {field.label}
              </span>

              {/* Reorder */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  onClick={() => moveField(idx, -1)}
                  disabled={idx === 0}
                  className="text-gray-300 dark:text-slate-600 hover:text-gray-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  onClick={() => moveField(idx, 1)}
                  disabled={idx === fields.length - 1}
                  className="text-gray-300 dark:text-slate-600 hover:text-gray-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <ChevronDown size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section C — Node size */}
      <div>
        <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Node size</p>
        <div className="flex gap-2">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <button
              key={size}
              onClick={() => updateAndSave({ nodeSize: size })}
              className={cn(
                'flex-1 py-2 rounded-md border text-xs font-medium capitalize transition-colors',
                displaySettings.nodeSize === size
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Section D — Department Colors */}
      {departments.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Department Colors</p>
          <div className="flex flex-col gap-1">
            {departments.map((dept) => {
              const defaultColor = getDeptColor(dept);
              const customColor = deptColors[dept];
              const activeColor = customColor ?? defaultColor;
              const isOpen = openColorPicker === dept;
              const isCustom = !!customColor;

              return (
                <div key={dept}>
                  {/* Row */}
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    {/* Color swatch button */}
                    <button
                      onClick={() => setOpenColorPicker(isOpen ? null : dept)}
                      className="w-6 h-6 rounded border-2 border-white dark:border-slate-600 shadow-sm shrink-0 ring-1 ring-gray-200 dark:ring-slate-600 hover:ring-gray-400 dark:hover:ring-slate-400 transition-all"
                      style={{ backgroundColor: activeColor }}
                      title="Pick color"
                    />

                    {/* Department name */}
                    <span className="flex-1 text-sm text-gray-700 dark:text-slate-200 truncate">
                      {dept}
                    </span>

                    {/* Reset to default — only shown when customized */}
                    {isCustom && (
                      <button
                        onClick={() => { resetDeptColor(dept); if (isOpen) setOpenColorPicker(null); }}
                        title="Reset to default color"
                        className="text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 transition-colors shrink-0"
                      >
                        <RotateCcw size={11} />
                      </button>
                    )}
                  </div>

                  {/* Inline color picker */}
                  {isOpen && (
                    <div className="mt-1 mb-2 px-2">
                      <HexColorPicker
                        color={activeColor}
                        onChange={(color) => setDeptColor(dept, color)}
                        style={{ width: '100%', height: 160 }}
                      />
                      {/* Hex input */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-400 dark:text-slate-500">#</span>
                        <input
                          type="text"
                          value={activeColor.replace('#', '')}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
                            if (val.length === 6) setDeptColor(dept, `#${val}`);
                          }}
                          className="flex-1 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded px-2 py-1 text-xs font-mono text-gray-800 dark:text-slate-200 outline-none focus:border-blue-400"
                          maxLength={6}
                        />
                        <button
                          onClick={() => setOpenColorPicker(null)}
                          className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
