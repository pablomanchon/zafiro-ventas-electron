import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngredientesController } from './ingredientes.controller';
import { IngredientesService } from './ingredientes.service';
import { PlatosController } from './platos.controller';
import { PlatosService } from './platos.service';
import { Ingrediente } from './entities/ingrediente.entity';
import { Plato } from './entities/plato.entity';
import { PlatoIngrediente } from './entities/plato-ingrediente.entity';
import { PlatoSubplato } from './entities/plato-subplato.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ingrediente, Plato, PlatoIngrediente, PlatoSubplato])],
  controllers: [IngredientesController, PlatosController],
  providers: [IngredientesService, PlatosService],
})
export class GastronomiaModule { }
