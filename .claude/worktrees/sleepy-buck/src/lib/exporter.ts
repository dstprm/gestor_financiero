import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { Employee, ScenarioDiff } from '@/types';

export function exportToCSV(employees: Employee[], filename = 'org-chart.csv') {
  const rows = employees.map((e) => ({
    'Employee ID': e.id,
    Name: e.name,
    Title: e.title,
    'Manager ID': e.managerId ?? '',
    Department: e.department,
    Level: e.level,
    Location: e.location,
    Status: e.status,
    Email: e.email ?? '',
    Flags: e.flags.join(', '),
    Notes: e.notes,
    ...e.metadata,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
}

export function exportToExcel(employees: Employee[], filename = 'org-chart.xlsx') {
  const rows = employees.map((e) => ({
    'Employee ID': e.id,
    Name: e.name,
    Title: e.title,
    'Manager ID': e.managerId ?? '',
    Department: e.department,
    Level: e.level,
    Location: e.location,
    Status: e.status,
    Email: e.email ?? '',
    Flags: e.flags.join(', '),
    Notes: e.notes,
    ...e.metadata,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Org Chart');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
}

export function exportChangeLogCSV(
  diff: ScenarioDiff,
  baselineName: string,
  targetName: string,
  filename = 'change-log.csv'
) {
  const rows: Record<string, string>[] = [];

  for (const e of diff.added) {
    rows.push({ Change: 'Added', ID: e.id, Name: e.name, Title: e.title, 'New Manager': e.managerId ?? '(none)', Note: '' });
  }
  for (const e of diff.removed) {
    rows.push({ Change: 'Removed', ID: e.id, Name: e.name, Title: e.title, 'New Manager': '', Note: '' });
  }
  for (const { employee, oldManagerId, newManagerId } of diff.moved) {
    rows.push({
      Change: 'Moved',
      ID: employee.id,
      Name: employee.name,
      Title: employee.title,
      'Old Manager': oldManagerId ?? '(none)',
      'New Manager': newManagerId ?? '(none)',
      Note: '',
    });
  }
  for (const { before, after, changedFields } of diff.modified) {
    rows.push({
      Change: 'Modified',
      ID: after.id,
      Name: after.name,
      Title: after.title,
      'Changed Fields': changedFields.join(', '),
      Note: changedFields.map((f) => `${f}: ${String((before as unknown as Record<string,unknown>)[f])} → ${String((after as unknown as Record<string,unknown>)[f])}`).join('; '),
    });
  }

  const header = `Change Log: ${baselineName} → ${targetName}\n\n`;
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = header + XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
}

const HTML_TO_IMAGE_OPTS = {
  backgroundColor: '#0f172a',
  // Skip font fetches to avoid hanging on Next.js-served font CSS
  skipFonts: true,
  cacheBust: false,
  // Filter out React Flow controls / minimap from the capture
  filter: (node: HTMLElement) => {
    const cls = (node as HTMLElement).className ?? '';
    if (typeof cls !== 'string') return true;
    return (
      !cls.includes('react-flow__controls') &&
      !cls.includes('react-flow__minimap') &&
      !cls.includes('react-flow__attribution') &&
      !cls.includes('react-flow__panel')
    );
  },
};

export async function exportChartAsPNG(elementId: string, filename = 'org-chart.png') {
  const { toPng } = await import('html-to-image');
  const el = document.getElementById(elementId);
  if (!el) return;
  try {
    // First call warms up font loading; second call captures reliably
    await toPng(el, HTML_TO_IMAGE_OPTS);
    const dataUrl = await toPng(el, HTML_TO_IMAGE_OPTS);
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    saveAs(blob, filename);
  } catch (err) {
    console.error('[SimplyOrg] PNG export failed:', err);
  }
}

export async function exportChartAsSVG(elementId: string, filename = 'org-chart.svg') {
  const { toSvg } = await import('html-to-image');
  const el = document.getElementById(elementId);
  if (!el) return;
  try {
    const dataUrl = await toSvg(el, HTML_TO_IMAGE_OPTS);
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    saveAs(blob, filename);
  } catch (err) {
    console.error('[SimplyOrg] SVG export failed:', err);
  }
}
