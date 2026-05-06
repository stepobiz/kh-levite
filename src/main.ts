import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.useWebSocketAdapter(new IoAdapter(app));

	// Serve API from /api
	app.setGlobalPrefix('api');

	// Enable CORS for all origins
	app.enableCors({ origin: '*' });

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