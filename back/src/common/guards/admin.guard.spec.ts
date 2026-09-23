import 'reflect-metadata'
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common'
import { GUARDS_METADATA } from '@nestjs/common/constants'
import { AdminGuard } from './admin.guard'
import { ReservasController } from '../../reservas/reservas.controller'
import { PedidosController } from '../../pedidos/pedidos.controller'
import { ExperienciasController } from '../../experiencias/experiencias.controller'
import { ProductosController } from '../../productos/productos.controller'
import { SolicitudesGrupoController } from '../../solicitudes-grupo/solicitudes-grupo.controller'
import { SiteConfigController } from '../../site-config/site-config.controller'
import { UploadsController } from '../../uploads/uploads.controller'
import { ContactoController } from '../../contacto/contacto.controller'

const CLAVE = 'k'.repeat(40)

const contexto = (headers: Record<string, string>) =>
  ({ switchToHttp: () => ({ getRequest: () => ({ headers }) }) }) as unknown as ExecutionContext

describe('AdminGuard', () => {
  const guard = new AdminGuard()
  const original = process.env.ADMIN_API_KEY

  beforeEach(() => { process.env.ADMIN_API_KEY = CLAVE })
  afterAll(() => { process.env.ADMIN_API_KEY = original })

  it('deja pasar con la clave correcta', () => {
    expect(guard.canActivate(contexto({ 'x-admin-key': CLAVE }))).toBe(true)
  })

  it('rechaza sin clave', () => {
    expect(() => guard.canActivate(contexto({}))).toThrow(UnauthorizedException)
  })

  it('rechaza una clave equivocada, aunque tenga el mismo largo', () => {
    expect(() => guard.canActivate(contexto({ 'x-admin-key': 'x'.repeat(40) }))).toThrow(UnauthorizedException)
  })

  // El agujero que cerró este guard: la cookie se podía escribir a mano.
  it('ya no acepta la cookie vieja', () => {
    expect(() => guard.canActivate(contexto({ cookie: 'admin_session=authenticated' }))).toThrow(UnauthorizedException)
  })

  it('rechaza todo si ADMIN_API_KEY no está configurada', () => {
    delete process.env.ADMIN_API_KEY
    expect(() => guard.canActivate(contexto({ 'x-admin-key': '' }))).toThrow(UnauthorizedException)
  })

  it('rechaza todo si ADMIN_API_KEY es demasiado corta', () => {
    process.env.ADMIN_API_KEY = 'corta'
    expect(() => guard.canActivate(contexto({ 'x-admin-key': 'corta' }))).toThrow(UnauthorizedException)
  })
})

/**
 * Qué rutas quedan abiertas. Es la lista que hay que mirar dos veces: una ruta
 * nueva sin `@UseGuards(AdminGuard)` es pública, y así fue como reservas y
 * pedidos terminaron entregando datos de clientes a cualquiera. Si agregas un
 * handler, este test falla hasta que decidas en cuál lista va.
 */
describe('rutas protegidas', () => {
  const PUBLICAS: Record<string, string[]> = {
    ReservasController: ['create'],
    PedidosController: ['create'],
    ExperienciasController: ['findAll', 'findBySlug', 'findOne'],
    ProductosController: ['findAll', 'findBySlug', 'findOne'],
    SolicitudesGrupoController: ['create'],
    SiteConfigController: ['getAll'],
    UploadsController: [],
    ContactoController: ['create'],
  }

  const controladores = [
    ReservasController, PedidosController, ExperienciasController, ProductosController,
    SolicitudesGrupoController, SiteConfigController, UploadsController, ContactoController,
  ]

  for (const C of controladores) {
    const handlers = Object.getOwnPropertyNames(C.prototype).filter(n => n !== 'constructor')

    it(`${C.name}: solo lo listado queda público`, () => {
      const abiertas = handlers.filter(h => {
        const handler = (C.prototype as unknown as Record<string, object>)[h]
        const guards: unknown[] = Reflect.getMetadata(GUARDS_METADATA, handler) ?? []
        return !guards.includes(AdminGuard)
      })
      expect(abiertas.sort()).toEqual([...PUBLICAS[C.name]].sort())
    })
  }
})
