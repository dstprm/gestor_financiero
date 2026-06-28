import { prisma } from '@/lib/db'
import { METODOS_PAGO, CATS_EMPRESA, CATS_PERSONAL } from '@/lib/gestor-constants'

const DEFAULTS = {
  metodos_pago:  METODOS_PAGO,
  cats_empresa:  CATS_EMPRESA,
  cats_personal: CATS_PERSONAL,
}

export async function GET() {
  const rows = await prisma.configuracion.findMany()
  const map: Record<string, string[]> = {}
  for (const row of rows) map[row.clave] = row.valor as string[]
  return Response.json({
    metodosPago:  map['metodos_pago']  ?? DEFAULTS.metodos_pago,
    catsEmpresa:  map['cats_empresa']  ?? DEFAULTS.cats_empresa,
    catsPersonal: map['cats_personal'] ?? DEFAULTS.cats_personal,
  })
}

export async function PUT(req: Request) {
  const body: { clave: string; valor: string[] } = await req.json()
  const row = await prisma.configuracion.upsert({
    where:  { clave: body.clave },
    create: { clave: body.clave, valor: body.valor },
    update: { valor: body.valor },
  })
  return Response.json(row)
}
