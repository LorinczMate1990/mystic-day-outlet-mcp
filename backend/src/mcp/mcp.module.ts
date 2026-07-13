import { Module } from '@nestjs/common';
import { McpController } from './mcp.controller';
import { McpServerFactory } from './mcp-server.factory';

@Module({
  controllers: [McpController],
  providers: [McpServerFactory],
})
export class McpModule {}
