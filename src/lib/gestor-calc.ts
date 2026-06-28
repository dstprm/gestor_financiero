import type { Transaccion, KPIs, IVACalc } from './gestor-types'
import { IVA } from './gestor-constants'

export function txDelMes(txs: Transaccion[], mes: string): Transaccion[] {
  return txs.filter(t => t.fecha && t.fecha.startsWith(mes))
}

export function calcKPIs(txs: Transaccion[], mes: string): KPIs {
  const filtered = txDelMes(txs, mes)
  const ing = filtered.filter(t => t.tipo === 'INGRESO').reduce((s, t) => s + t.monto, 0)
  const gas = filtered.filter(t => t.tipo === 'GASTO').reduce((s, t) => s + t.monto, 0)
  const pend = filtered.filter(t => t.tipo === 'INGRESO' && t.pagado === false).reduce((s, t) => s + t.monto, 0)
  return { ing, gas, bal: ing - gas, pend }
}

export function calcIVA(txs: Transaccion[], mes: string): IVACalc {
  const filtered = txDelMes(txs, mes)
  const factIng = filtered.filter(t => t.tipo === 'INGRESO' && t.tipoDoc === 'factura')
  const factGas = filtered.filter(t => t.tipo === 'GASTO' && t.tipoDoc === 'factura')
  const ivaDebito = factIng.reduce((s, t) => s + (t.monto - t.monto / (1 + IVA)), 0)
  const ivaCredito = factGas.reduce((s, t) => s + (t.monto - t.monto / (1 + IVA)), 0)
  const netIng = factIng.reduce((s, t) => s + t.monto / (1 + IVA), 0)
  const netGas = factGas.reduce((s, t) => s + t.monto / (1 + IVA), 0)
  return {
    ivaDebito,
    ivaCredito,
    diferencia: ivaDebito - ivaCredito,
    netIng,
    netGas,
    factIng: factIng.length,
    factGas: factGas.length,
  }
}
