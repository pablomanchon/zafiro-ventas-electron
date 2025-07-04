import { Test, TestingModule } from '@nestjs/testing';
import { CelularService } from './celular.service';

describe('CelularService', () => {
  let service: CelularService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CelularService],
    }).compile();

    service = module.get<CelularService>(CelularService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
