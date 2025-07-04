import { Test, TestingModule } from '@nestjs/testing';
import { CelularController } from './celular.controller';
import { CelularService } from './celular.service';

describe('CelularController', () => {
  let controller: CelularController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CelularController],
      providers: [CelularService],
    }).compile();

    controller = module.get<CelularController>(CelularController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
