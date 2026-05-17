import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { HistoryService } from './history.service';
import { SupabaseGuard } from '../auth/supabase.guard';

@Controller('api/history')
@UseGuards(SupabaseGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  getSessions(@Req() req: any) {
    return this.historyService.getSessions(req.user.id);
  }

  @Get(':id')
  getSession(@Param('id') id: string, @Req() req: any) {
    return this.historyService.getSession(id, req.user.id);
  }

  @Post()
  createSession(
    @Body() body: { profile: string; firstMessage: string },
    @Req() req: any,
  ) {
    return this.historyService.createSession(
      req.user.id,
      body.profile,
      body.firstMessage,
    );
  }

  @Post(':id/messages')
  appendMessages(
    @Param('id') id: string,
    @Body() body: { messages: Array<{ role: string; content: string }> },
    @Req() req: any,
  ) {
    return this.historyService.appendMessages(id, req.user.id, body.messages);
  }

  @Delete(':id')
  deleteSession(@Param('id') id: string, @Req() req: any) {
    return this.historyService.deleteSession(id, req.user.id);
  }
}
