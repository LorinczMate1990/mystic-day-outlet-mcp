import { Injectable, Logger } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { EmailHandlerService } from '../email-handler/email-handler.service';

const SERVER_NAME = 'mystic-day-outlet-mcp-server';
const SERVER_VERSION = '0.1.0';

@Injectable()
export class McpServerFactory {
  private readonly logger = new Logger(McpServerFactory.name);

  constructor(private readonly emailHandlerService: EmailHandlerService) {}

  createServer(): McpServer {
    const server = new McpServer({
      name: SERVER_NAME,
      version: SERVER_VERSION,
    });

    this.registerEmailTools(server);

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
