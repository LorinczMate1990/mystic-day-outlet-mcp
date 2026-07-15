import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailHandlerModule } from './email-handler/email-handler.module';
import { EmailNotesModule } from './email-handler/email-notes/email-notes.module';
import { EmailSignatureModule } from './email-handler/email-signature/email-signature.module';
import { McpModule } from './mcp/mcp.module';
import { MailTestModule } from './test/mail/mail-test.module';
import mikroOrmConfig from './mikro-orm.config';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    EmailHandlerModule,
    EmailSignatureModule,
    EmailNotesModule,
    McpModule,
    ...(isProduction ? [] : [MailTestModule]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
