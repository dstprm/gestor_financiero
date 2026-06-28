import { prisma } from '@/lib/db'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const entidad = await prisma.entidad.update({
    where: { id },
    data: {
      ...(body.nombre !== undefined && { nombre: body.nombre }),
      ...(body.color  !== undefined && { color:  body.color  }),
      ...(body.orden  !== undefined && { orden:  body.orden  }),
    },
  })
  return Response.json(entidad)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.transaccion.deleteMany({ where: { entidadId: id } })
  await prisma.entidad.delete({ where: { id } })
  return Response.json({ ok: true })
}
