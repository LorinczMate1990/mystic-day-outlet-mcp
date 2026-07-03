import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailHandlerService } from './email-handler.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EmailHandlerService],
  exports: [EmailHandlerService],
})
export class EmailHandlerModule {}
