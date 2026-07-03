import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailHandlerModule } from './email-handler/email-handler.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), EmailHandlerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
