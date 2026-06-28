'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import type { Entidad, Transaccion } from '@/lib/gestor-types'
import { getAvailableMonths, getMesLabel } from '@/lib/gestor-constants'
import EntityDashboard from './EntityDashboard'
import ResumenView from './ResumenView'
import AgregarTx from './AgregarTx'

export default function GestorApp() {
  const [entidades, setEntidades] = useState<Entidad[]>([])
  const [txByEntity, setTxByEntity] = useState<Record<string, Transaccion[]>>({})
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<string>('__resumen__')
  const [periodo, setPeriodo] = useState<string>(() => getAvailableMonths()[0])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [dark, setDark] = useState(false)
  const months = getAvailableMonths()

  // Track dark mode
  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains('dark'))
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Load entities on mount
  useEffect(() => {
    fetch('/api/entidades')
      .then(r => r.json())
      .then((data: Entidad[]) => {
        setEntidades(data)
        if (data.length > 0) setActiveTab(data[0].id)
      })
      .finally(() => setLoading(false))
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

  // Load transactions when tab changes
  useEffect(() => {
    if (!activeTab) return
    if (activeTab === '__resumen__') loadAllTx()
    else if (activeTab !== '__agregar__') loadEntityTx(activeTab)
  }, [activeTab])

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
    // Invalidate the all-entities cache so resumen refreshes
    setLoadedTabs(prev => { const s = new Set(prev); s.delete('__all__'); return s })
    return newTx
  }

  const togglePagado = async (id: string, entidadId: string) => {
    const tx = txByEntity[entidadId]?.find(t => t.id === id)
    if (!tx) return
    const r = await fetch(`/api/transacciones/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagado: !tx.pagado }),
    })
    const updated: Transaccion = await r.json()
    setTxByEntity(prev => ({
      ...prev,
      [entidadId]: (prev[entidadId] ?? []).map(t => t.id === id ? updated : t),
    }))
  }

  const deleteTransaction = async (id: string, entidadId: string) => {
    await fetch(`/api/transacciones/${id}`, { method: 'DELETE' })
    setTxByEntity(prev => ({
      ...prev,
      [entidadId]: (prev[entidadId] ?? []).filter(t => t.id !== id),
    }))
    toast.success('Transacción eliminada')
  }

  const handleSeed = async () => {
    setSeeding(true)
    try {
      await fetch('/api/seed', { method: 'POST' })
      const r = await fetch('/api/entidades')
      const data: Entidad[] = await r.json()
      setEntidades(data)
      setTxByEntity({})
      setLoadedTabs(new Set())
      if (data.length > 0) setActiveTab(data[0].id)
    } finally {
      setSeeding(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--gf-text3)', fontSize: 14 }}>
        Cargando...
      </div>
    )
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
          {months.map(m => (
            <option key={m} value={m}>{getMesLabel(m)}</option>
          ))}
        </select>
      </header>

      {/* Tab bar */}
      <nav className="no-print" style={{ background: 'var(--gf-surface)', borderBottom: '.5px solid var(--gf-border)', display: 'flex', overflowX: 'auto', padding: '0 12px', gap: 2, scrollbarWidth: 'none' }}>
        {entidades.map(e => (
          <TabButton key={e.id} active={activeTab === e.id} onClick={() => setActiveTab(e.id)}>
            {e.tipo === 'PERSONAL' ? '👤' : '🏢'} {e.nombre}
          </TabButton>
        ))}
        <TabButton active={activeTab === '__resumen__'} onClick={() => setActiveTab('__resumen__')}>
          📊 Resumen
        </TabButton>
        <TabButton active={activeTab === '__agregar__'} onClick={() => setActiveTab('__agregar__')} accent>
          ＋ Agregar
        </TabButton>
      </nav>

      {/* Content */}
      <main style={{ padding: 16, flex: 1, maxWidth: 960, width: '100%', margin: '0 auto' }}>
        {activeTab === '__resumen__' && (
          <ResumenView entidades={entidades} txByEntity={txByEntity} dark={dark} />
        )}
        {activeTab === '__agregar__' && (
          <AgregarTx entidades={entidades} onAdd={addTransaction} />
        )}
        {activeEntidad && (
          <EntityDashboard
            entidad={activeEntidad}
            transactions={txByEntity[activeTab] ?? []}
            periodo={periodo}
            dark={dark}
            onTogglePagado={togglePagado}
            onDelete={deleteTransaction}
          />
        )}
      </main>
    </div>
  )
}

function TabButton({ children, active, onClick, accent }: { children: React.ReactNode; active: boolean; onClick: () => void; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 11px',
        fontSize: 13,
        cursor: 'pointer',
        border: 'none',
        background: 'transparent',
        color: active ? 'var(--gf-accent)' : accent ? 'var(--gf-accent)' : 'var(--gf-text3)',
        whiteSpace: 'nowrap',
        borderBottom: active ? '2px solid var(--gf-accent)' : '2px solid transparent',
        fontWeight: 500,
        marginLeft: accent ? 'auto' : undefined,
        transition: 'color .15s, border-color .15s',
      }}
    >
      {children}
    </button>
  )
}
