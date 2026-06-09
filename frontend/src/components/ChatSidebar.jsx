/**
 * ChatSidebar.jsx
 * Real-time text chat sidebar synced over PeerJS data connection.
 */
import React, { useEffect, useRef, useState } from 'react';

function ChatMessage({ msg }) {
  return (
    <div className={`flex flex-col max-w-[85%] animate-fade-in ${msg.own ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
      <div
        className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
          msg.own ? 'chat-bubble-own rounded-br-sm' : 'chat-bubble-other rounded-bl-sm'
        }`}
      >
        {msg.text}
      </div>
      <span className="text-chess-muted text-[10px] mt-1 px-1 font-mono">
        {msg.time}
      </span>
    </div>
  );
}

export default function ChatSidebar({ messages, onSend, disabled }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full glass-panel overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-chess-border flex items-center gap-2 flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-chess-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h3 className="text-sm font-semibold text-white">Chat</h3>
        <span className="ml-auto text-xs text-chess-muted font-mono">
          {messages.length} msg{messages.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <span className="text-4xl mb-3">💬</span>
            <p className="text-chess-muted text-sm">No messages yet.</p>
            <p className="text-chess-muted/60 text-xs mt-1">Say hello to your opponent!</p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-chess-border flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            id="chat-input"
            className="input-field resize-none min-h-[40px] max-h-24 py-2.5 leading-snug flex-1"
            placeholder={disabled ? 'Connect to chat...' : 'Type a message...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
          />
          <button
            id="chat-send-btn"
            className={`btn-primary py-2.5 px-3 flex-shrink-0 ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            onClick={handleSend}
            disabled={disabled || !input.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-chess-muted/50 text-[10px] mt-1.5 text-right">Enter to send</p>
      </div>
    </div>
  );
}
