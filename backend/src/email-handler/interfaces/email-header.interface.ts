import { Notes } from '../../notes/interfaces/note.interface';

export interface EmailHeader {
  id: string;
  subject: string;
  from: string[];
  to: string[];
  cc: string[];
  bcc: string[];
  date: Date;
}

export interface EmailHeaderWithNotes extends EmailHeader, Notes {}
