import * as XLSX from 'xlsx';
import type { Employee, ColumnMapping, EmployeeStatus } from '@/types';

export interface ParseResult {
  rows: Record<string, string>[];
  headers: string[];
  mapping: ColumnMapping;
  confidence: number; // 0-1
}

/** Coerce any XLSX cell value (number, date, boolean, string, null) to a trimmed string. */
function str(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

const FIELD_ALIASES: Record<keyof ColumnMapping, string[]> = {
  id: ['employee id', 'emp id', 'person id', 'staff id', 'personnel id', 'worker id', 'emp_id', 'employee_id', 'empid', 'staff no', 'emp no', 'id'],
  name: ['full name', 'employee name', 'person name', 'worker name', 'emp name', 'display name', 'nombre completo', 'nombre', 'name'],
  firstName: ['first name', 'given name', 'forename', 'fname', 'first'],
  lastName: ['last name', 'family name', 'surname', 'apellido', 'lname', 'last'],
  title: ['job title', 'job role', 'position title', 'role name', 'designation', 'cargo', 'puesto', 'title', 'position', 'role'],
  managerId: ['manager id', 'mgr id', 'manager_id', 'reports to id', 'supervisor id', 'mgr_id', 'parent id', 'reports_to_id'],
  managerName: ['reports to', 'manager name', 'supervisor name', 'mgr name', 'manager', 'supervisor', 'jefe'],
  department: ['department name', 'dept name', 'business unit', 'business area', 'cost center', 'department', 'dept', 'division', 'area', 'team', 'group'],
  level: ['job level', 'seniority level', 'job grade', 'pay grade', 'level', 'grade', 'band', 'seniority', 'tier'],
  location: ['work location', 'office location', 'work site', 'location', 'office', 'site', 'city', 'country', 'region'],
  status: ['employment status', 'employee status', 'headcount type', 'worker type', 'status', 'active'],
  email: ['work email', 'corporate email', 'business email', 'email address', 'email', 'mail', 'correo'],
};

export function detectColumnMapping(headers: string[]): { mapping: ColumnMapping; confidence: number } {
  const normalized = headers.map((h) => h.toLowerCase().trim());
  const mapping: ColumnMapping = {};
  let matched = 0;

  for (const [field, aliases] of Object.entries(FIELD_ALIASES) as [keyof ColumnMapping, string[]][]) {
    for (const alias of aliases) {
      const idx = normalized.findIndex((h) => h === alias || h.includes(alias));
      if (idx !== -1) {
        mapping[field] = headers[idx];
        matched++;
        break;
      }
    }
  }

  const hasName = !!(mapping.name || (mapping.firstName && mapping.lastName));
  const hasId = !!mapping.id;
  if (!hasName && !hasId) return { mapping, confidence: 0 };
  const confidence = Math.min(1, matched / 5);
  return { mapping, confidence };
}

export function parseFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) { reject(new Error('Empty file')); return; }
        // Ensure we pass a Uint8Array — ArrayBuffer alone may not work in all SheetJS builds
        const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
        const wb = XLSX.read(bytes, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws) { reject(new Error('No sheets found')); return; }

        // Use defval:null so we can distinguish missing cells; we normalise to string ourselves
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });

        // Normalise all cell values to strings
        const rows: Record<string, string>[] = rawRows.map((row) => {
          const out: Record<string, string> = {};
          for (const [k, v] of Object.entries(row)) {
            out[k] = str(v);
          }
          return out;
        }).filter((row) => Object.values(row).some((v) => v !== '')); // drop fully-empty rows

        const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
        const { mapping, confidence } = detectColumnMapping(headers);
        resolve({ rows, headers, mapping, confidence });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function normalizeStatus(raw: string): EmployeeStatus {
  const v = raw.toLowerCase();
  if (v === 'vacant' || v === 'open' || v === 'unfilled') return 'vacant';
  if (v === 'contractor' || v === 'contract' || v === 'temp') return 'contractor';
  if (v === 'on-leave' || v === 'leave' || v === 'on leave') return 'on-leave';
  if (v === 'proposed' || v === 'future') return 'proposed';
  return 'active';
}

function resolveName(row: Record<string, string>, mapping: ColumnMapping): string {
  const direct = str(mapping.name ? row[mapping.name] : '');
  if (direct) return direct;
  const first = str(mapping.firstName ? row[mapping.firstName] : '');
  const last = str(mapping.lastName ? row[mapping.lastName] : '');
  return [first, last].filter(Boolean).join(' ');
}

export interface ImportPayloadRow {
  name: string;
  title?: string;
  department?: string;
  email?: string;
  managerName?: string;
}

export function rowsToImportPayload(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
): ImportPayloadRow[] {
  return rows
    .map((row) => {
      const name = resolveName(row, mapping);
      if (!name.trim()) return null;
      return {
        name,
        title: mapping.title ? (row[mapping.title] || undefined) : undefined,
        department: mapping.department ? (row[mapping.department] || undefined) : undefined,
        email: mapping.email ? (row[mapping.email] || undefined) : undefined,
        managerName: mapping.managerName ? (row[mapping.managerName] || undefined) : undefined,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
}

export function mapRowsToEmployees(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): Employee[] {
  // Build name → id lookup for managerName fallback (second-pass resolution)
  const nameToId = new Map<string, string>();
  for (let i = 0; i < rows.length; i++) {
    const id = str(mapping.id ? rows[i][mapping.id] : '') || `EMP-${i + 1}`;
    const name = resolveName(rows[i], mapping);
    if (name) nameToId.set(name.toLowerCase(), id);
  }

  return rows.map((row, idx) => {
    const name = resolveName(row, mapping) || `Employee ${idx + 1}`;
    const id = str(mapping.id ? row[mapping.id] : '') || `EMP-${idx + 1}`;

    let managerId: string | null = null;
    if (mapping.managerId) {
      const v = str(row[mapping.managerId]);
      if (v) managerId = v;
    }
    if (!managerId && mapping.managerName) {
      const mgrName = str(row[mapping.managerName]).toLowerCase();
      if (mgrName) managerId = nameToId.get(mgrName) ?? null;
    }

    // Collect unmapped columns as metadata
    const mappedCols = new Set(Object.values(mapping).filter(Boolean));
    const metadata: Record<string, string> = {};
    for (const key of Object.keys(row)) {
      if (!mappedCols.has(key) && row[key]) metadata[key] = row[key];
    }

    return {
      id,
      name,
      title: str(mapping.title ? row[mapping.title] : ''),
      managerId: managerId === id ? null : managerId, // auto-fix self-reporting
      department: str(mapping.department ? row[mapping.department] : '') || 'Unknown',
      level: str(mapping.level ? row[mapping.level] : ''),
      location: str(mapping.location ? row[mapping.location] : ''),
      status: normalizeStatus(str(mapping.status ? row[mapping.status] : '')),
      email: str(mapping.email ? row[mapping.email] : ''),
      flags: [],
      notes: '',
      metadata,
    } satisfies Employee;
  });
}
