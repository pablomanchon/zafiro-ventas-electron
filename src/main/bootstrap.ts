import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Si necesitas CORS o rutas estáticas, configúralo aquí:
  // app.enableCors();
  // app.useStaticAssets(join(__dirname, 'public'));

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: ['http://localhost:5173'],    // aquí pones la URL de tu frontend
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,                     // si necesitas enviar cookies o auth
  });
  await app.listen(3000);
  console.log('NestJS API escuchando en http://localhost:3000/api');
}