import { Test } from '@nestjs/testing'
import { ExperienciasController } from './experiencias.controller'
import { ExperienciasService } from './experiencias.service'

const mockService = {
  findAll: jest.fn().mockResolvedValue([]),
  findBySlug: jest.fn().mockResolvedValue({ id: '1', slug: 'test' }),
  create: jest.fn().mockResolvedValue({ id: '1' }),
}

describe('ExperienciasController', () => {
  let controller: ExperienciasController

  beforeEach(async () => {
    jest.clearAllMocks()
    const module = await Test.createTestingModule({
      controllers: [ExperienciasController],
      providers: [{ provide: ExperienciasService, useValue: mockService }],
    }).compile()
    controller = module.get(ExperienciasController)
  })

  it('findAll returns array', async () => {
    expect(await controller.findAll()).toEqual([])
  })

  it('findBySlug delegates to service', async () => {
    const result = await controller.findBySlug('test')
    expect(mockService.findBySlug).toHaveBeenCalledWith('test')
    expect(result).toEqual({ id: '1', slug: 'test' })
  })
})
