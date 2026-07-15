import { Controller, Delete, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpServerFactory } from './mcp-server.factory';

const METHOD_NOT_ALLOWED_BODY = {
  jsonrpc: '2.0',
  error: {
    code: -32000,
    message:
      'Method not allowed. This server only supports stateless POST requests.',
  },
  id: null,
};

@Controller('mcp')
export class McpController {
  constructor(private readonly mcpServerFactory: McpServerFactory) {}

  @Post()
  async handlePost(@Req() req: Request, @Res() res: Response): Promise<void> {
    // Stateless mode: a fresh server + transport per request avoids request-id
    // collisions between concurrent clients and keeps this endpoint simple.
    const server = this.mcpServerFactory.createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on('close', () => {
      void transport.close();
      void server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  }

  @Get()
  handleGet(@Res() res: Response): void {
    res.status(405).json(METHOD_NOT_ALLOWED_BODY);
  }

  @Delete()
  handleDelete(@Res() res: Response): void {
    res.status(405).json(METHOD_NOT_ALLOWED_BODY);
  }
}
