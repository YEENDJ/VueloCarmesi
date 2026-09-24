import { GUARDS_METADATA } from '@nestjs/common/constants'
import { AdminGuard } from '../common/guards/admin.guard'
import { ContactoController } from './contacto.controller'

const guardsDe = (metodo: keyof ContactoController) =>
  Reflect.getMetadata(GUARDS_METADATA, ContactoController.prototype[metodo]) ?? []

describe('ContactoController', () => {
  // Los mensajes llevan nombre, correo y teléfono de quien escribió: leerlos o
  // tocarlos sin la clave de admin sería publicarlos.
  it.each(['findAll', 'updateEstado', 'remove'] as const)('%s exige la clave de admin', metodo => {
    expect(guardsDe(metodo)).toContain(AdminGuard)
  })

  it('el formulario sigue siendo público', () => {
    expect(guardsDe('create')).not.toContain(AdminGuard)
  })
})
