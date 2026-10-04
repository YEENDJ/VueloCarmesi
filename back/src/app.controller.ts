import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppController {
  /**
   * Lo llaman las páginas con formulario al abrirse, para que Render despierte
   * mientras el cliente escribe (front/lib/despertar-backend.ts). No toca la
   * base ni el límite de envíos: tiene que responder rápido y sin costo.
   */
  @Get('salud')
  salud() {
    return { ok: true }
  }
}
