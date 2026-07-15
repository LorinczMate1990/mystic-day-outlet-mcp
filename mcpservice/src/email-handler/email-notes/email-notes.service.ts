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
} from '../interfaces/email-header.interface';
import { EmailNote } from './entities/email-note.entity';

@Injectable()
export class EmailNotesService {
  private readonly logger = new Logger(EmailNotesService.name);

  constructor(
    @InjectRepository(EmailNote)
    private readonly repository: EntityRepository<EmailNote>,
  ) {}

  async addEmailNote(subject: string, body: string): Promise<EmailNote> {
    const normalized = this.normalize(subject);
    if (!normalized) {
      throw new BadRequestException('"subject" is required');
    }
    if (!body.trim()) {
      throw new BadRequestException('"body" is required');
    }

    const note = new EmailNote();
    note.subject = normalized;
    note.body = body;

    await this.repository.getEntityManager().persistAndFlush(note);
    this.logger.log(`E-mail note added for "${normalized}" (id ${note.id})`);
    return note;
  }

  async listAllEmailNotes(): Promise<EmailNote[]> {
    return this.repository.find({}, { orderBy: { createdAt: 'desc' } });
  }

  async updateEmailNote(id: number, body: string): Promise<EmailNote> {
    const note = await this.findByIdOrFail(id);
    note.body = body;
    await this.repository.getEntityManager().persistAndFlush(note);
    this.logger.log(`E-mail note updated (id ${id})`);
    return note;
  }

  async deleteEmailNote(id: number): Promise<void> {
    const note = await this.findByIdOrFail(id);
    await this.repository.getEntityManager().removeAndFlush(note);
    this.logger.log(`E-mail note deleted (id ${id})`);
  }

  private async findByIdOrFail(id: number): Promise<EmailNote> {
    const note = await this.repository.findOne({ id });
    if (!note) {
      throw new NotFoundException(`E-mail note with id "${id}" not found`);
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
    const bySubject = new Map<string, EmailNote[]>();
    for (const note of notes) {
      const list = bySubject.get(note.subject) ?? [];
      list.push(note);
      bySubject.set(note.subject, list);
    }

    return headers.map((header) => {
      const matched: EmailNote[] = [];
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
