import { Test } from '@nestjs/testing'
import { ReservasController } from './reservas.controller'
import { ReservasService } from './reservas.service'

const mockService = {
  findAll: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({ id: '1' }),
}

describe('ReservasController', () => {
  let controller: ReservasController

  beforeEach(async () => {
    jest.clearAllMocks()
    const module = await Test.createTestingModule({
      controllers: [ReservasController],
      providers: [{ provide: ReservasService, useValue: mockService }],
    }).compile()
    controller = module.get(ReservasController)
  })

  it('findAll returns array', async () => {
    expect(await controller.findAll()).toEqual([])
  })

  it('create delegates to service', async () => {
    const dto = { experienciaId: 'exp-1', fecha: '2026-06-20', cantidadPersonas: 2, nombre: 'Test', email: 'test@test.com', telefono: '1234567890' }
    const result = await controller.create(dto as any)
    expect(mockService.create).toHaveBeenCalledWith(dto)
    expect(result).toEqual({ id: '1' })
  })
})
