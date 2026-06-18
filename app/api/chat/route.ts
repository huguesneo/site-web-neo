import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Clé Gemini manquante côté serveur.' }, { status: 500 });
  }

  const { messages, systemPrompt, userMessage } = await req.json();

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
  });

  // Gemini exige que l'historique commence par 'user'
  const rawHistory: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> =
    (messages ?? []).slice(-10).map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));
  const firstUser = rawHistory.findIndex((m) => m.role === 'user');
  const history = firstUser >= 0 ? rawHistory.slice(firstUser) : [];

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(userMessage);
  return NextResponse.json({ text: result.response.text() });
}
