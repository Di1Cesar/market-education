import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // O front (Next) roda em outra porta, então precisa de CORS liberado.
  // Também aceita qualquer subdomínio ngrok, já que a URL pública muda a cada túnel novo.
  const origensFixas = process.env.WEB_ORIGIN?.split(",") ?? ["http://localhost:3000"];
  app.enableCors({
    origin: (origin, callback) => {
      const permitido =
        !origin ||
        origensFixas.includes(origin) ||
        /^https:\/\/.*\.ngrok(-free)?\.app$/.test(origin);
      callback(permitido ? null : new Error("Origem não permitida pelo CORS"), permitido);
    },
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
