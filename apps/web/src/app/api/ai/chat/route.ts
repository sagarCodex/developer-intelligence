import { NextRequest } from 'next/server';

const SYSTEM_PROMPT = `You are Developer Intelligence, a personal AI assistant for a senior developer. You have access to their notes, snippets, and daily logs. Help them write code, debug issues, explain concepts, and manage their knowledge base.

Rules:
- Always respond in a concise, technical tone
- Use markdown for code blocks with language tags
- When explaining code, be thorough but not verbose
- If asked to generate a PRD, use a structured format with sections
- For code reviews, focus on bugs, performance, and security
- Keep responses focused and actionable`;

type Provider = 'claude' | 'gemini' | 'openai';

interface ChatRequest {
  messages: { role: string; content: string }[];
  provider: Provider;
  apiKey: string;
  model?: string;
  context?: string;
}

// ─── Claude (Anthropic) ──────────────────────────────────
async function streamClaude(apiKey: string, messages: { role: string; content: string }[], systemPrompt: string, model: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  // Transform Claude SSE stream into a uniform text stream
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
          return;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                controller.enqueue(
                  new TextEncoder().encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`),
                );
              }
            } catch {
              // skip
            }
          }
        }
      }
    },
  });
}

// ─── Google Gemini ────────────────────────────────────────
async function streamGemini(apiKey: string, messages: { role: string; content: string }[], systemPrompt: string, model: string) {
  // Convert messages to Gemini format
  const geminiMessages = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiMessages,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { maxOutputTokens: 4096 },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
          return;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                controller.enqueue(
                  new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`),
                );
              }
            } catch {
              // skip
            }
          }
        }
      }
    },
  });
}

// ─── OpenAI (ChatGPT) ────────────────────────────────────
async function streamOpenAI(apiKey: string, messages: { role: string; content: string }[], systemPrompt: string, model: string) {
  const openaiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: openaiMessages,
      max_tokens: 4096,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
          return;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const text = parsed.choices?.[0]?.delta?.content;
              if (text) {
                controller.enqueue(
                  new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`),
                );
              }
            } catch {
              // skip
            }
          }
        }
      }
    },
  });
}

// ─── Default models per provider ──────────────────────────
const DEFAULT_MODELS: Record<Provider, string> = {
  claude: 'claude-sonnet-4-20250514',
  gemini: 'gemini-2.0-flash',
  openai: 'gpt-4o-mini',
};

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { messages, provider, apiKey, model, context } = body;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Please enter your API key in the settings panel.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No messages provided.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    let systemPrompt = SYSTEM_PROMPT;
    if (context) {
      systemPrompt += `\n\nUser's recent context:\n${context}`;
    }

    const selectedModel = model || DEFAULT_MODELS[provider] || DEFAULT_MODELS.claude;

    let stream: ReadableStream;

    switch (provider) {
      case 'gemini':
        stream = await streamGemini(apiKey, messages, systemPrompt, selectedModel);
        break;
      case 'openai':
        stream = await streamOpenAI(apiKey, messages, systemPrompt, selectedModel);
        break;
      case 'claude':
      default:
        stream = await streamClaude(apiKey, messages, systemPrompt, selectedModel);
        break;
    }

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
