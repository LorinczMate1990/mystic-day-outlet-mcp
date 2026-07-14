import { Module } from '@nestjs/common';
import { NotesModule } from '../notes/notes.module';
import { McpController } from './mcp.controller';
import { McpServerFactory } from './mcp-server.factory';

@Module({
  imports: [NotesModule],
  controllers: [McpController],
  providers: [McpServerFactory],
})
export class McpModule {}
