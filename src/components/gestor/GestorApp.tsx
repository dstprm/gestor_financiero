'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { Entidad, Transaccion } from '@/lib/gestor-types'
import { getAvailableMonths, getMesLabel } from '@/lib/gestor-constants'
import EntityDashboard from './EntityDashboard'
import ResumenView from './ResumenView'
import AgregarTx from './AgregarTx'
import ConfigView from './ConfigView'

interface Config {
  metodosPago:  string[]
  catsEmpresa:  string[]
  catsPersonal: string[]
}

const DEFAULT_CONFIG: Config = { metodosPago: [], catsEmpresa: [], catsPersonal: [] }

export default function GestorApp() {
  const [entidades, setEntidades]     = useState<Entidad[]>([])
  const [txByEntity, setTxByEntity]   = useState<Record<string, Transaccion[]>>({})
  const [loadedTabs, setLoadedTabs]   = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab]     = useState<string>('__resumen__')
  const [periodo, setPeriodo]         = useState<string>(() => getAvailableMonths()[0])
  const [config, setConfig]           = useState<Config>(DEFAULT_CONFIG)
  const [editingTx, setEditingTx]     = useState<Transaccion | null>(null)
  const [loading, setLoading]         = useState(true)
  const [seeding, setSeeding]         = useState(false)
  const [dark, setDark]               = useState(false)
  const months = getAvailableMonths()

  // Dark mode observer
  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains('dark'))
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Bootstrap: load entities + config in parallel
  useEffect(() => {
    Promise.all([
      fetch('/api/entidades').then(r => r.json()),
      fetch('/api/configuracion').then(r => r.json()),
    ]).then(([ents, cfg]) => {
      setEntidades(ents)
      setConfig(cfg)
      // Default tab stays __resumen__
    }).finally(() => setLoading(false))
  }, [])

  const loadEntityTx = useCallback(async (entidadId: string) => {
    if (loadedTabs.has(entidadId)) return
    const r = await fetch(`/api/transacciones?entidadId=${entidadId}`)
    const data: Transaccion[] = await r.json()
    setTxByEntity(prev => ({ ...prev, [entidadId]: data }))
    setLoadedTabs(prev => new Set(prev).add(entidadId))
  }, [loadedTabs])

  const loadAllTx = useCallback(async () => {
    if (loadedTabs.has('__all__')) return
    const r = await fetch('/api/transacciones')
    const data: Transaccion[] = await r.json()
    const byEntity: Record<string, Transaccion[]> = {}
    data.forEach(tx => {
      if (!byEntity[tx.entidadId]) byEntity[tx.entidadId] = []
      byEntity[tx.entidadId].push(tx)
    })
    setTxByEntity(byEntity)
    setLoadedTabs(prev => new Set(prev).add('__all__'))
  }, [loadedTabs])

  useEffect(() => {
    if (!activeTab) return
    if (activeTab === '__resumen__') loadAllTx()
    else if (activeTab !== '__agregar__' && activeTab !== '__config__') loadEntityTx(activeTab)
    // Clear editingTx when navigating away from agregar
    if (activeTab !== '__agregar__') setEditingTx(null)
  }, [activeTab])

  // ── Transaction handlers ──────────────────────────────────────────────────

  const addTransaction = async (tx: Omit<Transaccion, 'id'>): Promise<Transaccion> => {
    const r = await fetch('/api/transacciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx),
    })
    const newTx: Transaccion = await r.json()
    setTxByEntity(prev => ({
      ...prev,
      [tx.entidadId]: [...(prev[tx.entidadId] ?? []), newTx],
    }))
    setLoadedTabs(prev => { const s = new Set(prev); s.delete('__all__'); return s })
    return newTx
  }

  const updateTransaction = async (id: string, entidadId: string, patch: Partial<Transaccion>) => {
    const r = await fetch(`/api/transacciones/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const updated: Transaccion = await r.json()
    setTxByEntity(prev => ({
      ...prev,
      [entidadId]: (prev[entidadId] ?? []).map(t => t.id === id ? updated : t),
    }))
    setLoadedTabs(prev => { const s = new Set(prev); s.delete('__all__'); return s })
  }

  const togglePagado = async (id: string, entidadId: string) => {
    const tx = txByEntity[entidadId]?.find(t => t.id === id)
    if (!tx) return
    await updateTransaction(id, entidadId, { pagado: !tx.pagado })
  }

  const deleteTransaction = async (id: string, entidadId: string) => {
    await fetch(`/api/transacciones/${id}`, { method: 'DELETE' })
    setTxByEntity(prev => ({
      ...prev,
      [entidadId]: (prev[entidadId] ?? []).filter(t => t.id !== id),
    }))
    setLoadedTabs(prev => { const s = new Set(prev); s.delete('__all__'); return s })
    toast.success('Transacción eliminada')
  }

  // Edit flow: open agregar tab pre-filled
  const startEdit = (tx: Transaccion) => {
    setEditingTx(tx)
    setActiveTab('__agregar__')
  }

  const cancelEdit = () => {
    setEditingTx(null)
    setActiveTab('__resumen__')
  }

  // After save: return to the entity's tab (or resumen if editing)
  const handleAfterSave = (entidadId: string) => {
    setEditingTx(null)
    setActiveTab(entidadId)
  }

  // ── Entity handlers ───────────────────────────────────────────────────────

  const addEntidad = async (nombre: string, tipo: 'PERSONAL' | 'EMPRESA', color: string) => {
    const r = await fetch('/api/entidades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, tipo, color, orden: entidades.length }),
    })
    const newE: Entidad = await r.json()
    setEntidades(prev => [...prev, newE])
  }

  const deleteEntidad = async (id: string) => {
    await fetch(`/api/entidades/${id}`, { method: 'DELETE' })
    setEntidades(prev => prev.filter(e => e.id !== id))
    setTxByEntity(prev => { const n = { ...prev }; delete n[id]; return n })
    setLoadedTabs(prev => { const s = new Set(prev); s.delete(id); s.delete('__all__'); return s })
    if (activeTab === id) setActiveTab('__resumen__')
  }

  // ── Config handler ────────────────────────────────────────────────────────

  const updateConfig = async (clave: string, valor: string[]) => {
    await fetch('/api/configuracion', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clave, valor }),
    })
    setConfig(prev => ({
      ...prev,
      metodosPago:  clave === 'metodos_pago'  ? valor : prev.metodosPago,
      catsEmpresa:  clave === 'cats_empresa'  ? valor : prev.catsEmpresa,
      catsPersonal: clave === 'cats_personal' ? valor : prev.catsPersonal,
    }))
  }

  // ── Seed ─────────────────────────────────────────────────────────────────

  const handleSeed = async () => {
    setSeeding(true)
    try {
      await fetch('/api/seed', { method: 'POST' })
      const [ents, cfg] = await Promise.all([
        fetch('/api/entidades').then(r => r.json()),
        fetch('/api/configuracion').then(r => r.json()),
      ])
      setEntidades(ents); setConfig(cfg)
      setTxByEntity({}); setLoadedTabs(new Set())
    } finally {
      setSeeding(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--gf-text3)', fontSize: 14 }}>Cargando...</div>
  }

  if (entidades.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
        <div style={{ fontSize: 14, color: 'var(--gf-text3)' }}>No hay entidades configuradas.</div>
        <button onClick={handleSeed} disabled={seeding} style={{ background: 'var(--gf-accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          {seeding ? 'Inicializando...' : 'Inicializar con datos de ejemplo'}
        </button>
      </div>
    )
  }

  const activeEntidad = entidades.find(e => e.id === activeTab)
  const showEntityDash = !!activeEntidad && activeTab !== '__agregar__' && activeTab !== '__resumen__' && activeTab !== '__config__'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--gf-bg)' }}>
      {/* Header */}
      <header className="no-print" style={{ background: 'var(--gf-surface)', borderBottom: '.5px solid var(--gf-border)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: 'var(--gf-accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gf-text)' }}>Gestor Financiero</h1>
        </div>
        <select
          value={periodo}
          onChange={e => setPeriodo(e.target.value)}
          style={{ height: 32, borderRadius: 8, border: '.5px solid var(--gf-border-s)', background: 'var(--gf-surface2)', color: 'var(--gf-text)', padding: '0 8px', fontSize: 13, cursor: 'pointer' }}
        >
          {months.map(m => <option key={m} value={m}>{getMesLabel(m)}</option>)}
        </select>
      </header>

      {/* Tab bar */}
      <nav className="no-print" style={{ background: 'var(--gf-surface)', borderBottom: '.5px solid var(--gf-border)', display: 'flex', overflowX: 'auto', padding: '0 12px', gap: 2, scrollbarWidth: 'none' }}>
        <TabBtn active={activeTab === '__resumen__'} onClick={() => setActiveTab('__resumen__')}>📊 Resumen</TabBtn>
        {entidades.map(e => (
          <TabBtn key={e.id} active={activeTab === e.id} onClick={() => setActiveTab(e.id)}>
            {e.tipo === 'PERSONAL' ? '👤' : '🏢'} {e.nombre}
          </TabBtn>
        ))}
        <TabBtn active={activeTab === '__agregar__'} onClick={() => { setEditingTx(null); setActiveTab('__agregar__') }} accent>
          {editingTx ? '✎ Editar' : '＋ Agregar'}
        </TabBtn>
        <TabBtn active={activeTab === '__config__'} onClick={() => setActiveTab('__config__')}>⚙️</TabBtn>
      </nav>

      {/* Content */}
      <main style={{ padding: 16, flex: 1, maxWidth: 960, width: '100%', margin: '0 auto' }}>
        {activeTab === '__resumen__' && (
          <ResumenView entidades={entidades} txByEntity={txByEntity} dark={dark} />
        )}
        {activeTab === '__agregar__' && (
          <AgregarTx
            entidades={entidades}
            metodosPago={config.metodosPago}
            catsEmpresa={config.catsEmpresa}
            catsPersonal={config.catsPersonal}
            editTx={editingTx}
            onAdd={addTransaction}
            onUpdate={updateTransaction}
            onAfterSave={handleAfterSave}
            onCancelEdit={cancelEdit}
          />
        )}
        {activeTab === '__config__' && (
          <ConfigView
            entidades={entidades}
            config={config}
            onAddEntidad={addEntidad}
            onDeleteEntidad={deleteEntidad}
            onUpdateConfig={updateConfig}
          />
        )}
        {showEntityDash && (
          <EntityDashboard
            entidad={activeEntidad}
            transactions={txByEntity[activeTab] ?? []}
            periodo={periodo}
            dark={dark}
            onTogglePagado={togglePagado}
            onDelete={deleteTransaction}
            onEdit={startEdit}
          />
        )}
      </main>
    </div>
  )
}

function TabBtn({ children, active, onClick, accent }: { children: React.ReactNode; active: boolean; onClick: () => void; accent?: boolean }) {
  return (
    <button onClick={onClick} style={{ padding: '10px 11px', fontSize: 13, cursor: 'pointer', border: 'none', background: 'transparent', color: active ? 'var(--gf-accent)' : accent ? 'var(--gf-accent)' : 'var(--gf-text3)', whiteSpace: 'nowrap', borderBottom: active ? '2px solid var(--gf-accent)' : '2px solid transparent', fontWeight: 500, marginLeft: accent ? 'auto' : undefined, transition: 'color .15s, border-color .15s' }}>
      {children}
    </button>
  )
}
