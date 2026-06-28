'use client';
import { useState, useCallback } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { X, Download, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PptxTheme } from '@/types';
import { DEFAULT_PPTX_THEME, PPTX_DEPTH_LABELS, PPTX_FONT_OPTIONS } from '@/types';

interface Props {
  initialTheme: PptxTheme;
  onExport: (theme: PptxTheme) => void;
  onSaveAndExport: (theme: PptxTheme) => void;
  onClose: () => void;
}

function ColorRow({
  label,
  color,
  onChange,
}: {
  label: string;
  color: string;
  onChange: (c: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 dark:text-slate-400 w-36 shrink-0">{label}</span>
      <div className="relative">
        <button
          onClick={() => setPickerOpen((o) => !o)}
          className="w-7 h-7 rounded border-2 border-white dark:border-slate-600 shadow-sm ring-1 ring-gray-200 dark:ring-slate-600 shrink-0"
          style={{ background: `#${color}` }}
          title="Pick color"
        />
        {pickerOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
            <div className="absolute left-0 top-9 z-50 shadow-xl rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600">
              <HexColorPicker color={`#${color}`} onChange={(c) => onChange(c.replace('#', ''))} />
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded px-2 py-1">
        <span className="text-xs text-gray-400">#</span>
        <HexColorInput
          color={`#${color}`}
          onChange={(c) => onChange(c.replace('#', ''))}
          className="w-16 text-xs bg-transparent text-gray-800 dark:text-slate-200 outline-none uppercase"
        />
      </div>
    </div>
  );
}

function MiniPreview({ theme }: { theme: PptxTheme }) {
  const levels = [0, 1, 2, 3] as const;
  const labels = ['CEO', 'VP Eng', 'Director', 'Manager'];
  const widths = ['w-28', 'w-24', 'w-20', 'w-16'];

  return (
    <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 flex flex-col items-center gap-1.5 border border-gray-200 dark:border-slate-700">
      <p className="text-xs text-gray-400 dark:text-slate-500 mb-1 self-start">Preview</p>
      {levels.map((d) => {
        const fill = `#${theme.colors[d]}`;
        const r = parseInt(theme.colors[d].slice(0, 2), 16);
        const g = parseInt(theme.colors[d].slice(2, 4), 16);
        const b = parseInt(theme.colors[d].slice(4, 6), 16);
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const textColor = lum < 0.5 ? '#FFFFFF' : '#1F1F1F';
        return (
          <div
            key={d}
            className={cn('rounded px-3 py-1 text-xs font-medium text-center shrink-0', widths[d])}
            style={{ background: fill, color: textColor, fontFamily: theme.fontFace }}
          >
            {labels[d]}
          </div>
        );
      })}
    </div>
  );
}

export function PptxExportModal({ initialTheme, onExport, onSaveAndExport, onClose }: Props) {
  const [theme, setTheme] = useState<PptxTheme>({ ...DEFAULT_PPTX_THEME, ...initialTheme });

  const setColor = useCallback((idx: number, color: string) => {
    setTheme((t) => {
      const next = [...t.colors] as PptxTheme['colors'];
      next[idx] = color.replace('#', '');
      return { ...t, colors: next };
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Export as PowerPoint</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-6">
          {/* Colors + preview side by side */}
          <div className="flex gap-4">
            {/* Color rows */}
            <div className="flex-1 space-y-2.5">
              <p className="text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                Depth Colors
              </p>
              {PPTX_DEPTH_LABELS.map((label, i) => (
                <ColorRow
                  key={i}
                  label={label}
                  color={theme.colors[i as 0 | 1 | 2 | 3 | 4 | 5]}
                  onChange={(c) => setColor(i, c)}
                />
              ))}
            </div>
            {/* Preview */}
            <div className="shrink-0">
              <MiniPreview theme={theme} />
            </div>
          </div>

          {/* Font */}
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Font
            </p>
            <select
              value={theme.fontFace}
              onChange={(e) => setTheme((t) => ({ ...t, fontFace: e.target.value }))}
              className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md px-3 py-2 text-sm text-gray-800 dark:text-slate-200 outline-none focus:border-blue-500"
            >
              {PPTX_FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Direct reports label */}
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Direct Reports Label
            </p>
            <input
              type="text"
              value={theme.directReportsLabel}
              onChange={(e) => setTheme((t) => ({ ...t, directReportsLabel: e.target.value }))}
              placeholder="e.g. direct reports  (leave blank to hide)"
              className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md px-3 py-2 text-sm text-gray-800 dark:text-slate-200 outline-none focus:border-blue-500 placeholder-gray-400 dark:placeholder-slate-500"
            />
          </div>

          {/* Reset link */}
          <button
            onClick={() => setTheme(DEFAULT_PPTX_THEME)}
            className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 underline"
          >
            Reset to defaults
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-gray-100 dark:border-slate-700">
          <button
            onClick={() => onExport(theme)}
            className="text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 flex items-center gap-1.5"
          >
            <Download size={13} />
            Export without saving
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={() => onSaveAndExport(theme)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Save size={13} />
              Save & Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
