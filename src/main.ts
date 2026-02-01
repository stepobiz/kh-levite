import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Serve API from /api
	app.setGlobalPrefix('api');

	// Swagger at /api-docs
	const config = new DocumentBuilder()
		.setTitle('KH Levite API')
		.setDescription('API per gestione impianti e accessi')
		.setVersion('1.0')
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api-docs', app, document, {
		swaggerOptions: { persistAuthorization: true },
	});


	await app.listen(3000);
}
bootstrap();