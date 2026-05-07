import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = (process.env.FRONTEND_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const port = Number(process.env.PORT ?? 3000);

  app.enableCors({
    origin: allowedOrigins,
  });

  await app.listen(port);
}

void bootstrap();
