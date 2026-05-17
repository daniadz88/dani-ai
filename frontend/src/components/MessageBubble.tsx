// src/components/MessageBubble.tsx

import { useState, useCallback } from 'react';
import type { DisplayMessage } from '../types';

interface Props {
  msg: DisplayMessage;
}

function renderText(text: string): string {
  // basic inline code highlight
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

export function MessageBubble({ msg }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard?.writeText(msg.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }, [msg.text]);

  const isUser = msg.type === 'user';
  const isSys  = msg.type === 'system';

  return (
    <div className="msg-block">
      <div className="msg-meta">
        <span className={`m-${msg.type}`}>
          {isUser ? 'lo' : isSys ? 'sistem' : 'dani-ai'}
        </span>
        <span>{msg.time}</span>
      </div>
      <div className="msg-wrap">
        <div
          className={`msg-body mb-${msg.type}`}
          dangerouslySetInnerHTML={{ __html: renderText(msg.text) }}
        />
        {!isSys && (
          <button className={`copy-btn${copied ? ' ok' : ''}`} onClick={copy}>
            {copied ? '✓ ok' : '⎘ copy'}
          </button>
        )}
      </div>
    </div>
  );
}
