'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import type { Entidad, Transaccion } from '@/lib/gestor-types'
import { CATS_EMPRESA, CATS_PERSONAL, METODOS_PAGO, PAGO_COLORS, IVA, fmt, getCats } from '@/lib/gestor-constants'

interface Props {
  entidades: Entidad[]
  onAdd: (tx: Omit<Transaccion, 'id'>) => Promise<Transaccion>
}

const today = () => new Date().toISOString().split('T')[0]

export default function AgregarTx({ entidades, onAdd }: Props) {
  const [entidadId, setEntidadId] = useState(entidades[0]?.id ?? '')
  const [tipo, setTipo] = useState<'INGRESO' | 'GASTO'>('INGRESO')
  const [desc, setDesc] = useState('')
  const [cat, setCat] = useState('')
  const [tipoDoc, setTipoDoc] = useState('sin-doc')
  const [nroDoc, setNroDoc] = useState('')
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO[0])
  const [pagado, setPagado] = useState(false)
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(today())
  const [saving, setSaving] = useState(false)

  const entidad = entidades.find(e => e.id === entidadId)
  const esEmpresa = entidad?.tipo === 'EMPRESA'
  const cats = getCats(entidad?.tipo ?? 'PERSONAL')

  // Reset cat when entity/tipo changes
  useEffect(() => {
    setCat(tipo === 'GASTO' ? (cats[0] ?? '') : 'Ingreso')
  }, [entidadId, tipo])

  const montoNum = parseFloat(monto) || 0
  const showIvaPreview = tipoDoc === 'factura' && montoNum > 0
  const neto = montoNum / (1 + IVA)
  const ivaAmt = montoNum - neto

  async function handleSubmit() {
    if (!desc.trim() || !monto || !fecha) {
      toast.error('Completa descripción, monto y fecha.')
      return
    }
    setSaving(true)
    try {
      await onAdd({
        entidadId,
        tipo,
        desc: desc.trim(),
        cat: tipo === 'GASTO' ? cat : 'Ingreso',
        monto: montoNum,
        fecha,
        tipoDoc,
        nroDoc: nroDoc.trim() || null,
        metodoPago: tipo === 'GASTO' ? metodoPago : null,
        pagado: tipo === 'INGRESO' && esEmpresa ? pagado : null,
      })
      toast.success('¡Transacción guardada!')
      setDesc('')
      setMonto('')
      setNroDoc('')
      setPagado(false)
      setFecha(today())
      setTipoDoc('sin-doc')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="gf-card">
        <SectionLabel>Nueva transacción</SectionLabel>

        <FieldSection>Entidad y tipo</FieldSection>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Entidad">
            <select className="gf-input" value={entidadId} onChange={e => setEntidadId(e.target.value)}>
              {entidades.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </Field>
          <Field label="Tipo">
            <select className="gf-input" value={tipo} onChange={e => setTipo(e.target.value as 'INGRESO' | 'GASTO')}>
              <option value="INGRESO">Ingreso</option>
              <option value="GASTO">Gasto</option>
            </select>
          </Field>
        </div>

        <FieldSection>Detalle</FieldSection>
        <Field label="Descripción">
          <input className="gf-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ej: Pago proveedor telas" />
        </Field>

        {tipo === 'GASTO' && (
          <Field label="Categoría de gasto">
            <select className="gf-input" value={cat} onChange={e => setCat(e.target.value)}>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        )}

        <FieldSection>Documento</FieldSection>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Tipo documento">
            <select className="gf-input" value={tipoDoc} onChange={e => setTipoDoc(e.target.value)}>
              <option value="sin-doc">Sin documento</option>
              <option value="boleta">Boleta</option>
              <option value="factura">Factura</option>
            </select>
          </Field>
          <Field label="N° documento">
            <input className="gf-input" value={nroDoc} onChange={e => setNroDoc(e.target.value)} placeholder="Ej: F-0023" />
          </Field>
        </div>

        {tipoDoc === 'factura' && tipo === 'GASTO' && (
          <div style={{ background: 'var(--gf-purple-bg)', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 12, color: 'var(--gf-purple-t)' }}>
            📋 <strong>Factura:</strong> El IVA (19%) se calculará automáticamente sobre el monto ingresado (precio con IVA incluido).
          </div>
        )}

        {tipo === 'GASTO' && (
          <Field label="Método de pago">
            <select className="gf-input" value={metodoPago} onChange={e => setMetodoPago(e.target.value)}>
              {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
        )}

        {tipo === 'INGRESO' && esEmpresa && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
            <input type="checkbox" id="pagado" checked={pagado} onChange={e => setPagado(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--gf-accent)', cursor: 'pointer' }} />
            <label htmlFor="pagado" style={{ fontSize: 14, cursor: 'pointer', color: 'var(--gf-text)' }}>Ya fue pagado</label>
          </div>
        )}

        <FieldSection>Monto y fecha</FieldSection>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Monto total $ (con IVA si aplica)">
            <input className="gf-input" type="number" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0" inputMode="numeric" />
          </Field>
          <Field label="Fecha">
            <input className="gf-input" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </Field>
        </div>

        {showIvaPreview && (
          <div style={{ background: 'var(--gf-surface2)', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 12, color: 'var(--gf-text)' }}>
            <strong>Desglose IVA:</strong> Neto: <strong>{fmt(neto)}</strong> + IVA 19%: <strong>{fmt(ivaAmt)}</strong> = Total: <strong>{fmt(montoNum)}</strong>
          </div>
        )}

        <button onClick={handleSubmit} disabled={saving} style={{ background: 'var(--gf-accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%', marginTop: 4, opacity: saving ? .7 : 1 }}>
          {saving ? 'Guardando...' : 'Guardar transacción'}
        </button>
      </div>

      {/* Payment methods reference */}
      <div className="gf-card">
        <SectionLabel>Métodos de pago disponibles</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {METODOS_PAGO.map(m => (
            <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', background: 'var(--gf-surface2)', borderRadius: 8, fontSize: 12, fontWeight: 500, color: 'var(--gf-text)' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: PAGO_COLORS[m] ?? '#888', flexShrink: 0 }} />
              {m}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gf-text2)' }}>{label}</label>
      {children}
    </div>
  )
}

function FieldSection({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--gf-text3)', margin: '14px 0 8px' }}>{children}</div>
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gf-text3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.4px' }}>{children}</div>
}
