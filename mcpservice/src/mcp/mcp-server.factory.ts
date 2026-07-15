import { Injectable, Logger } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { EmailNotesService } from '../email-handler/email-notes/email-notes.service';
import { EmailHandlerService } from '../email-handler/email-handler.service';

const SERVER_NAME = 'mystic-day-outlet-mcp-server';
const SERVER_VERSION = '0.1.0';

@Injectable()
export class McpServerFactory {
  private readonly logger = new Logger(McpServerFactory.name);

  constructor(
    private readonly emailHandlerService: EmailHandlerService,
    private readonly emailNotesService: EmailNotesService,
  ) {}

  createServer(): McpServer {
    const server = new McpServer(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      {
        instructions:
          'This server manages e-mail for the Mystic Day Outlet webshop mailbox. ' +
          'When asked about e-mails for this shop, use list_emails / get_email / ' +
          'find_emails_by_address / push_draft from this server — do not use Gmail ' +
          'or other generic e-mail tools for this mailbox. push_draft only creates ' +
          'a draft (recipients are suffixed with ".generated" so nothing can ever ' +
          'be sent accidentally) — it never sends anything, so it is safe to call ' +
          'directly without human approval. Notes about a sender address or its domain ' +
          '(billing quirks, trust level, special handling instructions, etc.) can be ' +
          'recorded with add_note(subject, body) — subject is either a full e-mail ' +
          'address or a bare domain, and notes are append-only history, never ' +
          'overwritten. There is no lookup tool for notes: list_emails, get_email, and ' +
          'find_emails_by_address already include a "notes" array on every e-mail, ' +
          'auto-resolved from the sender address and its domain — that is always the way ' +
          "to see a sender's notes.",
      },
    );

    this.registerEmailTools(server);
    this.registerNotesTools(server);

    return server;
  }

  private registerEmailTools(server: McpServer): void {
    server.registerTool(
      'list_emails',
      {
        title: 'List e-mails',
        description:
          'List e-mail headers (id, subject, addresses, date) received within a time range.',
        inputSchema: {
          from: z
            .string()
            .describe('Start of the time range, inclusive (ISO 8601 datetime)'),
          to: z
            .string()
            .describe('End of the time range, exclusive (ISO 8601 datetime)'),
        },
      },
      async ({ from, to }) => {
        const fromDate = this.parseDate(from, 'from');
        const toDate = this.parseDate(to, 'to');

        this.logger.log(`Tool "list_emails" called: ${from} .. ${to}`);
        const headers = await this.emailHandlerService.listEmails(
          fromDate,
          toDate,
        );

        return {
          content: [{ type: 'text', text: JSON.stringify(headers, null, 2) }],
        };
      },
    );

    server.registerTool(
      'get_email',
      {
        title: 'Get e-mail',
        description:
          'Get a single e-mail by id: header, text body, and attachment metadata (filename, content type, size - not the raw bytes).',
        inputSchema: {
          id: z.string().describe('The e-mail id, as returned by list_emails'),
        },
      },
      async ({ id }) => {
        this.logger.log(`Tool "get_email" called: id="${id}"`);
        const detail = await this.emailHandlerService.getEmail(id);

        const response = {
          header: detail.header,
          body: detail.body,
          attachments: detail.attachments.map((attachment, index) => ({
            index,
            filename: attachment.filename,
            contentType: attachment.contentType,
            size: attachment.content.length,
          })),
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
      },
    );
    server.registerTool(
      'find_emails_by_address',
      {
        title: 'Find e-mails by address',
        description:
          'List e-mail headers for every e-mail where the given address appears as sender, recipient (To), Cc, or Bcc.',
        inputSchema: {
          address: z.string().describe('The e-mail address to search for'),
        },
      },
      async ({ address }) => {
        this.logger.log(`Tool "find_emails_by_address" called: ${address}`);
        const headers =
          await this.emailHandlerService.findEmailsByAddress(address);

        return {
          content: [{ type: 'text', text: JSON.stringify(headers, null, 2) }],
        };
      },
    );

    server.registerTool(
      'push_draft',
      {
        title: 'Push e-mail draft',
        description:
          "Create a draft e-mail in the mailbox's Drafts folder. Optionally thread it as a reply to an existing e-mail.",
        inputSchema: {
          to: z
            .array(z.string())
            .min(1)
            .describe(
              'Recipient e-mail addresses (before the ".generated" suffix is appended)',
            ),
          subject: z.string().describe('E-mail subject'),
          body: z
            .string()
            .describe(
              'E-mail body (plain text). The configured e-mail signature, if any, is appended automatically — do not add your own signature.',
            ),
          htmlBody: z
            .string()
            .optional()
            .describe(
              'Optional HTML alternative body. When set, the draft is sent as multipart/alternative ' +
                '(both the plain-text body and this HTML get included, so clients that cannot render HTML fall back to text). ' +
                'The configured HTML signature, if any, is appended automatically — do not add your own signature.',
            ),
          replyTo: z
            .string()
            .optional()
            .describe(
              'UID of the e-mail this draft replies to, as returned by list_emails/get_email. ' +
                'When set, In-Reply-To/References headers are set and "Re: " is prefixed to the subject.',
            ),
        },
      },
      async ({ to, subject, body, htmlBody, replyTo }) => {
        this.logger.log(
          `Tool "push_draft" called: to=[${to.join(', ')}]${htmlBody ? ' (with html)' : ''}${replyTo ? ` replyTo="${replyTo}"` : ''}`,
        );
        const result = await this.emailHandlerService.pushDraft({
          to,
          subject,
          body,
          htmlBody,
          replyTo,
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      },
    );
  }

  private registerNotesTools(server: McpServer): void {
    server.registerTool(
      'add_note',
      {
        title: 'Add note',
        description:
          'Append a note about an e-mail address or domain (e.g. billing quirks, trust level). ' +
          'Notes are append-only — this never overwrites prior notes for the same subject, ' +
          'history is preserved and later surfaced most-recent-first.',
        inputSchema: {
          subject: z
            .string()
            .describe(
              'Either a full sender e-mail address (e.g. "foil.style@szamlazz.hu") or a bare domain (e.g. "szamlazz.hu")',
            ),
          body: z.string().min(1).describe('The note text'),
        },
      },
      async ({ subject, body }) => {
        this.logger.log(`Tool "add_note" called: subject="${subject}"`);
        const note = await this.emailNotesService.addEmailNote(subject, body);

        return {
          content: [{ type: 'text', text: JSON.stringify(note, null, 2) }],
        };
      },
    );
  }

  private parseDate(value: string, field: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new Error(
        `"${field}" is not a valid ISO 8601 datetime: "${value}"`,
      );
    }
    return date;
  }
}
