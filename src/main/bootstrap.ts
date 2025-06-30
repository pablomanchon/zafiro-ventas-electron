import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Si necesitas CORS o rutas estáticas, configúralo aquí:
  // app.enableCors();
  // app.useStaticAssets(join(__dirname, 'public'));

  // Prefijo global opcional para tu API
  app.setGlobalPrefix('api');

  await app.listen(3000);
  console.log('NestJS API escuchando en http://localhost:3000/api');
}