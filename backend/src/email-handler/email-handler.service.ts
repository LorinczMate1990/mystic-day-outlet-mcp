import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FetchMessageObject, ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import MailComposer from 'nodemailer/lib/mail-composer';
import { EmailDetail } from './interfaces/email-detail.interface';
import { EmailHeader } from './interfaces/email-header.interface';
import {
  PushDraftInput,
  PushDraftResult,
} from './interfaces/push-draft.interface';

const MAILBOX = 'INBOX';
const GENERATED_ADDRESS_SUFFIX = '.generated';

interface ReplyHeaders {
  inReplyTo: string;
  references: string;
}

@Injectable()
export class EmailHandlerService {
  private readonly logger = new Logger(EmailHandlerService.name);

  constructor(private readonly configService: ConfigService) {}

  async listEmails(from: Date, to: Date): Promise<EmailHeader[]> {
    this.logger.log(
      `Listing e-mails between ${from.toISOString()} and ${to.toISOString()}`,
    );

    return this.withMailbox(async (client) => {
      const uids = await client.search(
        { since: from, before: to },
        { uid: true },
      );
      if (!uids) {
        this.logger.debug('Search returned no matching UIDs');
        return [];
      }
      this.logger.debug(`Search matched ${uids.length} UID(s)`);

      const headers: EmailHeader[] = [];
      for await (const message of client.fetch(
        uids,
        { envelope: true, uid: true },
        { uid: true },
      )) {
        headers.push(this.toEmailHeader(message));
      }
      this.logger.log(`Fetched ${headers.length} e-mail header(s)`);
      return headers;
    });
  }

  async getEmail(id: string): Promise<EmailDetail> {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException(`"${id}" is not a valid e-mail id`);
    }

    this.logger.log(`Fetching e-mail "${id}"`);

