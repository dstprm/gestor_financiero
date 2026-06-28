'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import type { Entidad, Transaccion } from '@/lib/gestor-types'
import { IVA, fmt } from '@/lib/gestor-constants'

interface Props {
  entidades: Entidad[]
  metodosPago: string[]
  catsEmpresa: string[]
  catsPersonal: string[]
  editTx?: Transaccion | null
  defaultEntidadId?: string
  onAdd: (tx: Omit<Transaccion, 'id'>) => Promise<Transaccion>
  onUpdate: (id: string, entidadId: string, patch: Partial<Transaccion>) => Promise<void>
  onAfterSave: (entidadId: string) => void
  onCancelEdit?: () => void
}

const today = () => new Date().toISOString().split('T')[0]

export default function AgregarTx({
  entidades, metodosPago, catsEmpresa, catsPersonal,
  editTx, defaultEntidadId, onAdd, onUpdate, onAfterSave, onCancelEdit,
}: Props) {
  const isEditing = !!editTx

  const [entidadId, setEntidadId] = useState(editTx?.entidadId ?? defaultEntidadId ?? entidades[0]?.id ?? '')
  const [tipo, setTipo]           = useState<'INGRESO' | 'GASTO'>(editTx?.tipo ?? 'INGRESO')
  const [desc, setDesc]           = useState(editTx?.desc ?? '')
  const [cat, setCat]             = useState(editTx?.cat ?? '')
  const [tipoDoc, setTipoDoc]     = useState(editTx?.tipoDoc ?? 'sin-doc')
  const [nroDoc, setNroDoc]       = useState(editTx?.nroDoc ?? '')
  const [metodoPago, setMetodoPago] = useState(editTx?.metodoPago ?? metodosPago[0] ?? '')
  const [pagado, setPagado]       = useState(editTx?.pagado ?? false)
  const [monto, setMonto]         = useState(editTx ? String(editTx.monto) : '')
  const [fecha, setFecha]         = useState(editTx?.fecha ?? today())
  const [saving, setSaving]       = useState(false)

  const entidad    = entidades.find(e => e.id === entidadId)
  const esEmpresa  = entidad?.tipo === 'EMPRESA'
  const cats       = esEmpresa ? catsEmpresa : catsPersonal

  // Re-sync form when editTx changes
  useEffect(() => {
    if (editTx) {
      setEntidadId(editTx.entidadId)
      setTipo(editTx.tipo)
      setDesc(editTx.desc)
      setCat(editTx.cat)
      setTipoDoc(editTx.tipoDoc)
      setNroDoc(editTx.nroDoc ?? '')
      setMetodoPago(editTx.metodoPago ?? metodosPago[0] ?? '')
      setPagado(editTx.pagado ?? false)
      setMonto(String(editTx.monto))
      setFecha(editTx.fecha)
    }
  }, [editTx])

  // Reset cat when entity/tipo changes (only when not editing)
  useEffect(() => {
    if (!editTx) setCat(tipo === 'GASTO' ? (cats[0] ?? '') : 'Ingreso')
  }, [entidadId, tipo])

  const montoNum = parseFloat(monto) || 0
  const showIvaPreview = tipoDoc === 'factura' && montoNum > 0
  const neto   = montoNum / (1 + IVA)
  const ivaAmt = montoNum - neto

  async function handleSubmit() {
    if (!desc.trim() || !monto || !fecha) {
      toast.error('Completa descripción, monto y fecha.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        entidadId,
        tipo,
        desc:       desc.trim(),
        cat:        tipo === 'GASTO' ? cat : 'Ingreso',
        monto:      montoNum,
        fecha,
        tipoDoc,
        nroDoc:     nroDoc.trim() || null,
        metodoPago: tipo === 'GASTO' ? metodoPago : null,
        pagado:     tipo === 'INGRESO' && esEmpresa ? pagado : null,
      }

      if (isEditing && editTx) {
        await onUpdate(editTx.id, editTx.entidadId, payload)
        toast.success('Transacción actualizada')
      } else {
        await onAdd(payload)
        toast.success('¡Transacción guardada!')
        // Reset form for next entry
        setDesc(''); setMonto(''); setNroDoc(''); setPagado(false)
        setFecha(today()); setTipoDoc('sin-doc')
      }

      onAfterSave(entidadId)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="gf-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <SectionLabel>{isEditing ? 'Editar transacción' : 'Nueva transacción'}</SectionLabel>
          {isEditing && onCancelEdit && (
            <button onClick={onCancelEdit} style={{ fontSize: 12, color: 'var(--gf-text3)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Cancelar
            </button>
          )}
        </div>

        <FieldSection>Entidad y tipo</FieldSection>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Entidad">
            <select className="gf-input" value={entidadId} onChange={e => setEntidadId(e.target.value)} disabled={isEditing}>
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
            📋 <strong>Factura:</strong> El IVA (19%) se calculará automáticamente sobre el monto ingresado.
          </div>
        )}

        {tipo === 'GASTO' && (
          <Field label="Método de pago">
            <select className="gf-input" value={metodoPago} onChange={e => setMetodoPago(e.target.value)}>
              {metodosPago.map(m => <option key={m} value={m}>{m}</option>)}
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
          {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar transacción'}
        </button>
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
  return <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gf-text3)', textTransform: 'uppercase', letterSpacing: '.4px' }}>{children}</div>
}
