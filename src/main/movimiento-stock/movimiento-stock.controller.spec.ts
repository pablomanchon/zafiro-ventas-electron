import { Test, TestingModule } from '@nestjs/testing';
import { MovimientoStockController } from './movimiento-stock.controller';
import { MovimientoStockService } from './movimiento-stock.service';
import { CreateMovimientoStockDto } from './dto/create-movimiento-stock.dto';

describe('MovimientoStockController', () => {
  let controller: MovimientoStockController;
  let service: MovimientoStockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MovimientoStockController],
      providers: [
        {
          provide: MovimientoStockService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MovimientoStockController>(MovimientoStockController);
    service = module.get<MovimientoStockService>(MovimientoStockService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.create with the right DTO', async () => {
    const dto: CreateMovimientoStockDto = {
      moveType: 'in',
      products: [
        { idProduct: '1', quantity: 5 },
        { idProduct: '2', quantity: 2 },
      ],
    };

    const mockResult = {
      message: 'Movimiento entrada aplicado',
      movimientoId: 1,
      totalProductos: 2,
    };

    jest.spyOn(service, 'create').mockResolvedValue(mockResult);

    const result = await controller.create(dto);
    expect(result).toEqual(mockResult);
    expect(service.create).toHaveBeenCalledWith(dto);
  });
});
