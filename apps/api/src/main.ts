import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use('/webhooks/stripe', bodyParser.raw({ type: 'application/json' }));
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.enableCors({ origin: true, credentials: true });
  await app.listen(process.env.PORT || 3001);
}

bootstrap();
