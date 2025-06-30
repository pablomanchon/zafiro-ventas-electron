import { Test, TestingModule } from '@nestjs/testing';
import { PruebaController } from './prueba.controller';
import { PruebaService } from './prueba.service';

describe('PruebaController', () => {
  let controller: PruebaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PruebaController],
      providers: [PruebaService],
    }).compile();

    controller = module.get<PruebaController>(PruebaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
