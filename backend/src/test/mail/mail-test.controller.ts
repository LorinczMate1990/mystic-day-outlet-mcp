import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { EmailHandlerService } from '../../email-handler/email-handler.service';
import { EmailHeader } from '../../email-handler/interfaces/email-header.interface';

interface AttachmentSummary {
  index: number;
  filename: string;
  contentType: string;
  size: number;
}

interface EmailDetailResponse {
  header: EmailHeader;
  body: string;
  attachments: AttachmentSummary[];
}

@Controller('test/mail')
export class MailTestController {
  constructor(private readonly emailHandlerService: EmailHandlerService) {}

  @Get('list')
  async list(
    @Query('from') from: string,
    @Query('to') to: string,
  ): Promise<EmailHeader[]> {
    const fromDate = this.parseDate(from, 'from');
    const toDate = this.parseDate(to, 'to');
    return this.emailHandlerService.listEmails(fromDate, toDate);
  }

  @Get('by-address')
  async findByAddress(
    @Query('address') address: string,
  ): Promise<EmailHeader[]> {
    if (!address) {
      throw new BadRequestException('Query parameter "address" is required');
    }
    return this.emailHandlerService.findEmailsByAddress(address);
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<EmailDetailResponse> {
    const detail = await this.emailHandlerService.getEmail(id);
    return {
      header: detail.header,
      body: detail.body,
      attachments: detail.attachments.map((attachment, index) => ({
        index,
        filename: attachment.filename,
        contentType: attachment.contentType,
        size: attachment.content.length,
      })),
    };
  }

  @Get(':id/attachments/:index')
  async downloadAttachment(
    @Param('id') id: string,
    @Param('index') index: string,
    @Res() res: Response,
  ): Promise<void> {
    const detail = await this.emailHandlerService.getEmail(id);
    const attachment = detail.attachments[Number(index)];

    if (!attachment) {
      throw new NotFoundException(
        `Attachment "${index}" not found on e-mail "${id}"`,
      );
    }

    res.setHeader('Content-Type', attachment.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(attachment.filename)}"`,
    );
    res.send(attachment.content);
  }

  private parseDate(value: string | undefined, field: string): Date {
    if (!value) {
      throw new BadRequestException(`Query parameter "${field}" is required`);
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(
        `Query parameter "${field}" is not a valid date`,
      );
    }
    return date;
  }
}
