'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Card, CardContent, Badge, Input } from '@repo/ui';
import {
  Send,
  Bot,
  User,
  Loader2,
  Trash2,
  Sparkles,
  Settings2,
  Key,
  ChevronDown,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';

type Provider = 'claude' | 'gemini' | 'openai';

interface ProviderConfig {
  id: Provider;
  name: string;
  icon: string;
  color: string;
  placeholder: string;
  models: { id: string; name: string }[];
  keyPrefix: string;
  getKeyUrl: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    icon: '🟣',
    color: 'text-purple-400',
    placeholder: 'sk-ant-...',
    keyPrefix: 'sk-ant-',
    getKeyUrl: 'https://console.anthropic.com/settings/keys',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
      { id: 'claude-haiku-4-20250414', name: 'Claude Haiku 4' },
    ],
  },
  {
    id: 'gemini',
    name: 'Gemini (Google)',
    icon: '🔵',
    color: 'text-blue-400',
    placeholder: 'AIza...',
    keyPrefix: 'AIza',
    getKeyUrl: 'https://aistudio.google.com/apikey',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-2.5-pro-preview-05-06', name: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash' },
    ],
  },
  {
    id: 'openai',
    name: 'ChatGPT (OpenAI)',
    icon: '🟢',
    color: 'text-green-400',
    placeholder: 'sk-...',
    keyPrefix: 'sk-',
    getKeyUrl: 'https://platform.openai.com/api-keys',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
      { id: 'gpt-4.1', name: 'GPT-4.1' },
    ],
  },
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Persist provider config in localStorage
function loadConfig(): { provider: Provider; apiKey: string; model: string } {
  if (typeof window === 'undefined') return { provider: 'claude', apiKey: '', model: '' };
  try {
    const saved = localStorage.getItem('di-ai-config');
    if (saved) return JSON.parse(saved);
  } catch {}
  return { provider: 'claude', apiKey: '', model: '' };
}

function saveConfig(config: { provider: Provider; apiKey: string; model: string }) {
  try {
    localStorage.setItem('di-ai-config', JSON.stringify(config));
  } catch {}
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Provider config
  const [provider, setProvider] = useState<Provider>('claude');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [configLoaded, setConfigLoaded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load config from localStorage on mount
  useEffect(() => {
    const config = loadConfig();
    setProvider(config.provider);
    setApiKey(config.apiKey);
    setModel(config.model);
    setConfigLoaded(true);
  }, []);

  // Save config on change
  useEffect(() => {
    if (configLoaded) {
      saveConfig({ provider, apiKey, model });
    }
  }, [provider, apiKey, model, configLoaded]);

  const activeProvider = PROVIDERS.find((p) => p.id === provider) || PROVIDERS[0];
  const activeModel = model || activeProvider.models[0].id;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = async () => {
    if (!input.trim() || isStreaming) return;

    if (!apiKey) {
      setShowSettings(true);
      return;
    }

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
          provider,
          apiKey,
          model: activeModel,
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
                if (parsed.text) {
                  fullContent += parsed.text;
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
            ? { ...m, content: 'Error: Failed to connect to AI service. Check your API key and try again.' }
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

  const maskedKey = apiKey
    ? `${apiKey.slice(0, 6)}${'•'.repeat(Math.max(0, apiKey.length - 10))}${apiKey.slice(-4)}`
    : '';

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
              <span className="text-[10px] text-text-secondary font-mono">
                {activeProvider.icon} {activeProvider.name} • {activeProvider.models.find((m) => m.id === activeModel)?.name || activeModel}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          )}
          <Button
            variant={apiKey ? 'ghost' : 'default'}
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="h-4 w-4" />
            {apiKey ? '' : 'Set API Key'}
          </Button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <Card variant="elevated" className="mb-4 relative">
          <button
            onClick={() => setShowSettings(false)}
            className="absolute top-3 right-3 text-text-muted hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-mono text-sm font-semibold text-text-primary flex items-center gap-2">
              <Key className="h-4 w-4 text-accent" />
              AI Provider Settings
            </h3>

            {/* Provider selector */}
            <div className="space-y-2">
              <label className="text-xs text-text-secondary font-mono">Provider</label>
              <div className="flex gap-2">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setProvider(p.id);
                      setModel(''); // Reset model when switching provider
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md font-mono text-xs transition-colors ${
                      provider === p.id
                        ? 'bg-accent-muted text-accent border border-accent'
                        : 'bg-surface border border-border text-text-secondary hover:border-border-hover'
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span>{p.id === 'claude' ? 'Claude' : p.id === 'gemini' ? 'Gemini' : 'ChatGPT'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Model selector */}
            <div className="space-y-2">
              <label className="text-xs text-text-secondary font-mono">Model</label>
              <div className="flex gap-2 flex-wrap">
                {activeProvider.models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className={`px-3 py-1.5 rounded-md font-mono text-xs transition-colors ${
                      activeModel === m.id
                        ? 'bg-accent-muted text-accent border border-accent'
                        : 'bg-surface border border-border text-text-secondary hover:border-border-hover'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            {/* API Key input */}
            <div className="space-y-2">
              <label className="text-xs text-text-secondary font-mono flex items-center justify-between">
                <span>API Key</span>
                <a
                  href={activeProvider.getKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Get a key →
                </a>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={activeProvider.placeholder}
                    className="w-full h-10 rounded-md border border-border bg-surface px-3 pr-10 text-sm font-mono text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-text-muted font-mono">
                🔒 Your API key is stored locally in your browser. It is never sent to our servers — only directly to {activeProvider.name}.
              </p>
            </div>

            {apiKey && (
              <div className="flex items-center gap-2 pt-1">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-xs text-accent font-mono">Ready — key configured</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
            <p className="text-sm text-text-secondary mb-4 max-w-md">
              I can help you write code, debug issues, explain concepts, generate PRDs, and more.
            </p>
            {!apiKey && (
              <button
                onClick={() => setShowSettings(true)}
                className="mb-6 flex items-center gap-2 px-4 py-2 rounded-lg border border-accent bg-accent-muted text-accent text-xs font-mono hover:bg-accent/20 transition-colors"
              >
                <Key className="h-3.5 w-3.5" />
                Set up your API key to get started
              </button>
            )}
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
            placeholder={apiKey ? 'Ask anything... (Shift+Enter for new line)' : 'Set your API key first →'}
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
            {activeProvider.icon} {activeProvider.models.find((m) => m.id === activeModel)?.name || activeModel}
            {apiKey ? ' • Key set' : ' • No key'}
          </span>
          <span className="text-[10px] text-text-muted font-mono">
            Enter to send, Shift+Enter for new line
          </span>
        </div>
      </div>
    </div>
  );
}
