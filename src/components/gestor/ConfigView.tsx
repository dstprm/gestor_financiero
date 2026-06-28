'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { Entidad } from '@/lib/gestor-types'

const PRESET_COLORS = ['#2a78d6','#1baf7a','#eda100','#4a3aa7','#e34948','#e87ba4','#eb6834','#008300','#73726c','#5dcaa5','#0ea5e9','#f43f5e']

interface Config {
  metodosPago:  string[]
  catsEmpresa:  string[]
  catsPersonal: string[]
}

interface Props {
  entidades:        Entidad[]
  config:           Config
  onAddEntidad:     (nombre: string, tipo: 'PERSONAL' | 'EMPRESA', color: string) => Promise<void>
  onDeleteEntidad:  (id: string) => Promise<void>
  onUpdateConfig:   (clave: string, valor: string[]) => Promise<void>
}

export default function ConfigView({ entidades, config, onAddEntidad, onDeleteEntidad, onUpdateConfig }: Props) {
  return (
    <div style={{ maxWidth: 640 }}>
      <EntidadesSection entidades={entidades} onAdd={onAddEntidad} onDelete={onDeleteEntidad} />
      <ListConfigSection
        title="Métodos de pago"
        hint="Disponibles al registrar un gasto"
        items={config.metodosPago}
        onSave={items => onUpdateConfig('metodos_pago', items)}
      />
      <ListConfigSection
        title="Categorías — Empresa"
        hint="Categorías de gastos para entidades de tipo Empresa"
        items={config.catsEmpresa}
        onSave={items => onUpdateConfig('cats_empresa', items)}
      />
      <ListConfigSection
        title="Categorías — Personal"
        hint="Categorías de gastos para entidades personales"
        items={config.catsPersonal}
        onSave={items => onUpdateConfig('cats_personal', items)}
      />
    </div>
  )
}

// ── Entities section ──────────────────────────────────────────────────────────

function EntidadesSection({ entidades, onAdd, onDelete }: {
  entidades: Entidad[]
  onAdd: (nombre: string, tipo: 'PERSONAL' | 'EMPRESA', color: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [nombre, setNombre]   = useState('')
  const [tipo, setTipo]       = useState<'PERSONAL' | 'EMPRESA'>('EMPRESA')
  const [color, setColor]     = useState(PRESET_COLORS[0])
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleAdd() {
    if (!nombre.trim()) { toast.error('Ingresa un nombre'); return }
    setSaving(true)
    try {
      await onAdd(nombre.trim(), tipo, color)
      setNombre('')
      toast.success('Entidad creada')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, nombre: string) {
    if (!confirm(`¿Eliminar "${nombre}" y TODAS sus transacciones? Esta acción no se puede deshacer.`)) return
    setDeleting(id)
    try {
      await onDelete(id)
      toast.success('Entidad eliminada')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="gf-card">
      <CardTitle>Entidades</CardTitle>

      {/* Existing list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {entidades.map(e => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--gf-surface2)', borderRadius: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: 'var(--gf-text)' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: e.color, flexShrink: 0 }} />
              {e.nombre}
              <span style={{ fontSize: 10, color: 'var(--gf-text3)', fontWeight: 400 }}>{e.tipo}</span>
            </span>
            <button
              onClick={() => handleDelete(e.id, e.nombre)}
              disabled={deleting === e.id || entidades.length <= 1}
              style={{ border: '.5px solid var(--gf-border-s)', background: 'transparent', borderRadius: 5, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: 'var(--gf-red)', opacity: entidades.length <= 1 ? .3 : 1 }}
              title={entidades.length <= 1 ? 'No puedes eliminar la única entidad' : 'Eliminar entidad'}
            >
              {deleting === e.id ? '...' : '✕ Eliminar'}
            </button>
          </div>
        ))}
      </div>

      {/* Add form */}
      <div style={{ borderTop: '.5px solid var(--gf-border)', paddingTop: 12 }}>
        <FieldLabel>Nueva entidad</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--gf-text3)', display: 'block', marginBottom: 4 }}>Nombre</label>
            <input className="gf-input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Mi Empresa" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--gf-text3)', display: 'block', marginBottom: 4 }}>Tipo</label>
            <select className="gf-input" value={tipo} onChange={e => setTipo(e.target.value as 'PERSONAL' | 'EMPRESA')}>
              <option value="EMPRESA">Empresa</option>
              <option value="PERSONAL">Personal</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: 'var(--gf-text3)', display: 'block', marginBottom: 6 }}>Color</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: color === c ? '2px solid var(--gf-text)' : '2px solid transparent', cursor: 'pointer', padding: 0 }} />
            ))}
          </div>
        </div>
        <button onClick={handleAdd} disabled={saving} style={{ background: 'var(--gf-accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? .7 : 1 }}>
          {saving ? 'Creando...' : '+ Agregar entidad'}
        </button>
      </div>
    </div>
  )
}

// ── Generic list config section (métodos/categorías) ─────────────────────────

function ListConfigSection({ title, hint, items, onSave }: {
  title:   string
  hint:    string
  items:   string[]
  onSave:  (items: string[]) => Promise<void>
}) {
  const [list, setList]     = useState<string[]>(items)
  const [newItem, setNewItem] = useState('')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty]   = useState(false)

  function addItem() {
    const val = newItem.trim()
    if (!val || list.includes(val)) { toast.error('Ítem vacío o ya existe'); return }
    const next = [...list, val]
    setList(next); setNewItem(''); setDirty(true)
  }

  function removeItem(item: string) {
    const next = list.filter(i => i !== item)
    setList(next); setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(list)
      setDirty(false)
      toast.success('Guardado')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="gf-card">
      <CardTitle>{title}</CardTitle>
      <p style={{ fontSize: 12, color: 'var(--gf-text3)', marginBottom: 12 }}>{hint}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
        {list.map(item => (
          <div key={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: 'var(--gf-surface2)', borderRadius: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--gf-text)' }}>{item}</span>
            <button onClick={() => removeItem(item)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--gf-text3)', fontSize: 14, padding: '0 4px' }} title="Eliminar">✕</button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: dirty ? 10 : 0 }}>
        <input
          className="gf-input"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          placeholder="Nuevo ítem..."
          onKeyDown={e => e.key === 'Enter' && addItem()}
          style={{ flex: 1 }}
        />
        <button onClick={addItem} style={{ background: 'var(--gf-surface2)', border: '.5px solid var(--gf-border-s)', borderRadius: 8, padding: '0 14px', fontSize: 13, cursor: 'pointer', color: 'var(--gf-text)', whiteSpace: 'nowrap', fontWeight: 500 }}>
          + Agregar
        </button>
      </div>

      {dirty && (
        <button onClick={handleSave} disabled={saving} style={{ background: 'var(--gf-accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%', opacity: saving ? .7 : 1 }}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      )}
    </div>
  )
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gf-text3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.4px' }}>{children}</div>
}
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gf-text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.4px' }}>{children}</div>
}
