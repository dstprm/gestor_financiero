'use client'

import { useState, useMemo } from 'react'
import type { Entidad, Transaccion } from '@/lib/gestor-types'
import { calcKPIs, calcIVA } from '@/lib/gestor-calc'
import { fmt, getMesLabel, getAvailableMonths, CATS_EMPRESA, CATS_PERSONAL, METODOS_PAGO, PAGO_COLORS } from '@/lib/gestor-constants'
import { MonthlyBarChart, DoughnutChart } from './GestorCharts'

interface Props {
  entidades: Entidad[]
  txByEntity: Record<string, Transaccion[]>
  dark: boolean
}

export default function ResumenView({ entidades, txByEntity, dark }: Props) {
  const [vista, setVista] = useState<'actual' | 'comparativo'>('actual')
  const allDates = useMemo(() => Object.values(txByEntity).flat().map(t => t.fecha), [txByEntity])
  const months = getAvailableMonths(allDates)
  const [mes, setMes] = useState(() => months[0])
  const empEntidades = entidades.filter(e => e.tipo === 'EMPRESA')

  const allCats = useMemo(() => [...new Set([...CATS_EMPRESA, ...CATS_PERSONAL])], [])

  function getKpi(eid: string, m: string) {
    return calcKPIs(txByEntity[eid] ?? [], m)
  }
  function getIva(eid: string, m: string) {
    return calcIVA(txByEntity[eid] ?? [], m)
  }

  const handlePrint = () => window.print()

  return (
    <div>
      <button onClick={handlePrint} className="no-print" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--gf-red)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 14 }}>
        🖨️ Exportar PDF
      </button>

      {/* Vista selector */}
      <div className="no-print" style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {(['actual', 'comparativo'] as const).map(v => (
          <button key={v} onClick={() => setVista(v)} style={{ padding: '6px 14px', borderRadius: 20, border: '.5px solid var(--gf-border-s)', background: vista === v ? 'var(--gf-accent)' : 'transparent', color: vista === v ? '#fff' : 'var(--gf-text2)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            {v === 'actual' ? 'Mes actual' : 'Comparativo'}
          </button>
        ))}
      </div>

      {vista === 'actual' ? (
        <>
          {/* Month selector */}
          <div className="no-print" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {months.map(m => (
              <button key={m} onClick={() => setMes(m)} style={{ padding: '5px 12px', borderRadius: 20, border: `.5px solid ${mes === m ? 'var(--gf-accent)' : 'var(--gf-border)'}`, background: mes === m ? 'var(--gf-accent-bg)' : 'var(--gf-surface2)', color: mes === m ? 'var(--gf-accent-t)' : 'var(--gf-text3)', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                {getMesLabel(m).split(' ')[0]}
              </button>
            ))}
          </div>

          {/* General summary table */}
          <div className="gf-card">
            <SectionTitle>Resumen {getMesLabel(mes)} — todas las entidades</SectionTitle>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <Th>Entidad</Th><Th right>Ingresos</Th><Th right>Gastos</Th><Th right>Balance</Th><Th right>Por cobrar</Th>
                  </tr>
                </thead>
                <tbody>
                  {entidades.map(e => {
                    const k = getKpi(e.id, mes)
                    return (
                      <tr key={e.id}>
                        <Td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, flexShrink: 0 }} />{e.nombre}</span></Td>
                        <Td right><span style={{ color: 'var(--gf-green)', fontWeight: 600 }}>{k.ing > 0 ? fmt(k.ing) : '-'}</span></Td>
                        <Td right><span style={{ color: 'var(--gf-red)', fontWeight: 600 }}>{k.gas > 0 ? fmt(k.gas) : '-'}</span></Td>
                        <Td right><span style={{ color: k.bal >= 0 ? 'var(--gf-green)' : 'var(--gf-red)', fontWeight: 600 }}>{k.ing > 0 || k.gas > 0 ? (k.bal >= 0 ? '+' : '') + fmt(k.bal) : '-'}</span></Td>
                        <Td right><span style={{ color: k.pend > 0 ? 'var(--gf-amber)' : 'var(--gf-text3)', fontWeight: k.pend > 0 ? 600 : undefined }}>{k.pend > 0 ? fmt(k.pend) : '-'}</span></Td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <TotalRow>
                    {(() => {
                      let tI = 0, tG = 0, tP = 0
                      entidades.forEach(e => { const k = getKpi(e.id, mes); tI += k.ing; tG += k.gas; tP += k.pend })
                      const bal = tI - tG
                      return (
                        <tr style={{ fontWeight: 700, fontSize: 12, borderTop: '.5px solid var(--gf-border-s)', background: 'var(--gf-surface2)' }}>
                          <Td>TOTAL</Td>
                          <Td right><span style={{ color: 'var(--gf-green)' }}>{fmt(tI)}</span></Td>
                          <Td right><span style={{ color: 'var(--gf-red)' }}>{fmt(tG)}</span></Td>
                          <Td right><span style={{ color: bal >= 0 ? 'var(--gf-green)' : 'var(--gf-red)' }}>{(bal >= 0 ? '+' : '') + fmt(bal)}</span></Td>
                          <Td right><span style={{ color: tP > 0 ? 'var(--gf-amber)' : 'var(--gf-text3)' }}>{tP > 0 ? fmt(tP) : '-'}</span></Td>
                        </tr>
                      )
                    })()}
                  </TotalRow>
                </tfoot>
              </table>
            </div>
          </div>

          {/* IVA summary */}
          {empEntidades.length > 0 && (
            <div style={{ background: 'var(--gf-purple-bg)', borderRadius: 12, padding: 14, marginBottom: 14, border: '.5px solid var(--gf-purple-t)' }}>
              <SectionTitle style={{ color: 'var(--gf-purple-t)' }}>📋 Resumen IVA empresas — {getMesLabel(mes)}</SectionTitle>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      <Th>Empresa</Th><Th right>Débito Fiscal</Th><Th right>Crédito Fiscal</Th><Th right>IVA a pagar</Th><Th right>Neto ingresos</Th><Th right>Neto gastos</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {empEntidades.map(e => {
                      const iv = getIva(e.id, mes)
                      return (
                        <tr key={e.id}>
                          <Td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: e.color }} />{e.nombre}</span></Td>
                          <Td right><span style={{ color: 'var(--gf-red)', fontWeight: 600 }}>{iv.ivaDebito > 0 ? fmt(iv.ivaDebito) : '-'}</span></Td>
                          <Td right><span style={{ color: 'var(--gf-green)', fontWeight: 600 }}>{iv.ivaCredito > 0 ? fmt(iv.ivaCredito) : '-'}</span></Td>
                          <Td right><span style={{ color: iv.diferencia >= 0 ? 'var(--gf-purple)' : 'var(--gf-green)', fontWeight: 600 }}>{iv.ivaDebito > 0 || iv.ivaCredito > 0 ? (iv.diferencia >= 0 ? '' : '-') + fmt(Math.abs(iv.diferencia)) : '-'}</span></Td>
                          <Td right>{iv.netIng > 0 ? fmt(iv.netIng) : '-'}</Td>
                          <Td right>{iv.netGas > 0 ? fmt(iv.netGas) : '-'}</Td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    {(() => {
                      let tD = 0, tC = 0
                      empEntidades.forEach(e => { const iv = getIva(e.id, mes); tD += iv.ivaDebito; tC += iv.ivaCredito })
                      const dif = tD - tC
                      return (
                        <tr style={{ fontWeight: 700, fontSize: 12, borderTop: '.5px solid var(--gf-border-s)', background: 'var(--gf-surface2)' }}>
                          <Td>TOTAL EMPRESAS</Td>
                          <Td right><span style={{ color: 'var(--gf-red)' }}>{fmt(tD)}</span></Td>
                          <Td right><span style={{ color: 'var(--gf-green)' }}>{fmt(tC)}</span></Td>
                          <Td right><span style={{ color: dif >= 0 ? 'var(--gf-purple)' : 'var(--gf-green)' }}>{(dif >= 0 ? '' : '-') + fmt(Math.abs(dif))}</span></Td>
                          <Td right>-</Td><Td right>-</Td>
                        </tr>
                      )
                    })()}
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Per-entity mini doughnuts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            {entidades.map(e => {
              const k = getKpi(e.id, mes)
              const hasData = k.ing > 0 || k.gas > 0
              return (
                <div key={e.id} className="gf-card" style={{ margin: 0 }}>
                  <SectionTitle>{e.nombre}</SectionTitle>
                  {!hasData
                    ? <div style={{ textAlign: 'center', padding: 24, color: 'var(--gf-text3)', fontSize: 13 }}>Sin movimientos</div>
                    : <div style={{ position: 'relative', height: 155 }}>
                        <DoughnutChart labels={['Ingresos', 'Gastos']} data={[k.ing, k.gas]} colors={['#2a78d6', '#e34948']} dark={dark} />
                      </div>
                  }
                </div>
              )
            })}
          </div>

          {/* Category breakdown by entity */}
          <div className="gf-card">
            <SectionTitle>Gastos por categoría — {getMesLabel(mes)}</SectionTitle>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <Th>Categoría</Th>
                    {entidades.map(e => <Th key={e.id} right style={{ fontSize: 10 }}>{e.nombre}</Th>)}
                    <Th right>Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {allCats.map(cat => {
                    const vals = entidades.map(e => (txByEntity[e.id] ?? []).filter(t => t.tipo === 'GASTO' && t.cat === cat && t.fecha.startsWith(mes)).reduce((s, t) => s + t.monto, 0))
                    const tot = vals.reduce((s, v) => s + v, 0)
                    if (tot === 0) return null
                    return (
                      <tr key={cat}>
                        <Td>{cat}</Td>
                        {vals.map((v, i) => <Td key={i} right><span style={{ color: v > 0 ? 'var(--gf-red)' : 'var(--gf-text3)', fontWeight: v > 0 ? 600 : undefined }}>{v > 0 ? fmt(v) : '-'}</span></Td>)}
                        <Td right><span style={{ color: 'var(--gf-red)', fontWeight: 600 }}>{fmt(tot)}</span></Td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment method breakdown by entity */}
          <div className="gf-card">
            <SectionTitle>Gastos por método de pago — {getMesLabel(mes)}</SectionTitle>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <Th>Método</Th>
                    {entidades.map(e => <Th key={e.id} right style={{ fontSize: 10 }}>{e.nombre}</Th>)}
                    <Th right>Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {METODOS_PAGO.map(met => {
                    const vals = entidades.map(e => (txByEntity[e.id] ?? []).filter(t => t.tipo === 'GASTO' && t.metodoPago === met && t.fecha.startsWith(mes)).reduce((s, t) => s + t.monto, 0))
                    const tot = vals.reduce((s, v) => s + v, 0)
                    if (tot === 0) return null
                    return (
                      <tr key={met}>
                        <Td><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: PAGO_COLORS[met] ?? '#888', display: 'inline-block', flexShrink: 0 }} />{met}</span></Td>
                        {vals.map((v, i) => <Td key={i} right><span style={{ color: v > 0 ? 'var(--gf-red)' : 'var(--gf-text3)', fontWeight: v > 0 ? 600 : undefined }}>{v > 0 ? fmt(v) : '-'}</span></Td>)}
                        <Td right><span style={{ color: 'var(--gf-red)', fontWeight: 600 }}>{fmt(tot)}</span></Td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Comparative table */}
          <div className="gf-card">
            <SectionTitle>Comparativo mensual — totales</SectionTitle>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr><Th>Mes</Th><Th right>Ing. Total</Th><Th right>Gas. Total</Th><Th right>Balance</Th><Th right>IVA estimado</Th></tr>
                </thead>
                <tbody>
                  {[...months].reverse().map(m => {
                    let tI = 0, tG = 0, tIva = 0
                    entidades.forEach(e => { const k = getKpi(e.id, m); tI += k.ing; tG += k.gas; if (e.tipo === 'EMPRESA') { const iv = getIva(e.id, m); tIva += iv.diferencia } })
                    const bal = tI - tG
                    return (
                      <tr key={m}>
                        <Td><span style={{ fontWeight: 600 }}>{getMesLabel(m)}</span></Td>
                        <Td right><span style={{ color: 'var(--gf-green)', fontWeight: 600 }}>{tI > 0 ? fmt(tI) : '-'}</span></Td>
                        <Td right><span style={{ color: 'var(--gf-red)', fontWeight: 600 }}>{tG > 0 ? fmt(tG) : '-'}</span></Td>
                        <Td right><span style={{ color: bal >= 0 ? 'var(--gf-green)' : 'var(--gf-red)', fontWeight: 600 }}>{tI > 0 || tG > 0 ? (bal >= 0 ? '+' : '') + fmt(bal) : '-'}</span></Td>
                        <Td right><span style={{ color: tIva > 0 ? 'var(--gf-purple)' : 'var(--gf-text3)', fontWeight: tIva > 0 ? 600 : undefined }}>{tIva > 0 ? fmt(tIva) : '-'}</span></Td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Per-entity comparative charts + tables */}
          {entidades.map(e => {
            const txs = txByEntity[e.id] ?? []
            const orderedMonths = [...months].reverse()
            const ingData = orderedMonths.map(m => calcKPIs(txs, m).ing)
            const gasData = orderedMonths.map(m => calcKPIs(txs, m).gas)
            const labels = orderedMonths.map(m => getMesLabel(m).split(' ')[0].slice(0, 3))
            return (
              <div key={e.id}>
                <div className="gf-card">
                  <SectionTitle>{e.nombre} — evolución mensual</SectionTitle>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                    {[{ label: 'Ingresos', color: '#2a78d6' }, { label: 'Gastos', color: '#e34948' }].map(item => (
                      <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--gf-text2)' }}>
                        <span style={{ width: 9, height: 9, borderRadius: 2, background: item.color }} />
                        {item.label}
                      </span>
                    ))}
                  </div>
                  <div style={{ position: 'relative', height: 190 }}>
                    <MonthlyBarChart labels={labels} ingData={ingData} gasData={gasData} dark={dark} />
                  </div>
                </div>
                <div className="gf-card">
                  <SectionTitle>{e.nombre} — detalle mensual</SectionTitle>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr>
                          <Th>Mes</Th><Th right>Ingresos</Th><Th right>Gastos</Th><Th right>Balance</Th>
                          {e.tipo === 'EMPRESA' && <Th right>IVA a pagar</Th>}
                        </tr>
                      </thead>
                      <tbody>
                        {orderedMonths.map(m => {
                          const k = calcKPIs(txs, m)
                          const iv = e.tipo === 'EMPRESA' ? calcIVA(txs, m) : null
                          return (
                            <tr key={m}>
                              <Td><span style={{ fontWeight: 600 }}>{getMesLabel(m)}</span></Td>
                              <Td right><span style={{ color: 'var(--gf-green)', fontWeight: 600 }}>{k.ing > 0 ? fmt(k.ing) : '-'}</span></Td>
                              <Td right><span style={{ color: 'var(--gf-red)', fontWeight: 600 }}>{k.gas > 0 ? fmt(k.gas) : '-'}</span></Td>
                              <Td right><span style={{ color: k.bal >= 0 ? 'var(--gf-green)' : 'var(--gf-red)', fontWeight: 600 }}>{k.ing > 0 || k.gas > 0 ? (k.bal >= 0 ? '+' : '') + fmt(k.bal) : '-'}</span></Td>
                              {iv && <Td right><span style={{ color: iv.diferencia > 0 ? 'var(--gf-purple)' : 'var(--gf-text3)', fontWeight: iv.diferencia > 0 ? 600 : undefined }}>{iv.diferencia > 0 ? fmt(iv.diferencia) : '-'}</span></Td>}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

function Th({ children, right, style }: { children?: React.ReactNode; right?: boolean; style?: React.CSSProperties }) {
  return (
    <th style={{ textAlign: right ? 'right' : 'left', padding: '7px 8px', fontSize: 10, fontWeight: 700, color: 'var(--gf-text3)', textTransform: 'uppercase', letterSpacing: '.4px', borderBottom: '.5px solid var(--gf-border-s)', whiteSpace: 'nowrap', ...style }}>
      {children}
    </th>
  )
}

function Td({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return (
    <td style={{ padding: '8px 8px', borderBottom: '.5px solid var(--gf-border)', verticalAlign: 'middle', textAlign: right ? 'right' : 'left', color: 'var(--gf-text)' }}>
      {children}
    </td>
  )
}

function TotalRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gf-text3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.4px', ...style }}>{children}</div>
}
