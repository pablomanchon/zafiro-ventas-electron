import { Test, TestingModule } from '@nestjs/testing';
import { GastronomiaController } from './gastronomia.controller';
import { GastronomiaService } from './gastronomia.service';

describe('GastronomiaController', () => {
  let controller: GastronomiaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GastronomiaController],
      providers: [GastronomiaService],
    }).compile();

    controller = module.get<GastronomiaController>(GastronomiaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
