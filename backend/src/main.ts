import { NestFactory } from '@nestjs/core';
import { MikroORM } from '@mikro-orm/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  });

  const orm = app.get(MikroORM);
  if (process.env.NODE_ENV === 'production') {
    // Production: apply only reviewed, version-controlled migrations.
    await orm.migrator.up();
  } else {
    // Dev: sync the schema straight from current entity metadata, so a hot
    // reload after adding/changing an entity is immediately reflected in the
    // database without hand-writing a migration for it.
    await orm.schema.updateSchema();
  }

  const pendingSchemaChanges = await orm.schema.getUpdateSchemaSQL();
  if (pendingSchemaChanges.trim()) {
    throw new Error(
      'Database schema is out of sync with the entities after startup ' +
        `sync/migration. Pending changes:\n${pendingSchemaChanges}`,
    );
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().then(
  () => undefined,
  (error: unknown) => {
    console.error('Failed to bootstrap application', error);
    process.exit(1);
  },
);
