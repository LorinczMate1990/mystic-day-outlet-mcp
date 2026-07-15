import { EmailNote } from '../entities/email-note.entity';

export interface CreateEmailNoteInput {
  subject: string;
  body: string;
}

export interface UpdateEmailNoteInput {
  body: string;
}

export interface EmailNotes {
  notes: EmailNote[];
}
