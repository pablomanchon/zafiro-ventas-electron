import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app/app.controller';
import { AppService } from './app/app.service';
import { PruebaModule } from './prueba/prueba.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,      // en dev sincroniza esquema
      autoLoadEntities: true, // carga entities de cada módulo
    }),
    PruebaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
