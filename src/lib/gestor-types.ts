export type TipoEntidad = 'PERSONAL' | 'EMPRESA'
export type TipoTx = 'INGRESO' | 'GASTO'

export interface Entidad {
  id: string
  nombre: string
  tipo: TipoEntidad
  color: string
  orden: number
}

export interface Transaccion {
  id: string
  entidadId: string
  tipo: TipoTx
  desc: string
  cat: string
  monto: number
  fecha: string // 'YYYY-MM-DD'
  tipoDoc: string // 'sin-doc' | 'boleta' | 'factura'
  nroDoc: string | null
  metodoPago: string | null
  pagado: boolean | null
}

export interface KPIs {
  ing: number
  gas: number
  bal: number
  pend: number
}

export interface IVACalc {
  ivaDebito: number
  ivaCredito: number
  diferencia: number
  netIng: number
  netGas: number
  factIng: number
  factGas: number
}
