// src/types/index.ts

export type ProfileKey = 'pentest' | 'osint' | 'ctf' | 'script' | 'aidefense';

export interface ProfileMeta {
  key: ProfileKey;
  label: string;
  color: string;
  desc: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DisplayMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  text: string;
  time: string;
}

export interface ChatResponse {
  reply: string;
  profile: string;
  model: string;
}
