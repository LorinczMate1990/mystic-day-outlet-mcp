import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import {
  EmailHeader,
  EmailHeaderWithNotes,
} from '../email-handler/interfaces/email-header.interface';
import { Note } from './entities/note.entity';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(
    @InjectRepository(Note)
    private readonly repository: EntityRepository<Note>,
  ) {}

  async addNote(subject: string, body: string): Promise<Note> {
    const normalized = this.normalize(subject);
    if (!normalized) {
      throw new BadRequestException('"subject" is required');
    }
    if (!body.trim()) {
      throw new BadRequestException('"body" is required');
    }

    const note = new Note();
    note.subject = normalized;
    note.body = body;

    await this.repository.getEntityManager().persistAndFlush(note);
    this.logger.log(`Note added for "${normalized}" (id ${note.id})`);
    return note;
  }

  async listAllNotes(): Promise<Note[]> {
    return this.repository.find({}, { orderBy: { createdAt: 'desc' } });
  }

  async updateNote(id: number, body: string): Promise<Note> {
    const note = await this.findByIdOrFail(id);
    note.body = body;
    await this.repository.getEntityManager().persistAndFlush(note);
    this.logger.log(`Note updated (id ${id})`);
    return note;
  }

  async deleteNote(id: number): Promise<void> {
    const note = await this.findByIdOrFail(id);
    await this.repository.getEntityManager().removeAndFlush(note);
    this.logger.log(`Note deleted (id ${id})`);
  }

  private async findByIdOrFail(id: number): Promise<Note> {
    const note = await this.repository.findOne({ id });
    if (!note) {
      throw new NotFoundException(`Note with id "${id}" not found`);
    }
    return note;
  }

  /**
   * Resolves and attaches notes to each header from its `from` address(es) —
   * both the exact address and its domain are matched, in one batched query.
   */
  async attachNotesToHeaders(
    headers: EmailHeader[],
  ): Promise<EmailHeaderWithNotes[]> {
    const subjects = new Set<string>();
    for (const header of headers) {
      for (const address of header.from) {
        const normalized = this.normalize(address);
        if (!normalized) {
          continue;
        }
        subjects.add(normalized);
        const domain = this.domainOf(normalized);
        if (domain) {
          subjects.add(domain);
        }
      }
    }

    if (subjects.size === 0) {
      return headers.map((header) => ({ ...header, notes: [] }));
    }

    const notes = await this.repository.find(
      { subject: { $in: [...subjects] } },
      { orderBy: { createdAt: 'desc' } },
    );
    const bySubject = new Map<string, Note[]>();
    for (const note of notes) {
      const list = bySubject.get(note.subject) ?? [];
      list.push(note);
      bySubject.set(note.subject, list);
    }

    return headers.map((header) => {
      const matched: Note[] = [];
      const seen = new Set<number>();
      for (const address of header.from) {
        const normalized = this.normalize(address);
        if (!normalized) {
          continue;
        }
        const keys = [normalized, this.domainOf(normalized)].filter(
          (key): key is string => !!key,
        );
        for (const key of keys) {
          for (const note of bySubject.get(key) ?? []) {
            if (!seen.has(note.id)) {
              seen.add(note.id);
              matched.push(note);
            }
          }
        }
      }
      matched.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return { ...header, notes: matched };
    });
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }

  private domainOf(address: string): string | undefined {
    const at = address.lastIndexOf('@');
    return at === -1 ? undefined : address.slice(at + 1);
  }
}
