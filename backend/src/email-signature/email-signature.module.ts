import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EmailSignature } from './entities/email-signature.entity';
import { EmailSignatureController } from './email-signature.controller';
import { EmailSignatureService } from './email-signature.service';

@Module({
  imports: [MikroOrmModule.forFeature([EmailSignature])],
  controllers: [EmailSignatureController],
  providers: [EmailSignatureService],
  exports: [EmailSignatureService],
})
export class EmailSignatureModule {}
