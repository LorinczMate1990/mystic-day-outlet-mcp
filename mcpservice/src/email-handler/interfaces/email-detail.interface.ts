import { EmailHeaderWithNotes } from './email-header.interface';

export interface EmailAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
}

export interface EmailDetail {
  header: EmailHeaderWithNotes;
  body: string;
  attachments: EmailAttachment[];
}
