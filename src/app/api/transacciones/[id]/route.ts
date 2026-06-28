import { prisma } from '@/lib/db'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const tx = await prisma.transaccion.update({
    where: { id },
    data: {
      ...(body.pagado     !== undefined && { pagado:     body.pagado }),
      ...(body.desc       !== undefined && { desc:       body.desc }),
      ...(body.monto      !== undefined && { monto:      Math.round(body.monto) }),
      ...(body.cat        !== undefined && { cat:        body.cat }),
      ...(body.tipoDoc    !== undefined && { tipoDoc:    body.tipoDoc }),
      ...(body.nroDoc     !== undefined && { nroDoc:     body.nroDoc }),
      ...(body.metodoPago !== undefined && { metodoPago: body.metodoPago }),
      ...(body.tipo       !== undefined && { tipo:       body.tipo }),
      ...(body.fecha      !== undefined && { fecha:      new Date(body.fecha + 'T12:00:00Z') }),
    },
  })
  return Response.json({ ...tx, fecha: tx.fecha.toISOString().split('T')[0] })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.transaccion.delete({ where: { id } })
  return Response.json({ ok: true })
}
