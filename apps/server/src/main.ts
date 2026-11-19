import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global Prefix
  app.setGlobalPrefix('api');

  // Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global Response Transform Interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Swagger (개발 환경에서만)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Dino Park Tycoon API')
      .setDescription('다이노 파크 타이쿤 API 문서')
      .setVersion('0.1.0')
      .addBearerAuth()
      .addTag('auth', '인증')
      .addTag('users', '유저')
      .addTag('parks', '파크')
      .addTag('dinosaurs', '공룡')
      .addTag('buildings', '건물')
      .addTag('great-figures', '위인')
      .addTag('explorations', '탐험')
      .addTag('stories', '스토리')
      .addTag('shop', '상점')
      .addTag('seasons', '시즌')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);

  new Logger('Bootstrap').log(`🦕 Dino Park Tycoon API is running on: http://localhost:${port}`);
  new Logger('Bootstrap').log(`📚 API Docs: http://localhost:${port}/api/docs`);
}

bootstrap();
