'use client';
import { useState } from 'react';
import { useOrgStore } from '@/store/orgStore';
import { selectEmployees } from '@/store/selectors';
import { generateId } from '@/lib/utils';
import { STATUS_META, type EmployeeStatus } from '@/types';
import { X } from 'lucide-react';

const STATUSES: EmployeeStatus[] = ['active', 'vacant', 'contractor', 'on-leave', 'proposed'];

interface AddPersonModalProps {
  onClose: () => void;
}

export function AddPersonModal({ onClose }: AddPersonModalProps) {
  const { addEmployee } = useOrgStore();
  const employees = useOrgStore(selectEmployees);

  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [managerId, setManagerId] = useState('');
  const [status, setStatus] = useState<EmployeeStatus>('active');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const allDepts = [...new Set(employees.map((e) => e.department))].sort();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setError('');
    addEmployee({
      id: generateId(),
      name: name.trim(),
      title: title.trim(),
      department: department.trim(),
      level: '',
      location: '',
      email: email.trim() || undefined,
      status,
      managerId: managerId || null,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Add Person</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 p-1"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Field label="Name *">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Jane Smith"
            />
          </Field>

          <Field label="Title / Role">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="Senior Engineer"
            />
          </Field>

          <Field label="Department">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="input-field"
            >
              <option value="">— select department —</option>
              {allDepts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </Field>

          <Field label="Manager">
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

          <Field label="Employment Status">
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

          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="jane@company.com"
            />
          </Field>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Add Person
            </button>
          </div>
        </form>
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
