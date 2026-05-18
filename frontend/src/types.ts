// src/types.ts

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
  imageUrl?: string;
}

export interface DisplayMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  text: string;
  time: string;
  imageUrl?: string;
  metadata?: {
    image?: string;
    ocrText?: string;
  };
}

export interface ChatResponse {
  reply: string;
  profile: string;
  model: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  created_at: string;
  profile?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
}