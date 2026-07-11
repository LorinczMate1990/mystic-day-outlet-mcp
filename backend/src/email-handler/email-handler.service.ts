import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FetchMessageObject, ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { EmailDetail } from './interfaces/email-detail.interface';
import { EmailHeader } from './interfaces/email-header.interface';

const MAILBOX = 'INBOX';

@Injectable()
export class EmailHandlerService {
  constructor(private readonly configService: ConfigService) {}

  async listEmails(from: Date, to: Date): Promise<EmailHeader[]> {
    return this.withMailbox(async (client) => {
      const uids = await client.search(
        { since: from, before: to },
        { uid: true },
      );
      if (!uids) {
        return [];
      }

      const headers: EmailHeader[] = [];
      for await (const message of client.fetch(uids, {
        envelope: true,
        uid: true,
      })) {
        headers.push(this.toEmailHeader(message));
      }
      return headers;
    });
  }

  async getEmail(id: string): Promise<EmailDetail> {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException(`"${id}" is not a valid e-mail id`);
    }

    return this.withMailbox(async (client) => {
      const message = await client.fetchOne(
        id,
        { envelope: true, uid: true, source: true },
        { uid: true },
      );

      if (!message || !message.source) {
        throw new NotFoundException(`E-mail with id "${id}" not found`);
      }

      const parsed = await simpleParser(message.source);

      return {
        header: this.toEmailHeader(message),
        body: parsed.text ?? '',
        attachments: parsed.attachments.map((attachment) => ({
          filename: attachment.filename ?? 'attachment',
          contentType: attachment.contentType,
          content: attachment.content,
        })),
      };
    });
  }

  private toEmailHeader(message: FetchMessageObject): EmailHeader {
    const envelope = message.envelope;
    return {
      id: String(message.uid),
      subject: envelope?.subject ?? '',
      from: this.toAddressList(envelope?.from),
      to: this.toAddressList(envelope?.to),
      cc: this.toAddressList(envelope?.cc),
      date: envelope?.date ?? new Date(0),
    };
  }

  private toAddressList(addresses?: { address?: string }[]): string[] {
    return (addresses ?? [])
      .map((address) => address.address)
      .filter((address): address is string => !!address);
  }

  private async withMailbox<T>(
    fn: (client: ImapFlow) => Promise<T>,
  ): Promise<T> {
    const client = this.createClient();
    await client.connect();

    try {
      const lock = await client.getMailboxLock(MAILBOX);
      try {
        return await fn(client);
      } finally {
        lock.release();
      }
    } finally {
      await client.logout();
    }
  }

  private createClient(): ImapFlow {
    return new ImapFlow({
      host: this.configService.getOrThrow<string>('EMAIL_IMAP_HOST'),
      port: this.configService.get<number>('EMAIL_IMAP_PORT', 993),
      secure: this.configService.get<boolean>('EMAIL_IMAP_SECURE', true),
      auth: {
        user: this.configService.getOrThrow<string>('EMAIL_IMAP_USER'),
        pass: this.configService.getOrThrow<string>('EMAIL_IMAP_PASSWORD'),
      },
      logger: false,
    });
  }
}
