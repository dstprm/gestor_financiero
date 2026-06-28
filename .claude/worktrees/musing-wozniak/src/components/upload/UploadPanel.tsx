'use client';
import { Component, type ReactNode } from 'react';
import { useState, useRef, useCallback } from 'react';
import { useOrgStore } from '@/store/orgStore';
import { parseFile, mapRowsToEmployees, rowsToImportPayload } from '@/lib/importer';
import type { ColumnMapping } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

class UploadErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 space-y-3">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center space-y-2">
            <p className="text-sm text-red-600 dark:text-red-300 font-medium">Something went wrong with this file.</p>
            <p className="text-xs text-red-500 dark:text-red-400">Please try a different one.</p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="w-full py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-600 dark:text-slate-300 transition-colors"
          >
            Start over
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const FIELDS: (keyof ColumnMapping)[] = [
  'id', 'name', 'firstName', 'lastName', 'title', 'managerId', 'managerName',
  'department', 'level', 'location', 'status', 'email',
];

const FIELD_LABELS: Record<keyof ColumnMapping, string> = {
  id: 'Employee ID',
  name: 'Full Name',
  firstName: 'First Name',
  lastName: 'Last Name',
  title: 'Job Title',
  managerId: 'Manager ID',
  managerName: 'Manager Name',
  department: 'Department',
  level: 'Level / Grade',
  location: 'Location',
  status: 'Status',
  email: 'Email',
};

function safePreview(rows: Record<string, string>[], mapping: ColumnMapping) {
  try {
    return mapRowsToEmployees(rows.slice(0, 3), mapping);
  } catch {
    return [];
  }
}

