export interface EmailHeader {
  id: string;
  subject: string;
  from: string[];
  to: string[];
  cc: string[];
  date: string;
}

export interface AttachmentSummary {
  index: number;
  filename: string;
  contentType: string;
  size: number;
}

export interface EmailDetail {
  header: EmailHeader;
  body: string;
  attachments: AttachmentSummary[];
}
