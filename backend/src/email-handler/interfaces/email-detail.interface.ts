import { EmailHeader } from './email-header.interface';

export interface EmailDetail {
  header: EmailHeader;
  body: string;
  attachments: Buffer[];
}
