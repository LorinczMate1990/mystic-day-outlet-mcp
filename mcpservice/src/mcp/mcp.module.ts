import { Module } from '@nestjs/common';
import { EmailNotesModule } from '../email-handler/email-notes/email-notes.module';
import { McpController } from './mcp.controller';
import { McpServerFactory } from './mcp-server.factory';

@Module({
  imports: [EmailNotesModule],
  controllers: [McpController],
  providers: [McpServerFactory],
})
export class McpModule {}
