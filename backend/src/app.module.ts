import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailHandlerModule } from './email-handler/email-handler.module';
import { McpModule } from './mcp/mcp.module';
import { MailTestModule } from './test/mail/mail-test.module';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EmailHandlerModule,
    McpModule,
    ...(isProduction ? [] : [MailTestModule]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
