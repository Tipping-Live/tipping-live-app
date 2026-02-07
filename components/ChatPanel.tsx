'use client'

import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '@/hooks/useStreamChat'

interface Props {
  messages: ChatMessage[]
  onSendMessage: (text: string) => void
  isConnected: boolean
  disabled?: boolean
  currentAddress?: string
}

export default function ChatPanel({ messages, onSendMessage, isConnected, disabled, currentAddress }: Props) {
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  // Auto-scroll when new messages arrive (only if user is at bottom)
  useEffect(() => {
    if (isAtBottomRef.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const handleScroll = () => {
    if (!listRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = listRef.current
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 40
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || disabled) return
    onSendMessage(input)
    setInput('')
  }

  return (
    <div className="flex h-full flex-col">
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-2"
      >
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-xs text-white/30">
            {isConnected ? 'No messages yet' : 'Connecting to chat...'}
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm leading-relaxed">
            <span
              className={`font-semibold ${
                msg.senderAddress === currentAddress
                  ? 'text-violet-400'
                  : 'text-sky-400'
              }`}
            >
              {msg.senderName}
            </span>{' '}
            <span className="text-white/80">{msg.text}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-white/10 p-3">
        <div className="flex gap-2">
          <input
            className="input flex-1 text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={disabled ? 'Connect wallet to chat' : 'Send a message...'}
            disabled={disabled}
            maxLength={500}
          />
          <button
            type="submit"
            className="btn-primary text-sm px-4"
            disabled={disabled || !input.trim()}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
