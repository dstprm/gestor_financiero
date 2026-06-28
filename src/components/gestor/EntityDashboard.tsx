'use client'

import { useMemo } from 'react'
import type { Entidad, Transaccion } from '@/lib/gestor-types'
import { calcKPIs, calcIVA, txDelMes } from '@/lib/gestor-calc'
import {
  fmt, getMesLabel, getAvailableMonths,
  CAT_COLORS, PAGO_COLORS, getCats,
} from '@/lib/gestor-constants'
import { MonthlyBarChart, DoughnutChart } from './GestorCharts'

interface Props {
  entidad: Entidad
  transactions: Transaccion[]
  periodo: string
  dark: boolean
  onTogglePagado: (id: string, entidadId: string) => void
  onDelete: (id: string, entidadId: string) => void
}

function DocBadge({ tipoDoc, nroDoc }: { tipoDoc: string; nroDoc: string | null }) {
  if (!tipoDoc || tipoDoc === 'sin-doc')
    return <span className="gf-badge" style={{ background: 'var(--gf-surface2)', color: 'var(--gf-text3)', border: '.5px solid var(--gf-border)' }}>Sin doc.</span>
  const label = tipoDoc === 'factura' ? `📄 Factura ${nroDoc ?? ''}` : `🧾 Boleta ${nroDoc ?? ''}`
  const bg = tipoDoc === 'factura' ? 'var(--gf-accent-bg)' : 'var(--gf-green-bg)'
  const color = tipoDoc === 'factura' ? 'var(--gf-accent-t)' : 'var(--gf-green-t)'
  return <span className="gf-badge" style={{ background: bg, color }}>{label}</span>
}

function PagoBadge({ metodoPago }: { metodoPago: string | null }) {
  if (!metodoPago) return null
  return <span className="gf-badge" style={{ background: 'var(--gf-surface2)', color: 'var(--gf-text2)', border: '.5px solid var(--gf-border)' }}>💳 {metodoPago}</span>
}

