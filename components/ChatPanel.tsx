'use client'

import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '@/hooks/useStreamChat'

interface Props {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isConnected: boolean;
  disabled?: boolean;
  currentAddress?: string;
}

export default function ChatPanel({
  messages,
  onSendMessage,
  isConnected,
  disabled,
  currentAddress,
}: Props) {
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  useEffect(() => {
    if (isAtBottomRef.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 40;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className='flex h-full flex-col rounded-2xl border border-border bg-panel shadow-panel backdrop-blur'>
      {/* Messages */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className='flex-1 overflow-y-auto p-3 space-y-2'
      >
        {messages.length === 0 && (
          <div className='flex h-full items-center justify-center text-xs text-subtle'>
            {isConnected ? 'No messages yet' : 'Connecting to chat...'}
          </div>
        )}

        {messages.map((msg) => {
          const isMe =
            currentAddress &&
            msg.senderAddress?.toLowerCase() === currentAddress.toLowerCase();

          return (
            <div key={msg.id} className='text-sm leading-relaxed'>
              <span
                className={`font-semibold ${
                  isMe ? 'text-accent' : 'text-info'
                }`}
              >
                {msg.senderName}
              </span>{' '}
              <span className='text-muted'>{msg.text}</span>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <form onSubmit={handleSubmit} className='border-t border-border p-3'>
        <div className='flex gap-2'>
          <input
            className='flex-1 rounded-xl border border-border bg-panel2 px-3 py-2 text-sm text-text placeholder:text-subtle shadow-sm outline-none
                       focus:border-border2 focus:ring-2 focus:ring-ring disabled:opacity-60'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={disabled ? 'Connect wallet to chat' : 'Send a message...'}
            disabled={disabled}
            maxLength={500}
          />

          <button
            type='submit'
            className='rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-glow transition
                       bg-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
            disabled={disabled || !input.trim()}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
