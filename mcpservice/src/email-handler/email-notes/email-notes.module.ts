import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EmailNote } from './entities/email-note.entity';
import { EmailNotesController } from './email-notes.controller';
import { EmailNotesService } from './email-notes.service';

@Module({
  imports: [MikroOrmModule.forFeature([EmailNote])],
  controllers: [EmailNotesController],
  providers: [EmailNotesService],
  exports: [EmailNotesService],
})
export class EmailNotesModule {}
