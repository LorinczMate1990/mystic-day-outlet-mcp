import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailSignatureModule } from './email-signature/email-signature.module';
import { EmailNotesModule } from './email-notes/email-notes.module';
import { EmailHandlerService } from './email-handler.service';

@Global()
@Module({
  imports: [ConfigModule, EmailSignatureModule, EmailNotesModule],
  providers: [EmailHandlerService],
  exports: [EmailHandlerService],
})
export class EmailHandlerModule {}