export default function EntityDashboard({ entidad, transactions, periodo, dark, onTogglePagado, onDelete }: Props) {
  const esEmpresa = entidad.tipo === 'EMPRESA'
  const cats = getCats(entidad.tipo)
  const months = getAvailableMonths()

  const monthsTx = useMemo(() => txDelMes(transactions, periodo), [transactions, periodo])
  const kpis = useMemo(() => calcKPIs(transactions, periodo), [transactions, periodo])
  const iva = useMemo(() => esEmpresa ? calcIVA(transactions, periodo) : null, [transactions, periodo, esEmpresa])

  const ingTx = monthsTx.filter(t => t.tipo === 'INGRESO')
  const gasTx = monthsTx.filter(t => t.tipo === 'GASTO')

  // Category breakdown
  const catData: Record<string, number> = {}
  cats.forEach(c => { catData[c] = 0 })
  gasTx.forEach(t => {
    if (catData[t.cat] !== undefined) catData[t.cat] += t.monto
    else catData['Gastos generales'] = (catData['Gastos generales'] ?? 0) + t.monto
  })
  const activeCats = cats.filter(c => catData[c] > 0)
  const activeCatVals = activeCats.map(c => catData[c])
  const activeCatColors = activeCats.map((_, i) => CAT_COLORS[i % CAT_COLORS.length])

  // Payment method breakdown
  const pagoData: Record<string, number> = {}
  gasTx.forEach(t => {
    if (t.metodoPago) pagoData[t.metodoPago] = (pagoData[t.metodoPago] ?? 0) + t.monto
  })
  const pagoKeys = Object.keys(pagoData)
  const pagoColors = pagoKeys.map(k => PAGO_COLORS[k] ?? '#888')

  // Monthly bar chart data
  const monthlyIng = months.map(m => calcKPIs(transactions, m).ing).reverse()
  const monthlyGas = months.map(m => calcKPIs(transactions, m).gas).reverse()
  const monthLabels = [...months].reverse().map(m => getMesLabel(m).split(' ')[0].slice(0, 3))

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginBottom: 14 }}>
        <KpiCard label="Ingresos" value={fmt(kpis.ing)} colorClass="pos" sub={`${ingTx.length} docs.`} />
        <KpiCard label="Gastos" value={fmt(kpis.gas)} colorClass="neg" sub={`${gasTx.length} movs.`} />
        <KpiCard label="Balance" value={(kpis.bal >= 0 ? '+' : '') + fmt(kpis.bal)} colorClass={kpis.bal >= 0 ? 'pos' : 'neg'} sub="Mes actual" />
        {esEmpresa && (
          <>
            <KpiCard label="Por cobrar" value={fmt(kpis.pend)} colorClass="warn" sub="Sin pagar" />
            {iva && <KpiCard label="IVA a pagar" value={fmt(Math.max(0, iva.diferencia))} colorClass="iva" sub="Estimado" />}
          </>
        )}
      </div>

      {/* IVA Box */}
      {esEmpresa && iva && (
        <div style={{ background: 'var(--gf-purple-bg)', borderRadius: 12, padding: 14, marginBottom: 14, border: '.5px solid var(--gf-purple-t)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gf-purple-t)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.4px' }}>
            📋 IVA del mes — solo facturas (19%)
          </div>
          <IvaRow label="Débito Fiscal (IVA en ventas / facturas emitidas)" value={fmt(iva.ivaDebito)} color="var(--gf-red)" />
          <IvaRow label="Crédito Fiscal (IVA en compras / facturas recibidas)" value={fmt(iva.ivaCredito)} color="var(--gf-green)" />
          <IvaRow
            label={iva.diferencia >= 0 ? 'IVA a pagar al SII' : 'IVA a favor'}
            value={fmt(Math.abs(iva.diferencia))}
            color={iva.diferencia >= 0 ? 'var(--gf-red)' : 'var(--gf-green)'}
            bold
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <div style={{ background: 'var(--gf-surface)', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--gf-text3)', marginBottom: 4 }}>NETO INGRESOS (sin IVA)</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gf-green)' }}>{fmt(iva.netIng)}</div>
              <div style={{ fontSize: 10, color: 'var(--gf-text3)', marginTop: 2 }}>{iva.factIng} facturas emitidas</div>
            </div>
            <div style={{ background: 'var(--gf-surface)', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--gf-text3)', marginBottom: 4 }}>NETO GASTOS (sin IVA)</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gf-red)' }}>{fmt(iva.netGas)}</div>
              <div style={{ fontSize: 10, color: 'var(--gf-text3)', marginTop: 2 }}>{iva.factGas} facturas recibidas</div>
            </div>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div className="gf-card" style={{ margin: 0 }}>
          <SectionTitle>Ingresos vs Gastos</SectionTitle>
          <Legend items={[{ label: 'Ingresos', color: '#2a78d6' }, { label: 'Gastos', color: '#e34948' }]} />
          <div style={{ position: 'relative', height: 190 }}>
            <MonthlyBarChart labels={monthLabels} ingData={monthlyIng} gasData={monthlyGas} dark={dark} />
          </div>
        </div>
        <div className="gf-card" style={{ margin: 0 }}>
          <SectionTitle>Gastos por categoría</SectionTitle>
          {activeCats.length === 0
            ? <Empty>Sin gastos aún.</Empty>
            : <>
                <Legend items={activeCats.map((c, i) => ({ label: c, color: activeCatColors[i] }))} />
                <div style={{ position: 'relative', height: 190 }}>
                  <DoughnutChart labels={activeCats} data={activeCatVals} colors={activeCatColors} dark={dark} />
                </div>
              </>
          }
        </div>
      </div>

      {/* Payment method card */}
      <div className="gf-card">
        <SectionTitle>Gastos por método de pago</SectionTitle>
        {pagoKeys.length === 0
          ? <Empty>Sin gastos.</Empty>
          : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <Legend items={pagoKeys.map((k, i) => ({ label: k, color: pagoColors[i] }))} />
                <div style={{ position: 'relative', height: 155 }}>
                  <DoughnutChart labels={pagoKeys} data={pagoKeys.map(k => pagoData[k])} colors={pagoColors} dark={dark} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, justifyContent: 'center' }}>
                {pagoKeys.map((k, i) => {
                  const pct = kpis.gas > 0 ? Math.round(pagoData[k] / kpis.gas * 100) : 0
                  return (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--gf-text2)', flexShrink: 0, width: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k}</div>
                      <div style={{ flex: 1, background: 'var(--gf-surface2)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: pagoColors[i], transition: 'width .3s' }} />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gf-text3)', width: 30, textAlign: 'right' }}>{pct}%</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gf-text)', width: 90, textAlign: 'right' }}>{fmt(pagoData[k])}</div>
                    </div>
                  )
                })}
              </div>
            </div>
        }
      </div>

      {/* Category breakdown */}
      {activeCats.length > 0 && (
        <div className="gf-card">
          <SectionTitle>Desglose por categoría</SectionTitle>
          {activeCats.map((c, i) => {
            const pct = kpis.gas > 0 ? Math.round(catData[c] / kpis.gas * 100) : 0
            return (
              <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: 'var(--gf-text2)', flexShrink: 0, width: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c}</div>
                <div style={{ flex: 1, background: 'var(--gf-surface2)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: activeCatColors[i], transition: 'width .3s' }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--gf-text3)', width: 30, textAlign: 'right' }}>{pct}%</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gf-text)', width: 90, textAlign: 'right' }}>{fmt(catData[c])}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Transaction list */}
      <div className="gf-card">
        {esEmpresa ? (
          <>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.5px', color: 'var(--gf-text3)', textTransform: 'uppercase', marginBottom: 8 }}>Ingresos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto', marginBottom: 10 }}>
              {ingTx.length === 0
                ? <Empty>Sin ingresos.</Empty>
                : [...ingTx].reverse().map(t => (
                    <TxItem key={t.id} t={t} isEmpresa onToggle={() => onTogglePagado(t.id, t.entidadId)} onDelete={() => onDelete(t.id, t.entidadId)} />
                  ))
              }
            </div>
            <div style={{ height: .5, background: 'var(--gf-border)', margin: '10px 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.5px', color: 'var(--gf-text3)', textTransform: 'uppercase', marginBottom: 8, marginTop: 10 }}>Gastos</div>
          </>
        ) : (
          <SectionTitle>Transacciones</SectionTitle>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
          {gasTx.length === 0 && (!esEmpresa ? ingTx.length === 0 : true)
            ? <Empty>Sin movimientos.</Empty>
            : <>
                {[...gasTx].reverse().map(t => (
                  <TxItem key={t.id} t={t} onDelete={() => onDelete(t.id, t.entidadId)} />
                ))}
                {!esEmpresa && [...ingTx].reverse().map(t => (
                  <TxItem key={t.id} t={t} onDelete={() => onDelete(t.id, t.entidadId)} />
                ))}
              </>
          }
        </div>
      </div>
    </div>
  )
}

function TxItem({ t, isEmpresa, onToggle, onDelete }: {
  t: Transaccion
  isEmpresa?: boolean
  onToggle?: () => void
  onDelete: () => void
}) {
  const isIng = t.tipo === 'INGRESO'
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '9px 10px', borderRadius: 8, background: 'var(--gf-surface2)', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, flex: 1, minWidth: 0 }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, flexShrink: 0, marginTop: 1,
          background: isIng ? 'var(--gf-green-bg)' : 'var(--gf-red-bg)',
          color: isIng ? 'var(--gf-green-t)' : 'var(--gf-red-t)',
        }}>
          {isIng ? '↙' : '↗'}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gf-text)' }}>{t.desc}</div>
          <div style={{ fontSize: 11, color: 'var(--gf-text3)', marginTop: 3, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
            <DocBadge tipoDoc={t.tipoDoc} nroDoc={t.nroDoc} />
            {!isIng && <PagoBadge metodoPago={t.metodoPago} />}
            {!isIng && <span>· {t.cat}</span>}
            <span>· {t.fecha}</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', color: isIng ? 'var(--gf-green)' : 'var(--gf-red)' }}>
          {isIng ? '+' : '-'}{fmt(t.monto)}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {isEmpresa && isIng && onToggle && (
            <button onClick={onToggle} style={{ border: '.5px solid var(--gf-border-s)', background: 'transparent', borderRadius: 5, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: 'var(--gf-text2)', fontWeight: 500 }}>
              {t.pagado ? '✅ Pagado' : '🕐 Pendiente'}
            </button>
          )}
          <button onClick={onDelete} title="Eliminar" style={{ border: '.5px solid var(--gf-border-s)', background: 'transparent', borderRadius: 5, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: 'var(--gf-red)', fontWeight: 500 }}>
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, colorClass, sub }: { label: string; value: string; colorClass: string; sub: string }) {
  const colorMap: Record<string, string> = {
    pos: 'var(--gf-green)', neg: 'var(--gf-red)', warn: 'var(--gf-amber)', iva: 'var(--gf-purple)', neu: 'var(--gf-text)',
  }
  return (
    <div className="gf-card" style={{ marginBottom: 0 }}>
      <div style={{ fontSize: 10, color: 'var(--gf-text3)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px' }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.1, color: colorMap[colorClass] ?? 'var(--gf-text)' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--gf-text3)', marginTop: 3 }}>{sub}</div>
    </div>
  )
}

function IvaRow({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '.5px solid rgba(0,0,0,.06)', fontWeight: bold ? 700 : undefined, fontSize: bold ? 14 : undefined }}>
      <span style={{ fontSize: 12, color: 'var(--gf-text2)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{value}</span>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gf-text3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.4px' }}>{children}</div>
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
      {items.map(item => (
        <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--gf-text2)' }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, flexShrink: 0, background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ textAlign: 'center', padding: 24, color: 'var(--gf-text3)', fontSize: 13 }}>{children}</div>
}
