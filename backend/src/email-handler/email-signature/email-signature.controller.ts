import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Put,
} from '@nestjs/common';
import { EmailSignatureService } from './email-signature.service';
import { EmailSignature } from './entities/email-signature.entity';
import type { UpdateEmailSignatureInput } from './interfaces/email-signature.interface';

@Controller('email-signature')
export class EmailSignatureController {
  constructor(private readonly emailSignatureService: EmailSignatureService) {}

  @Get()
  async get(): Promise<EmailSignature | null> {
    return this.emailSignatureService.getSignature();
  }

  @Put()
  async update(
    @Body() body: UpdateEmailSignatureInput,
  ): Promise<EmailSignature> {
    if (typeof body?.textBody !== 'string' || !body.textBody.trim()) {
      throw new BadRequestException('"textBody" is required');
    }
    if (body.htmlBody !== undefined && typeof body.htmlBody !== 'string') {
      throw new BadRequestException('"htmlBody" must be a string');
    }

    return this.emailSignatureService.updateSignature({
      textBody: body.textBody,
      htmlBody: body.htmlBody,
    });
  }
}
