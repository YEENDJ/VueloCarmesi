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
    const result = await controller.create({ experimentId: 'exp-1', date: '2026-06-20' })
    expect(mockService.create).toHaveBeenCalled()
    expect(result).toEqual({ id: '1' })
  })
})
