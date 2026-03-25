'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Card, CardContent, Badge } from '@repo/ui';
import { Send, Bot, User, Loader2, Trash2, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsStreaming(true);

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages([...updatedMessages, assistantMessage]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: `Error: ${error.error || 'Failed to get response'}` }
              : m,
          ),
        );
        setIsStreaming(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  fullContent += parsed.delta.text;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessage.id ? { ...m, content: fullContent } : m,
                    ),
                  );
                }
              } catch {
                // Skip non-JSON lines
              }
            }
          }
        }
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: 'Error: Failed to connect to AI service. Check your ANTHROPIC_API_KEY.' }
            : m,
        ),
      );
    }

    setIsStreaming(false);
  };

  const handleClear = () => {
    setMessages([]);
  };

  const suggestions = [
    'Explain this code snippet',
    'Generate a PRD for my idea',
    'Help me debug an issue',
    'Review my code for best practices',
    'Summarize my recent notes',
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent-muted flex items-center justify-center">
            <Bot className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="font-mono text-lg font-bold text-text-primary">Developer_Intelligence</h1>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="text-[10px] text-text-secondary font-mono">AI Assistant</span>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-16 w-16 rounded-2xl bg-accent-muted flex items-center justify-center mb-6">
              <Sparkles className="h-8 w-8 text-accent" />
            </div>
            <h2 className="font-mono text-xl font-bold text-text-primary mb-2">
              How can I help?
            </h2>
            <p className="text-sm text-text-secondary mb-8 max-w-md">
              I can help you write code, debug issues, explain concepts, generate PRDs, and more.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                    inputRef.current?.focus();
                  }}
                  className="px-3 py-2 rounded-lg border border-border bg-surface text-xs font-mono text-text-secondary hover:border-accent hover:text-accent transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 h-7 w-7 rounded-md bg-accent-muted flex items-center justify-center mt-1">
                  <Bot className="h-4 w-4 text-accent" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-accent text-bg'
                    : 'bg-surface border border-border'
                }`}
              >
                <div
                  className={`text-sm font-mono whitespace-pre-wrap break-words ${
                    message.role === 'user' ? '' : 'text-text-primary'
                  }`}
                >
                  {message.content || (
                    <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
                  )}
                </div>
                <span
                  className={`text-[9px] mt-1 block ${
                    message.role === 'user' ? 'text-bg/60' : 'text-text-muted'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0 h-7 w-7 rounded-md bg-surface-hover flex items-center justify-center mt-1">
                  <User className="h-4 w-4 text-text-secondary" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border border-border rounded-lg bg-surface p-3">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask anything... (Shift+Enter for new line)"
            rows={1}
            className="flex-1 bg-transparent text-sm font-mono text-text-primary placeholder:text-text-muted resize-none focus:outline-none min-h-[40px] max-h-[120px]"
            style={{ height: 'auto', overflow: 'hidden' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!input.trim() || isStreaming}
            className="self-end"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
          <span className="text-[10px] text-text-muted font-mono">
            Powered by Claude Sonnet 4.6
          </span>
          <span className="text-[10px] text-text-muted font-mono">
            Enter to send, Shift+Enter for new line
          </span>
        </div>
      </div>
    </div>
  );
}
