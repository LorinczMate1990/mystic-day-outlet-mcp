import { Note } from '../entities/note.entity';

export interface CreateNoteInput {
  subject: string;
  body: string;
}

export interface UpdateNoteInput {
  body: string;
}

export interface Notes {
  notes: Note[];
}
