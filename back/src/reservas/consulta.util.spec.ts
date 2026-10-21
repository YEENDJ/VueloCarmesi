import { vistaPublicaReserva } from './consulta.util'
import { hoyBogota, sumarDias } from './fecha-reserva.util'

const base = {
  id: 'cabc123xyz', estado: 'pendiente', fecha: new Date(`${sumarDias(hoyBogota(), 5)}T00:00:00Z`),
  cantidadPersonas: 2, total: 200000, porcentajeAbono: 30, montoAbono: 60000, venceEn: null,
  createdAt: new Date('2026-10-20T15:00:00Z'), abonoPagadoEn: null, confirmadaEn: null,
  experienciaNombre: 'Ruta del cacao',
  experiencia: { nombre: 'Ruta del cacao', slug: 'ruta-del-cacao', imagen: 'https://x/cacao.jpg' },
  pagos: [] as { referencia: string; estado: string; createdAt: Date }[],
}

describe('vista pública de una reserva', () => {
  it('lleva el código corto, la experiencia y las cifras, sin datos del cliente', () => {
    const v = vistaPublicaReserva(base)
    expect(v).toMatchObject({
      codigo: 'VC-123XYZ', estado: 'pendiente', realizada: false,
      experiencia: { nombre: 'Ruta del cacao', slug: 'ruta-del-cacao' },
      total: 200000, montoAbono: 60000, abonoPagado: false,
    })
    expect(Object.keys(v)).not.toEqual(expect.arrayContaining(['nombre', 'email', 'telefono']))
  })

  it('una confirmada con la fecha pasada sale como realizada', () => {
    const v = vistaPublicaReserva({ ...base, estado: 'confirmada', fecha: new Date(`${sumarDias(hoyBogota(), -1)}T00:00:00Z`) })
    expect(v.realizada).toBe(true)
  })

  it('sin la ficha (se eliminó) queda el nombre copiado y no hay enlace', () => {
    const v = vistaPublicaReserva({ ...base, experiencia: null })
    expect(v.experiencia).toEqual({ nombre: 'Ruta del cacao', slug: null, imagen: null })
  })

  it('el abono cuenta como pagado si hay un pago aprobado, aunque sea anterior a guardar la hora', () => {
    const v = vistaPublicaReserva({ ...base, pagos: [{ referencia: 'R1', estado: 'aprobado', createdAt: base.createdAt }] })
    expect(v.abonoPagado).toBe(true)
    expect(v.referenciaPago).toBe('R1')
  })
})
