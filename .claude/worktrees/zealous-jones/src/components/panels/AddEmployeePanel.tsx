'use client';
import { useState } from 'react';
import { useOrgStore } from '@/store/orgStore';
import { selectEmployees } from '@/store/selectors';
import { STATUS_META, getDeptColor, type EmployeeStatus } from '@/types';
import { generateId } from '@/lib/utils';
import { X } from 'lucide-react';

const STATUSES: EmployeeStatus[] = ['active', 'vacant', 'contractor', 'on-leave', 'proposed'];

export function AddEmployeePanel() {
  const { addEmployee, setSelectedNode, setRightPanelMode } = useOrgStore();
  const employees = useOrgStore(selectEmployees);

  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<EmployeeStatus>('active');
  const [managerId, setManagerId] = useState<string>('');
  const [error, setError] = useState('');

  function handleAdd() {
    if (!name.trim()) { setError('Name is required'); return; }
    if (!title.trim()) { setError('Title is required'); return; }
    if (!department.trim()) { setError('Department is required'); return; }
    setError('');

    const id = generateId();
    addEmployee({
      id,
      name: name.trim(),
      title: title.trim(),
      department: department.trim(),
      level: level.trim(),
      location: location.trim(),
      email: email.trim() || undefined,
      status,
      managerId: managerId || null,
    });

    // Select the new node
    setSelectedNode(id);
    setRightPanelMode('editor');
  }

  const deptColor = department ? getDeptColor(department) : '#6b7280';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: deptColor }} />
          <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">New Employee</span>
        </div>
        <button
          onClick={() => setRightPanelMode(null)}
          className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Field label="Full Name *">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="Jane Smith"
          />
        </Field>

        <Field label="Job Title *">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder="Senior Engineer"
          />
        </Field>

        <Field label="Department *">
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="input-field"
            placeholder="Engineering"
          />
        </Field>

        <Field label="Status">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
            className="input-field"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
        </Field>

        <Field label="Reports To">
          <select
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            className="input-field"
          >
            <option value="">(No manager — root node)</option>
            {employees.map((m) => (
              <option key={m.id} value={m.id}>{m.name} — {m.title}</option>
            ))}
          </select>
        </Field>

        <Field label="Level / Grade">
          <input
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="input-field"
            placeholder="L4"
          />
        </Field>

        <Field label="Location">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="input-field"
            placeholder="San Francisco, CA"
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="jane@company.com"
          />
        </Field>
      </div>

      <div className="border-t border-gray-200 dark:border-slate-700 p-3 flex gap-2">
        <button
          onClick={() => setRightPanelMode(null)}
          className="flex-1 px-3 py-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
        >
          Cancel
        </button>
        <button
          onClick={handleAdd}
          className="flex-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium"
        >
          Add Employee
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-500 dark:text-slate-500 font-medium block mb-1">{label}</label>
      {children}
    </div>
  );
}
