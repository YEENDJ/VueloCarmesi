import { Test } from '@nestjs/testing'
import { ConflictException } from '@nestjs/common'
import { ProductosService } from '../productos/productos.service'
import { ExperienciasService } from '../experiencias/experiencias.service'
import { PrismaService } from '../prisma.service'
import { SincronizadorTraduccion } from '../traduccion/sincronizador.service'
import { HistorialSlugs } from '../slugs/historial-slugs.service'
import { PEDIDO_EN_CURSO, motivoBloqueo } from './borrado-con-historial'

const tx = {
  $queryRaw: jest.fn(),
  pedido: { findMany: jest.fn() },
  reserva: { findMany: jest.fn() },
  producto: { delete: jest.fn() },
  experiencia: { delete: jest.fn() },
}
const prisma = {
  $transaction: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)),
  producto: { findUnique: jest.fn().mockResolvedValue({ id: 'p1' }) },
  experiencia: { findUnique: jest.fn().mockResolvedValue({ id: 'e1' }) },
  // La consulta previa del panel va fuera de transacción.
  pedido: tx.pedido,
  reserva: tx.reserva,
}

async function servicios() {
  const module = await Test.createTestingModule({
    providers: [
      ProductosService, ExperienciasService,
      { provide: PrismaService, useValue: prisma },
      { provide: SincronizadorTraduccion, useValue: {} },
      { provide: HistorialSlugs, useValue: {} },
    ],
  }).compile()
  return { productos: module.get(ProductosService), experiencias: module.get(ExperienciasService) }
}

beforeEach(() => jest.clearAllMocks())

describe('eliminar producto', () => {
  it('se borra si sus pedidos ya cerraron: el historial queda con la copia', async () => {
    tx.pedido.findMany.mockResolvedValue([])
    const { productos } = await servicios()
    await productos.remove('p1')
    expect(tx.pedido.findMany.mock.calls[0][0].where).toEqual({
      estado: { in: PEDIDO_EN_CURSO }, items: { some: { productoId: 'p1' } },
    })
    expect(tx.producto.delete).toHaveBeenCalledWith({ where: { id: 'p1' } })
  })

  it('no se borra con pedidos sin despachar, y dice cuáles', async () => {
    tx.pedido.findMany.mockResolvedValue([{ id: 'cabc123xyz', estado: 'pagado' }])
    const { productos } = await servicios()
    const err = await productos.remove('p1').catch(e => e)
    expect(err).toBeInstanceOf(ConflictException)
    expect(err.message).toContain('VC-123XYZ (pagado, sin enviar)')
    expect(tx.producto.delete).not.toHaveBeenCalled()
  })
})

describe('consulta previa del panel', () => {
  it('da el motivo sin borrar nada', async () => {
    tx.pedido.findMany.mockResolvedValue([{ id: 'cabc123xyz', estado: 'pendiente_pago' }])
    const { productos } = await servicios()
    const b = await productos.bloqueoBorrado('p1')
    expect(b.motivo).toContain('VC-123XYZ (esperando pago)')
    expect(b).toMatchObject({
      resumen: 'Tiene 1 pedido sin despachar. Despáchalos o cancélalos y vuelve a intentarlo.',
      pendientes: [{ id: 'cabc123xyz', etiqueta: 'VC-123XYZ', estado: 'esperando pago' }],
      restantes: 0,
    })
    expect(tx.producto.delete).not.toHaveBeenCalled()
  })

  it('da nulo si se puede borrar', async () => {
    tx.reserva.findMany.mockResolvedValue([])
    const { experiencias } = await servicios()
    expect(await experiencias.bloqueoBorrado('e1')).toEqual({ motivo: null })
  })
})

describe('eliminar experiencia', () => {
  it('no se borra con reservas por atender', async () => {
    tx.reserva.findMany.mockResolvedValue([
      { nombre: 'Ana', fecha: new Date('2026-11-02T00:00:00Z'), estado: 'confirmada' },
    ])
    const { experiencias } = await servicios()
    const err = await experiencias.remove('e1').catch(e => e)
    expect(err).toBeInstanceOf(ConflictException)
    expect(err.message).toContain('Ana, 2026-11-02 (confirmada)')
    expect(tx.experiencia.delete).not.toHaveBeenCalled()
  })

  it('se borra si sus reservas ya pasaron o se cancelaron', async () => {
    tx.reserva.findMany.mockResolvedValue([])
    const { experiencias } = await servicios()
    await experiencias.remove('e1')
    expect(tx.experiencia.delete).toHaveBeenCalledWith({ where: { id: 'e1' } })
  })
})

describe('motivoBloqueo', () => {
  it('lista hasta cinco y resume el resto', () => {
    const filas = Array.from({ length: 7 }, (_, i) => ({ etiqueta: `VC-${i}`, estado: 'pendiente' }))
    const texto = motivoBloqueo('pedidos sin despachar', 'Despáchalos.', filas)
    expect(texto).toContain('tiene 7 pedidos sin despachar')
    expect(texto).toContain('VC-4 (pendiente) y 2 más')
    expect(texto).not.toContain('VC-5')
  })
})
