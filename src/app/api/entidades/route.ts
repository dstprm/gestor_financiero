import { prisma } from '@/lib/db'

export async function GET() {
  const entidades = await prisma.entidad.findMany({ orderBy: { orden: 'asc' } })
  return Response.json(entidades)
}

export async function POST(req: Request) {
  const body = await req.json()
  const entidad = await prisma.entidad.create({
    data: {
      nombre: body.nombre,
      tipo: body.tipo,
      color: body.color ?? '#2a78d6',
      orden: body.orden ?? 0,
    },
  })
  return Response.json(entidad, { status: 201 })
}
