import { EmailHeader } from './email-header.interface';

export interface EmailAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
}

export interface EmailDetail {
  header: EmailHeader;
  body: string;
  attachments: EmailAttachment[];
}
