import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { EmailSignature } from './entities/email-signature.entity';
import { UpdateEmailSignatureInput } from './interfaces/email-signature.interface';

@Injectable()
export class EmailSignatureService {
  private readonly logger = new Logger(EmailSignatureService.name);

  constructor(
    @InjectRepository(EmailSignature)
    private readonly repository: EntityRepository<EmailSignature>,
  ) {}

  async getSignature(): Promise<EmailSignature | null> {
    return this.repository.findOne({}, { orderBy: { id: 'asc' } });
  }

  async updateSignature(
    input: UpdateEmailSignatureInput,
  ): Promise<EmailSignature> {
    const signature = (await this.getSignature()) ?? new EmailSignature();
    signature.textBody = input.textBody;
    signature.htmlBody = input.htmlBody;

    await this.repository.getEntityManager().persistAndFlush(signature);
    this.logger.log(`E-mail signature updated (id ${signature.id})`);
    return signature;
  }
}
