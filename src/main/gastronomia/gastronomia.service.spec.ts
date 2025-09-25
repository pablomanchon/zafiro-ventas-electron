import { Test, TestingModule } from '@nestjs/testing';
import { GastronomiaService } from './gastronomia.service';

describe('GastronomiaService', () => {
  let service: GastronomiaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GastronomiaService],
    }).compile();

    service = module.get<GastronomiaService>(GastronomiaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
