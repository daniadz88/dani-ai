// src/hooks/useChat.ts

import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, DisplayMessage, ProfileKey } from '../types';
import { sendChat } from '../lib/api';

let msgIdx = 1;
const nowStr = () =>
  new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

export function useChat(initialProfile: ProfileKey = 'pentest') {
  const [profile, setProfileState] = useState<ProfileKey>(initialProfile);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const history = useRef<ChatMessage[]>([]);

  const addDisplay = useCallback((type: DisplayMessage['type'], text: string) => {
    const msg: DisplayMessage = {
      id: `msg-${msgIdx++}`,
      type,
      text,
      time: nowStr(),
    };
    setMessages((prev) => [...prev, msg]);
    return msg.id;
  }, []);

  const switchProfile = useCallback((p: ProfileKey) => {
    setProfileState(p);
    history.current = [];
    addDisplay('system', `Profile diubah ke **${p}**. History direset.`);
  }, [addDisplay]);

  const send = useCallback(
    async (input: string) => {
      const text = input.trim();
      if (!text || isLoading) return;

      addDisplay('user', text);
      setIsLoading(true);

      try {
        const data = await sendChat(text, profile, history.current);

        history.current.push({ role: 'user', content: text });
        history.current.push({ role: 'assistant', content: data.reply });
        if (history.current.length > 20) history.current = history.current.slice(-20);

        addDisplay('ai', data.reply);
      } catch (e: any) {
        addDisplay('system', `❌ ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, profile, addDisplay],
  );

  return { messages, isLoading, profile, switchProfile, send };
}
