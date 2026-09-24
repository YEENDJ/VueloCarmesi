import 'reflect-metadata'
import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { ThrottlerModule } from '@nestjs/throttler'
import request from 'supertest'
import { ContactoController } from '../contacto/contacto.controller'
import { ContactoService } from '../contacto/contacto.service'
import { LIMITES_FORMULARIOS } from './limite-formularios'

describe('LimiteFormularios', () => {
  let app: INestApplication

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot(LIMITES_FORMULARIOS)],
      controllers: [ContactoController],
      providers: [{ provide: ContactoService, useValue: { create: jest.fn().mockResolvedValue({ id: 'c1' }) } }],
    }).compile()
    app = module.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    await app.init()
  })

  afterEach(() => app.close())

  const enviar = () =>
    request(app.getHttpServer())
      .post('/contacto')
      .send({ nombre: 'Ana', email: 'ana@example.com', mensaje: 'Hola' })

  it('deja pasar cinco envíos por minuto y frena el sexto con 429', async () => {
    for (let i = 0; i < 5; i++) expect((await enviar()).status).toBe(201)
    expect((await enviar()).status).toBe(429)
  })
})
