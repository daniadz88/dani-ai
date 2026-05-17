// src/chat/chat.dto.ts

export class ChatMessageDto {
  role: 'user' | 'assistant';
  content: string;
}

export class ChatRequestDto {
  message: string;
  profile: string;
  history: ChatMessageDto[];
}

export class ChatResponseDto {
  reply: string;
  profile: string;
  model: string;
}
