import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // O front (Next) roda em outra porta, então precisa de CORS liberado.
  app.enableCors({
    origin: process.env.WEB_ORIGIN?.split(",") ?? "http://localhost:3000",
  });

  // Todo DTO passa por validação e descarta campos não declarados.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const porta = Number(process.env.PORT) || 3001;
  await app.listen(porta);
  console.log(`API do Mercadinho rodando em http://localhost:${porta}`);
}
bootstrap();
