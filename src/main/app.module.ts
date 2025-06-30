import { Module } from '@nestjs/common';
import { AppController } from './app/app.controller';
import { AppService } from './app/app.service';
// Importa aquí tus controladores y servicios reales:

@Module({
  imports: [],
  controllers: [AppController /*, ...tus otros controladores*/],
  providers: [AppService /*, ...tus otros servicios*/],
})
export class AppModule {}