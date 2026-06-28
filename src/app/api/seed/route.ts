import { prisma } from '@/lib/db'

export async function POST() {
  const existing = await prisma.entidad.count()
  if (existing > 0) {
    return Response.json({ ok: true, skipped: true, message: 'Ya hay datos.' })
  }

  const [personal, cyg, ruwa, bordallo] = await Promise.all([
    prisma.entidad.create({ data: { nombre: 'Finanzas Personales', tipo: 'PERSONAL', color: '#2a78d6', orden: 0 } }),
    prisma.entidad.create({ data: { nombre: 'CyG Diseños',         tipo: 'EMPRESA',  color: '#1baf7a', orden: 1 } }),
    prisma.entidad.create({ data: { nombre: 'Ruwa',                tipo: 'EMPRESA',  color: '#eda100', orden: 2 } }),
    prisma.entidad.create({ data: { nombre: 'Bordallo',            tipo: 'EMPRESA',  color: '#4a3aa7', orden: 3 } }),
  ])

  await prisma.transaccion.createMany({
    data: [
      // Personal - Junio
      { entidadId: personal.id, tipo: 'INGRESO', desc: 'Salario',          cat: 'Ingreso',             monto: 2500000, fecha: new Date('2026-06-01T12:00:00Z'), tipoDoc: 'sin-doc' },
      { entidadId: personal.id, tipo: 'GASTO',   desc: 'Arriendo',         cat: 'Vivienda / Arriendo', monto: 650000,  fecha: new Date('2026-06-03T12:00:00Z'), tipoDoc: 'sin-doc',  metodoPago: 'DEBITO GERA' },
      { entidadId: personal.id, tipo: 'GASTO',   desc: 'Supermercado',     cat: 'Alimentación',        monto: 180000,  fecha: new Date('2026-06-05T12:00:00Z'), tipoDoc: 'sin-doc',  metodoPago: 'TARJETA CREDITO CHILE CLAUDIA' },
      { entidadId: personal.id, tipo: 'INGRESO', desc: 'Dividendos',       cat: 'Ingreso',             monto: 320000,  fecha: new Date('2026-06-10T12:00:00Z'), tipoDoc: 'sin-doc' },
      { entidadId: personal.id, tipo: 'GASTO',   desc: 'Bencina',          cat: 'Bencina',             monto: 85000,   fecha: new Date('2026-06-12T12:00:00Z'), tipoDoc: 'boleta',   nroDoc: 'B-0341', metodoPago: 'DEBITO GERA' },
      // Personal - Mayo
      { entidadId: personal.id, tipo: 'INGRESO', desc: 'Salario',          cat: 'Ingreso',             monto: 2500000, fecha: new Date('2026-05-01T12:00:00Z'), tipoDoc: 'sin-doc' },
      { entidadId: personal.id, tipo: 'GASTO',   desc: 'Arriendo',         cat: 'Vivienda / Arriendo', monto: 650000,  fecha: new Date('2026-05-03T12:00:00Z'), tipoDoc: 'sin-doc',  metodoPago: 'DEBITO GERA' },
      { entidadId: personal.id, tipo: 'GASTO',   desc: 'Supermercado',     cat: 'Alimentación',        monto: 210000,  fecha: new Date('2026-05-08T12:00:00Z'), tipoDoc: 'sin-doc',  metodoPago: 'TARJETA CREDITO CHILE CLAUDIA' },
      // Personal - Abril
      { entidadId: personal.id, tipo: 'INGRESO', desc: 'Salario',          cat: 'Ingreso',             monto: 2500000, fecha: new Date('2026-04-01T12:00:00Z'), tipoDoc: 'sin-doc' },
      { entidadId: personal.id, tipo: 'GASTO',   desc: 'Arriendo',         cat: 'Vivienda / Arriendo', monto: 650000,  fecha: new Date('2026-04-03T12:00:00Z'), tipoDoc: 'sin-doc',  metodoPago: 'DEBITO GERA' },
      // CyG - Junio
      { entidadId: cyg.id, tipo: 'INGRESO', desc: 'Diseño logo cliente A', cat: 'Ingreso', monto: 4500000, fecha: new Date('2026-06-02T12:00:00Z'), tipoDoc: 'factura', nroDoc: 'F-0021', pagado: true },
      { entidadId: cyg.id, tipo: 'GASTO',   desc: 'Proveedor telas',       cat: 'Proveedores / Materiales', monto: 1200000, fecha: new Date('2026-06-04T12:00:00Z'), tipoDoc: 'factura', nroDoc: 'F-0210', metodoPago: 'TRANSFERENCIA CYG' },
      { entidadId: cyg.id, tipo: 'INGRESO', desc: 'Diseño web cliente B',  cat: 'Ingreso', monto: 2800000, fecha: new Date('2026-06-08T12:00:00Z'), tipoDoc: 'boleta',  nroDoc: 'B-0105', pagado: false },
      { entidadId: cyg.id, tipo: 'GASTO',   desc: 'Sueldos junio',         cat: 'Sueldos y RRHH',           monto: 1800000, fecha: new Date('2026-06-15T12:00:00Z'), tipoDoc: 'sin-doc', metodoPago: 'DEBITO CYG' },
      // CyG - Mayo
      { entidadId: cyg.id, tipo: 'INGRESO', desc: 'Diseño catálogo',       cat: 'Ingreso', monto: 3800000, fecha: new Date('2026-05-05T12:00:00Z'), tipoDoc: 'factura', nroDoc: 'F-0019', pagado: true },
      { entidadId: cyg.id, tipo: 'GASTO',   desc: 'Proveedor insumos',     cat: 'Proveedores / Materiales', monto: 980000,  fecha: new Date('2026-05-06T12:00:00Z'), tipoDoc: 'factura', nroDoc: 'F-0198', metodoPago: 'TRANSFERENCIA CYG' },
      { entidadId: cyg.id, tipo: 'GASTO',   desc: 'Sueldos mayo',          cat: 'Sueldos y RRHH',           monto: 1800000, fecha: new Date('2026-05-15T12:00:00Z'), tipoDoc: 'sin-doc', metodoPago: 'DEBITO CYG' },
      // CyG - Abril
      { entidadId: cyg.id, tipo: 'INGRESO', desc: 'Diseño branding',       cat: 'Ingreso', monto: 1500000, fecha: new Date('2026-04-10T12:00:00Z'), tipoDoc: 'boleta',  nroDoc: 'B-0098', pagado: true },
      { entidadId: cyg.id, tipo: 'GASTO',   desc: 'Sueldos abril',         cat: 'Sueldos y RRHH',           monto: 1800000, fecha: new Date('2026-04-15T12:00:00Z'), tipoDoc: 'sin-doc', metodoPago: 'DEBITO CYG' },
      // Ruwa - Junio
      { entidadId: ruwa.id, tipo: 'INGRESO', desc: 'Servicio mensual', cat: 'Ingreso',                  monto: 3200000, fecha: new Date('2026-06-01T12:00:00Z'), tipoDoc: 'factura', nroDoc: 'F-0088', pagado: true },
      { entidadId: ruwa.id, tipo: 'GASTO',   desc: 'Google Ads',       cat: 'Marketing y Publicidad',   monto: 450000,  fecha: new Date('2026-06-06T12:00:00Z'), tipoDoc: 'sin-doc', metodoPago: 'TARJETA CREDITO CMR' },
      { entidadId: ruwa.id, tipo: 'GASTO',   desc: 'Hosting',          cat: 'Gastos generales',          monto: 180000,  fecha: new Date('2026-06-07T12:00:00Z'), tipoDoc: 'boleta',  nroDoc: 'B-0022', metodoPago: 'TRANSFERENCIA RUWA' },
      // Ruwa - Mayo
      { entidadId: ruwa.id, tipo: 'INGRESO', desc: 'Servicio mensual', cat: 'Ingreso',                  monto: 3200000, fecha: new Date('2026-05-01T12:00:00Z'), tipoDoc: 'factura', nroDoc: 'F-0081', pagado: true },
      { entidadId: ruwa.id, tipo: 'GASTO',   desc: 'Google Ads',       cat: 'Marketing y Publicidad',   monto: 390000,  fecha: new Date('2026-05-06T12:00:00Z'), tipoDoc: 'sin-doc', metodoPago: 'TARJETA CREDITO CMR' },
      // Ruwa - Abril
      { entidadId: ruwa.id, tipo: 'INGRESO', desc: 'Servicio mensual', cat: 'Ingreso',                  monto: 3200000, fecha: new Date('2026-04-01T12:00:00Z'), tipoDoc: 'factura', nroDoc: 'F-0074', pagado: true },
      { entidadId: ruwa.id, tipo: 'GASTO',   desc: 'Google Ads',       cat: 'Marketing y Publicidad',   monto: 420000,  fecha: new Date('2026-04-06T12:00:00Z'), tipoDoc: 'sin-doc', metodoPago: 'TARJETA CREDITO CMR' },
    ],
  })

  return Response.json({ ok: true, skipped: false })
}
