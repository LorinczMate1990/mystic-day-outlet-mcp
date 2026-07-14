import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
} from '@nestjs/common';
import { EmailNotesService } from './email-notes.service';
import { EmailNote } from './entities/email-note.entity';
import type { UpdateEmailNoteInput } from './interfaces/email-note.interface';

@Controller('email-notes')
export class EmailNotesController {
  constructor(private readonly emailNotesService: EmailNotesService) {}

  @Get()
  async list(): Promise<EmailNote[]> {
    return this.emailNotesService.listAllEmailNotes();
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateEmailNoteInput,
  ): Promise<EmailNote> {
    const numericId = this.parseId(id);
    if (typeof body?.body !== 'string' || !body.body.trim()) {
      throw new BadRequestException('"body" is required');
    }

    return this.emailNotesService.updateEmailNote(numericId, body.body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: true }> {
    const numericId = this.parseId(id);
    await this.emailNotesService.deleteEmailNote(numericId);
    return { success: true };
  }

  private parseId(id: string): number {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException(`"${id}" is not a valid e-mail note id`);
    }
    return Number(id);
  }
}
