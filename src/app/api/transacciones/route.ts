import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const entidadId = searchParams.get('entidadId')

  const txs = await prisma.transaccion.findMany({
    where: entidadId ? { entidadId } : undefined,
    orderBy: { fecha: 'asc' },
  })

  return Response.json(
    txs.map(t => ({
      ...t,
      fecha: t.fecha.toISOString().split('T')[0],
    }))
  )
}

export async function POST(req: Request) {
  const body = await req.json()
  const tx = await prisma.transaccion.create({
    data: {
      entidadId: body.entidadId,
      tipo: body.tipo,
      desc: body.desc,
      cat: body.cat,
      monto: Math.round(body.monto),
      fecha: new Date(body.fecha + 'T12:00:00Z'),
      tipoDoc: body.tipoDoc ?? 'sin-doc',
      nroDoc: body.nroDoc ?? null,
      metodoPago: body.metodoPago ?? null,
      pagado: body.pagado ?? null,
    },
  })
  return Response.json(
    { ...tx, fecha: tx.fecha.toISOString().split('T')[0] },
    { status: 201 }
  )
}
