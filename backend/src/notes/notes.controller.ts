import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { Note } from './entities/note.entity';
import type { UpdateNoteInput } from './interfaces/note.interface';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  async list(): Promise<Note[]> {
    return this.notesService.listAllNotes();
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateNoteInput,
  ): Promise<Note> {
    const numericId = this.parseId(id);
    if (typeof body?.body !== 'string' || !body.body.trim()) {
      throw new BadRequestException('"body" is required');
    }

    return this.notesService.updateNote(numericId, body.body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: true }> {
    const numericId = this.parseId(id);
    await this.notesService.deleteNote(numericId);
    return { success: true };
  }

  private parseId(id: string): number {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException(`"${id}" is not a valid note id`);
    }
    return Number(id);
  }
}