    return this.withMailbox(async (client) => {
      const message = await client.fetchOne(
        id,
        { envelope: true, uid: true, source: true },
        { uid: true },
      );

      if (!message || !message.source) {
        this.logger.warn(`E-mail with id "${id}" not found`);
        throw new NotFoundException(`E-mail with id "${id}" not found`);
      }

      const parsed = await simpleParser(message.source);
      this.logger.debug(
        `Parsed e-mail "${id}": ${parsed.attachments.length} attachment(s)`,
      );

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

  async findEmailsByAddress(address: string): Promise<EmailHeader[]> {
    this.logger.log(`Finding e-mails connected to address "${address}"`);

    return this.withMailbox(async (client) => {
      const uids = await client.search(
        {
          or: [
            { from: address },
            { to: address },
            { cc: address },
            { bcc: address },
          ],
        },
        { uid: true },
      );
      if (!uids) {
        this.logger.debug('Search returned no matching UIDs');
        return [];
      }
      this.logger.debug(`Search matched ${uids.length} UID(s)`);

      const headers: EmailHeader[] = [];
      for await (const message of client.fetch(
        uids,
        { envelope: true, uid: true },
        { uid: true },
      )) {
        headers.push(this.toEmailHeader(message));
      }
      this.logger.log(
        `Fetched ${headers.length} e-mail header(s) connected to "${address}"`,
      );
      return headers;
    });
  }

  async pushDraft(input: PushDraftInput): Promise<PushDraftResult> {
    const from = this.configService.getOrThrow<string>('EMAIL_IMAP_USER');
    const to = input.to.map(
      (address) => `${address}${GENERATED_ADDRESS_SUFFIX}`,
    );
    const draftsMailbox = this.configService.get<string>(
      'EMAIL_DRAFTS_MAILBOX',
      'Drafts',
    );

    this.logger.log(
      `Pushing draft to [${to.join(', ')}]${input.replyTo ? ` (reply to "${input.replyTo}")` : ''}`,
    );

    const replyHeaders = input.replyTo
      ? await this.resolveReplyHeaders(input.replyTo)
      : undefined;
    const subject = replyHeaders
      ? this.withReplyPrefix(input.subject)
      : input.subject;

    const source = await this.buildDraftSource({
      from,
      to,
      subject,
      body: input.body,
      htmlBody: input.htmlBody,
      inReplyTo: replyHeaders?.inReplyTo,
      references: replyHeaders?.references,
    });

    return this.withConnection(async (client) => {
      const response = await client.append(draftsMailbox, source, ['\\Draft']);
      if (!response) {
        throw new Error(`Failed to append draft to "${draftsMailbox}"`);
      }
      this.logger.log(
        `Draft appended to "${response.destination}"${response.uid ? ` (uid ${response.uid})` : ''}`,
      );
      return {
        id: response.uid !== undefined ? String(response.uid) : undefined,
        mailbox: response.destination,
      };
    });
  }

  private async resolveReplyHeaders(id: string): Promise<ReplyHeaders> {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException(`"${id}" is not a valid e-mail id`);
    }

    return this.withMailbox(async (client) => {
      const message = await client.fetchOne(
        id,
        { uid: true, envelope: true, headers: ['references'] },
        { uid: true },
      );

      if (!message) {
        throw new NotFoundException(
          `E-mail with id "${id}" not found, cannot reply to it`,
        );
      }

      const messageId = message.envelope?.messageId;
      if (!messageId) {
        throw new BadRequestException(
          `E-mail with id "${id}" has no Message-ID, cannot reply to it`,
        );
      }

      const existingReferences = this.parseReferencesHeader(message.headers);
      return {
        inReplyTo: messageId,
        references: [...existingReferences, messageId].join(' '),
      };
    });
  }

  private parseReferencesHeader(headers?: Buffer): string[] {
    if (!headers) {
      return [];
    }
    const match = headers
      .toString('utf-8')
      .match(/^References:\s*([\s\S]*?)(?:\r?\n(?!\s)|$)/im);
    if (!match) {
      return [];
    }
    return match[1].match(/<[^>]+>/g) ?? [];
  }

  private withReplyPrefix(subject: string): string {
    return /^re:/i.test(subject.trim()) ? subject : `Re: ${subject}`;
  }

  private async buildDraftSource(options: {
    from: string;
    to: string[];
    subject: string;
    body: string;
    htmlBody?: string;
    inReplyTo?: string;
    references?: string;
  }): Promise<Buffer> {
    const composer = new MailComposer({
      from: options.from,
      to: options.to,
      subject: options.subject,
      text: options.body,
      html: options.htmlBody,
      inReplyTo: options.inReplyTo,
      references: options.references,
    });

    return composer.compile().build();
  }

  private toEmailHeader(message: FetchMessageObject): EmailHeader {
    const envelope = message.envelope;
    return {
      id: String(message.uid),
      subject: envelope?.subject ?? '',
      from: this.toAddressList(envelope?.from),
      to: this.toAddressList(envelope?.to),
      cc: this.toAddressList(envelope?.cc),
      bcc: this.toAddressList(envelope?.bcc),
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
    mailbox: string = MAILBOX,
  ): Promise<T> {
    return this.withConnection(async (client) => {
      const lock = await client.getMailboxLock(mailbox);
      this.logger.debug(`Locked mailbox "${mailbox}"`);
      try {
        return await fn(client);
      } catch (error) {
        this.logger.error(
          `Mailbox operation on "${mailbox}" failed: ${this.describeError(error)}`,
        );
        throw error;
      } finally {
        lock.release();
        this.logger.debug(`Released lock on mailbox "${mailbox}"`);
      }
    });
  }

  private async withConnection<T>(
    fn: (client: ImapFlow) => Promise<T>,
  ): Promise<T> {
    const client = this.createClient();
    const host = this.configService.getOrThrow<string>('EMAIL_IMAP_HOST');
    const port = this.configService.get<number>('EMAIL_IMAP_PORT', 993);

    this.logger.debug(`Connecting to ${host}:${port}`);
    try {
      await client.connect();
    } catch (error) {
      this.logger.error(
        `Failed to connect/authenticate to ${host}:${port}: ${this.describeError(error)}`,
      );
      throw error;
    }
    this.logger.debug(`Connected to ${host}:${port}`);

    try {
      return await fn(client);
    } finally {
      await client.logout();
      this.logger.debug(`Logged out of ${host}:${port}`);
    }
  }

  private describeError(error: unknown): string {
    if (error instanceof Error) {
      const details = (error as { responseText?: string }).responseText;
      return details ? `${error.message} (${details})` : error.message;
    }
    return String(error);
  }

  private createClient(): ImapFlow {
    const debug = this.configService.get<boolean>('EMAIL_IMAP_DEBUG', false);

    return new ImapFlow({
      host: this.configService.getOrThrow<string>('EMAIL_IMAP_HOST'),
      port: this.configService.get<number>('EMAIL_IMAP_PORT', 993),
      secure: this.configService.get<boolean>('EMAIL_IMAP_SECURE', true),
      auth: {
        user: this.configService.getOrThrow<string>('EMAIL_IMAP_USER'),
        pass: this.configService.getOrThrow<string>('EMAIL_IMAP_PASSWORD'),
      },
      logger: debug
        ? {
            debug: (obj: unknown) => this.logger.debug(JSON.stringify(obj)),
            info: (obj: unknown) => this.logger.log(JSON.stringify(obj)),
            warn: (obj: unknown) => this.logger.warn(JSON.stringify(obj)),
            error: (obj: unknown) => this.logger.error(JSON.stringify(obj)),
          }
        : false,
    });
  }
}
