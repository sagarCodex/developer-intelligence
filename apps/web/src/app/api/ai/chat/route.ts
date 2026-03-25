import { NextRequest } from 'next/server';

const SYSTEM_PROMPT = `You are Developer Intelligence, a personal AI assistant for a senior developer. You have access to their notes, snippets, and daily logs. Help them write code, debug issues, explain concepts, and manage their knowledge base.

Rules:
- Always respond in a concise, technical tone
- Use markdown for code blocks with language tags
- When explaining code, be thorough but not verbose
- If asked to generate a PRD, use a structured format with sections
- For code reviews, focus on bugs, performance, and security
- Keep responses focused and actionable`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: 'ANTHROPIC_API_KEY not configured. Add it to your .env file.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { messages, context } = await req.json();

  // Build context-aware system prompt
  let systemPrompt = SYSTEM_PROMPT;
  if (context) {
    systemPrompt += `\n\nUser's recent context:\n${context}`;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return new Response(
      JSON.stringify({ error: `Claude API error: ${response.status}` }),
      { status: response.status, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Stream the response back
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
