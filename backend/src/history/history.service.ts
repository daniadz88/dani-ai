import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from './history.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(ChatSession)
    private repo: Repository<ChatSession>,
  ) {}

  async getSessions(userId: string): Promise<ChatSession[]> {
    return this.repo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }

  async getSession(id: string, userId: string): Promise<ChatSession> {
    const session = await this.repo.findOne({ where: { id, userId } });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async createSession(
    userId: string,
    profile: string,
    firstMessage: string,
  ): Promise<ChatSession> {
    const title =
      firstMessage.length > 40
        ? firstMessage.slice(0, 40) + '...'
        : firstMessage;
    const session = this.repo.create({ userId, profile, title, messages: [] });
    return this.repo.save(session);
  }

  async appendMessages(
    id: string,
    userId: string,
    messages: Array<{ role: string; content: string }>,
  ): Promise<ChatSession> {
    const session = await this.getSession(id, userId);
    session.messages = [...session.messages, ...messages];
    return this.repo.save(session);
  }

  async deleteSession(id: string, userId: string): Promise<void> {
    const session = await this.getSession(id, userId);
    await this.repo.remove(session);
  }
}
