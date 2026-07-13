import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailSignatureModule } from '../email-signature/email-signature.module';
import { EmailHandlerService } from './email-handler.service';

@Global()
@Module({
  imports: [ConfigModule, EmailSignatureModule],
  providers: [EmailHandlerService],
  exports: [EmailHandlerService],
})
export class EmailHandlerModule {}
