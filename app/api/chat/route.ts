import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  SUPPORT_SYSTEM_PROMPT,
  buildAdvisorSystemPrompt,
  AdvisorCatalogItem,
} from '../../../lib/leo-prompts';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Clé Gemini manquante côté serveur.' }, { status: 500 });
  }

  // Les prompts vivent côté serveur : le client n'envoie qu'un mode (+ catalogue
  // pour le conseil boutique). Empêche la lecture/l'injection du prompt système.
  const { messages, mode, catalog, userMessage } = await req.json();

  if (typeof userMessage !== 'string' || !userMessage.trim()) {
    return NextResponse.json({ error: 'Message manquant.' }, { status: 400 });
  }

  const systemPrompt =
    mode === 'advisor'
      ? buildAdvisorSystemPrompt(Array.isArray(catalog) ? (catalog as AdvisorCatalogItem[]) : [])
      : SUPPORT_SYSTEM_PROMPT;

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
