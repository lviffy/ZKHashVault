import OpenAI from 'openai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    if (!process.env.NVIDIA_API_KEY) {
      return NextResponse.json({ message: "NVIDIA_API_KEY is not set. Please configure it to chat." }, { status: 500 });
    }

    const { messages } = await req.json();

    const apiKey = process.env.NVIDIA_API_KEY.replace(/^"|"$/g, '');

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });

    const completion = await openai.chat.completions.create({
      model: "meta/llama-3.1-8b-instruct", // Typical model on NVIDIA NIM
      messages: [
        { role: "system", content: "You are a helpful DeFi strategy assistant bot for ZKHashVault." },
        ...messages
      ],
      temperature: 0.6,
      top_p: 0.9,
      max_tokens: 1024,
    });

    return NextResponse.json({
      message: completion.choices[0]?.message?.content || "No response received."
    });
  } catch (error: any) {
    console.error("Nvidia Chat API Error:", error);
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 });
  }
}
