export interface Note {
  id: number;
  subject: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EmailHeader {
  id: string;
  subject: string;
  from: string[];
  to: string[];
  cc: string[];
  bcc: string[];
  date: string;
  notes: Note[];
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
