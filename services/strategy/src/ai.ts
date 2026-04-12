import OpenAI from 'openai';

import mockAiResponse from './mockAiResponse.json';

export async function askAIForStrategy(
  portfolio: { asset: string; currentAllocationBps: number }[],
  marketRiskLevel: "low" | "medium" | "high" 
) {
  if (!process.env.NVIDIA_API_KEY) {
    console.log("NVIDIA_API_KEY missing, using mock data for UI visual test");
    return mockAiResponse;
  }
  
  const openai = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  });

  const prompt = `You are a world-class DeFi risk analyst bot.
Based on the current market risk (${marketRiskLevel}) and my current portfolio allocaton (in basis points, where 10000 = 100%):
${JSON.stringify(portfolio, null, 2)}

Provide exactly ONE new target allocation suggestion across all these assets such that the total equals 10000 bps. 
Only return valid JSON using the exact asset keys provided. Format your response exactly like this, but dynamically adjust the bps values based on your own allocation logic, do not blindly copy these sample numbers:
{ "allocations": { "Aave USDC Pool": 6500, "Compound avUSD Pool": 3500 }, "reasoning": "Keep it short" }

Do NOT include any markdown blocks. Return strictly the raw JSON string.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "moonshotai/kimi-k2-instruct-0905",
      messages: [{"role":"user","content":prompt}],
      temperature: 0.6,
      top_p: 0.9,
      max_tokens: 4096,
      stream: true
    });
    
    let text = "";
    process.stdout.write("\n[NVIDIA Kimi-K2 Stream]: ");
    for await (const chunk of completion) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        process.stdout.write(delta.content);
        text += delta.content;
      }
    }
    process.stdout.write("\n");
    
    // Parse response
    text = text.replace(/```(json)?\\n/gi, "").replace(/```/gi, "").trim();
    const data = JSON.parse(text || "{}");
    return data;
  } catch (error) {
    console.error("Nvidia AI API failure:", error);
    return null;
  }
}
