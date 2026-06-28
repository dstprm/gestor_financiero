export const IVA = 0.19

export const CATS_EMPRESA = [
  'Sueldos y RRHH',
  'Proveedores / Materiales',
  'Arriendo / Bodega',
  'Marketing y Publicidad',
  'Servicios básicos',
  'Transporte / Logística',
  'Impuestos / Contabilidad',
  'Gastos generales',
  'Bencina',
]

export const CATS_PERSONAL = [
  'Vivienda / Arriendo',
  'Alimentación',
  'Transporte / Bencina',
  'Salud',
  'Educación',
  'Entretenimiento',
  'Ropa / Compras',
  'Servicios básicos',
  'Ahorro / Inversión',
  'Bencina',
]

export const METODOS_PAGO = [
  'DEBITO CYG',
  'DEBITO RUWA',
  'DEBITO BORDALLO',
  'DEBITO GERA',
  'TRANSFERENCIA CYG',
  'TRANSFERENCIA RUWA',
  'TRANSFERENCIA BORDALLO',
  'TRANSFERENCIA GERA',
  'TARJETA CREDITO CMR',
  'TARJETA CREDITO CHILE GERA',
  'TARJETA CREDITO CHILE CLAUDIA',
  'CREDITO EMPRESA',
  'CHEQUE 30 DIAS',
]

export const CAT_COLORS = [
  '#2a78d6', '#1baf7a', '#eda100', '#4a3aa7', '#e34948',
  '#e87ba4', '#eb6834', '#008300', '#73726c', '#5dcaa5',
]

export const PAGO_COLORS: Record<string, string> = {
  'DEBITO CYG': '#2a78d6',
  'DEBITO RUWA': '#1baf7a',
  'DEBITO BORDALLO': '#4a3aa7',
  'DEBITO GERA': '#eda100',
  'TRANSFERENCIA CYG': '#378add',
  'TRANSFERENCIA RUWA': '#1d9e75',
  'TRANSFERENCIA BORDALLO': '#7f77dd',
  'TRANSFERENCIA GERA': '#ba7517',
  'TARJETA CREDITO CMR': '#e34948',
  'TARJETA CREDITO CHILE GERA': '#e87ba4',
  'TARJETA CREDITO CHILE CLAUDIA': '#eb6834',
  'CREDITO EMPRESA': '#008300',
  'CHEQUE 30 DIAS': '#73726c',
}

export const ENTITY_COLORS_DEFAULT = ['#2a78d6', '#1baf7a', '#eda100', '#4a3aa7']

export function getAvailableMonths(dates?: string[]): string[] {
  const now = new Date()
  const endYear = now.getFullYear()
  const endMonth = now.getMonth() + 1

  let startYear = endYear
  let startMonth = 1

  if (dates && dates.length > 0) {
    const earliest = dates.reduce((min, d) => (d < min ? d : min))
    const [ey, em] = earliest.split('-').map(Number)
    startYear = ey
    startMonth = em
  }

  const months: string[] = []
  for (let y = startYear; y <= endYear; y++) {
    const mStart = y === startYear ? startMonth : 1
    const mEnd = y === endYear ? endMonth : 12
    for (let m = mStart; m <= mEnd; m++) {
      months.push(`${y}-${String(m).padStart(2, '0')}`)
    }
  }
  return months.reverse()
}

export function getMesLabel(mes: string): string {
  const [year, month] = mes.split('-')
  const names = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return `${names[parseInt(month) - 1]} ${year}`
}

export function fmt(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CL')
}

export function getCats(tipo: string): string[] {
  return tipo === 'EMPRESA' ? CATS_EMPRESA : CATS_PERSONAL
}
