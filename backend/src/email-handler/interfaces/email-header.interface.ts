export interface EmailHeader {
  id: string;
  subject: string;
  from: string[];
  to: string[];
  cc: string[];
  bcc: string[];
  date: Date;
}