export function UploadPanel() {
  const {
    setImportData, applyImport, clearImport,
    rawImportData, importHeaders, columnMappingDraft,
    loadSampleData, organizationId, loadFromDB,
  } = useOrgStore();
  const [dragging, setDragging] = useState(false);
  const [mapping, setMapping] = useState<ColumnMapping>(columnMappingDraft ?? {});
  const [headers, setHeaders] = useState<string[]>(importHeaders ?? []);
  const [rows, setRows] = useState<Record<string, string>[]>(rawImportData ?? []);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [parseError, setParseError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setParseError('Please upload an Excel (.xlsx, .xls) or CSV file.');
      return;
    }
    setParsing(true);
    setFileName(file.name);
    setParseError('');
    try {
      const result = await parseFile(file);
      if (result.rows.length === 0) {
        setParseError('The file appears to be empty or has no readable rows.');
        setParsing(false);
        return;
      }
      setRows(result.rows);
      setHeaders(result.headers);
      setMapping(result.mapping);
      setConfidence(result.confidence);
      setImportData(result.rows, result.headers, result.mapping);
    } catch (err) {
      setParseError(`Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setParsing(false);
    }
  }, [setImportData]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }, [processFile]);

  function handleReset() {
    setRows([]);
    setHeaders([]);
    setMapping({});
    setFileName('');
    setConfidence(0);
    setParseError('');
    clearImport();
  }

  async function handleApply() {
    if (!rows.length) return;

    if (organizationId) {
      // Persist to DB via API
      setImporting(true);
      setParseError('');
      try {
        const payload = rowsToImportPayload(rows, mapping);
        if (payload.length === 0) {
          setParseError('No valid employee names found. Please check the Name column mapping.');
          setImporting(false);
          return;
        }

        const res = await fetch('/api/org/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orgId: organizationId, employees: payload }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error || `Server error ${res.status}`);
        }

        const { created, skipped } = await res.json() as { created: number; skipped: number };

        await loadFromDB(organizationId);
        handleReset();

        const msg = `Imported ${created} employee${created !== 1 ? 's' : ''}${skipped > 0 ? `, ${skipped} skipped` : ''}`;
        toast.success(msg);
      } catch (err) {
        setParseError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setImporting(false);
      }
    } else {
      // Local-only (no DB configured) — add as a scenario
      try {
        const scenarioName = fileName.replace(/\.(xlsx|xls|csv)$/i, '') || 'Imported Data';
        const employees = mapRowsToEmployees(rows, mapping);
        applyImport(employees, scenarioName);
      } catch (err) {
        setParseError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  }

  const preview = safePreview(rows, mapping);

  return (
    <UploadErrorBoundary>
    <div className="flex flex-col h-full">
      <div className="px-3 py-2.5 border-b border-gray-200 dark:border-slate-700 shrink-0">
        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Upload Data</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-4">
          {rows.length === 0 ? (
            <>
              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-all',
                  dragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-200 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500'
                )}
              >
                {parsing ? (
                  <div className="text-gray-400 dark:text-slate-400 text-sm animate-pulse">Parsing…</div>
                ) : (
                  <>
                    <FileSpreadsheet size={32} className="text-gray-400 dark:text-slate-500" />
                    <div className="text-center">
                      <p className="text-sm text-gray-700 dark:text-slate-300 font-medium">Drop your roster here</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Excel (.xlsx) or CSV</p>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-slate-600">or click to browse</p>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInput}
                className="hidden"
              />

              {parseError && (
                <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertTriangle size={13} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-600 dark:text-red-300">{parseError}</p>
                </div>
              )}

              {/* Sample data shortcut */}
              <div className="text-center">
                <p className="text-xs text-gray-400 dark:text-slate-600 mb-2">— or —</p>
                <button
                  onClick={loadSampleData}
                  className="w-full py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-600 dark:text-slate-300"
                >
                  Load Sample Data
                </button>
              </div>
            </>
          ) : (
            <>
              {/* File loaded */}
              <div className="flex items-center gap-2 p-2.5 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                <FileSpreadsheet size={16} className="text-green-500 dark:text-green-400 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-slate-300 truncate flex-1">{fileName}</span>
                <span className="text-xs text-gray-400 dark:text-slate-500">{rows.length} rows</span>
                <button onClick={handleReset} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300">
                  <X size={14} />
                </button>
              </div>

              {/* Confidence */}
              {confidence < 0.8 && (
                <div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <AlertTriangle size={13} className="text-yellow-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    Auto-detection was uncertain. Please verify the column mapping below.
                  </p>
                </div>
              )}
              {confidence >= 0.8 && (
                <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <CheckCircle size={13} className="text-green-400 shrink-0" />
                  <p className="text-xs text-green-700 dark:text-green-300">Columns detected automatically</p>
                </div>
              )}

              {parseError && (
                <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertTriangle size={13} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-600 dark:text-red-300">{parseError}</p>
                </div>
              )}

              {/* Column mapper */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-slate-500 font-medium uppercase tracking-wider">Column Mapping</p>
                {FIELDS.map((field) => (
                  <div key={field} className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 dark:text-slate-400 w-24 shrink-0">{FIELD_LABELS[field]}</label>
                    <select
                      value={mapping[field] ?? ''}
                      onChange={(e) => setMapping({ ...mapping, [field]: e.target.value || undefined })}
                      className="flex-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-gray-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">(skip)</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Preview */}
              {preview.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-500 font-medium uppercase tracking-wider mb-2">Preview (first 3 rows)</p>
                  <div className="space-y-1.5">
                    {preview.map((e, i) => (
                      <div key={i} className="p-2 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700 text-xs">
                        <p className="text-gray-800 dark:text-slate-200 font-medium">{e.name}</p>
                        <p className="text-gray-500 dark:text-slate-500">{e.title} · {e.department}</p>
                        <p className="text-gray-400 dark:text-slate-600">ID: {e.id} | Mgr: {e.managerId ?? '(root)'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Import button pinned to footer — only shown when a file is loaded */}
      {rows.length > 0 && (
        <div className="border-t border-gray-200 dark:border-slate-700 p-3 shrink-0">
          <button
            onClick={handleApply}
            disabled={importing}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
          >
            {importing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Importing {rows.length} employees…
              </>
            ) : (
              `Import ${rows.length} Employees`
            )}
          </button>
        </div>
      )}
    </div>
    </UploadErrorBoundary>
  );
}
