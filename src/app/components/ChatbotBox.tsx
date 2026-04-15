"use client";

import { useState } from "react";

export function ChatbotBox() {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    { role: "ai", content: "Optimizing your portfolio for yield is a great goal. At ZKHashVault, we offer a range of strategies to help you maximize returns while minimizing risk. To get started, can you tell me a bit more about your current portfolio and preferences? For example: 1. What type of assets do you currently hold (e.g., stablecoins, DeFi tokens, NFTs)? 2. What is your risk tolerance (e.g., conservative, moderate, aggressive)? 3. Are you interested in exploring specific DeFi protocols or strategies (e.g., lending, farming, staking)? 4. Do you have any specific yield targets or return expectations? This information will help me provide you with tailored recommendations and strategies to optimize your portfolio for yield." },
  ]);
  const [input, setInput] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMessage = input;
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // send history formatted for OpenAI messages
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content }))
        })
      });
      
      const data = await response.json();
      
      setMessages(prev => [
        ...prev, 
        { role: "ai", content: data.message || "Apologies, I could not process that request." }
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev, 
        { role: "ai", content: "There was an error communicating with the AI service." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm sm:col-span-2 flex flex-col h-[500px]">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">AI Strategy Assistant</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 flex flex-col">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-5 py-4 text-[14px] leading-relaxed ${
              msg.role === "user" 
                ? "bg-[#068f5c] text-white rounded-2xl rounded-tr-sm" 
                : "bg-slate-100 text-slate-700 rounded-2xl rounded-tl-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      
      <div className="px-6 py-5 border-t border-slate-100 pb-6">
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask about your strategy or request adjustments..."
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#76cba3] focus:ring-1 focus:ring-[#76cba3] disabled:opacity-50 text-slate-900 bg-slate-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex items-center justify-center min-w-[80px] rounded-xl bg-[#76cba3] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#68bd95] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#76cba3] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <span className="flex items-center gap-1.5"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-100 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span></span>Wait</span> : "Send"}
          </button>
        </form>
      </div>
    </article>
  );
}
