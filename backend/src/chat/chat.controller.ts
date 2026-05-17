// src/chat/chat.controller.ts

import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './chat.dto';

@Controller('api')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('chat')
  @HttpCode(200)
  async chat(@Body() dto: ChatRequestDto) {
    return this.chatService.chat(dto);
  }
}
