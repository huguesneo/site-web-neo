import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Clé Gemini manquante côté serveur.' }, { status: 500 });
  }

  const { prompt } = await req.json();

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });

  const res = await model.generateContent(prompt);
  const raw = res.response.text().trim().replace(/^```json\s*/i, '').replace(/```$/i, '');
  return NextResponse.json({ result: JSON.parse(raw) });
}
