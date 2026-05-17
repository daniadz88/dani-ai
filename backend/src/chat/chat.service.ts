// src/chat/chat.service.ts

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  GROQ_BASE_URL,
  MODEL,
  PROFILES,
  ProfileKey,
  buildMessages,
  ChatMessage,
} from '../config/dani.config';
import { ChatRequestDto, ChatResponseDto } from './chat.dto';

@Injectable()
export class ChatService {
  private getClient(): OpenAI {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
      throw new HttpException(
        'GROQ_API_KEY tidak ditemukan. Set dulu di file .env',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return new OpenAI({ apiKey: key, baseURL: GROQ_BASE_URL });
  }

  async chat(dto: ChatRequestDto): Promise<ChatResponseDto> {
    const { message, profile, history } = dto;

    if (!message?.trim()) {
      throw new HttpException('Message kosong', HttpStatus.BAD_REQUEST);
    }

    const safeProfile: ProfileKey =
      profile in PROFILES ? (profile as ProfileKey) : 'pentest';

    const client = this.getClient();
    const messages = buildMessages(
      history as ChatMessage[],
      message.trim(),
      safeProfile,
    );

    try {
      const completion = await client.chat.completions.create({
        model: MODEL,
        messages,
        max_tokens: 2000,
        temperature: 0.65,
      });

      return {
        reply: completion.choices[0].message.content ?? '',
        profile: safeProfile,
        model: MODEL,
      };
    } catch (err: any) {
      const msg: string = err?.message ?? String(err);
      if (msg.includes('401'))
        throw new HttpException(
          'API Key tidak valid. Cek GROQ_API_KEY di .env',
          HttpStatus.UNAUTHORIZED,
        );
      if (msg.includes('429'))
        throw new HttpException(
          'Rate limit kena. Tunggu sebentar lalu coba lagi.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      throw new HttpException(`Error: ${msg}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
