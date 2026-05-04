"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

interface Message {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  streaming?: boolean;
}

const SUGGESTIONS = [
  "What are the visa requirements for studying in Canada?",
  "Best CS master's programs in the UK under $30k/year",
  "How much does it cost to live in Toronto as a student?",
  "Scholarships for international students in the USA",
];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Formatted Text ───────────────────────────────────────────────
function FormattedText({ text }: { text: string }) {
  return (
    <div className="space-y-1">
      {text.split("\n").map((line, i) => {
        if (line.startsWith("### "))
          return <h3 key={i} className="text-sm font-semibold text-yellow-300 mt-3 mb-1">{line.slice(4)}</h3>;
        if (line.startsWith("## "))
          return <h2 key={i} className="text-base font-bold text-white mt-3 mb-1">{line.slice(3)}</h2>;
        if (line.startsWith("**") && line.endsWith("**"))
          return <p key={i} className="font-bold text-white">{line.slice(2, -2)}</p>;
        if (line.startsWith("- ") || line.startsWith("☐ ") || line.startsWith("✓ "))
          return <p key={i} className="pl-3 text-gray-200">{line}</p>;
        if (line.trim() === "")
          return <br key={i} />;
        return <p key={i} className="text-gray-200 leading-relaxed">{line}</p>;
      })}
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-indigo-600 text-white px-4 py-3 rounded-[18px_18px_4px_18px] max-w-[72%] text-sm leading-relaxed font-sans">
          {msg.content}
        </div>
      </div>
    );
  }
  if (msg.role === "error") {
    return (
      <div className="bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm font-sans">
        ⚠ {msg.content}
      </div>
    );
  }
  return (
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 shrink-0 rounded-full border border-indigo-500 bg-indigo-500/10 flex items-center justify-center text-yellow-300 text-xs">
        ✦
      </div>
      <div className={`flex-1 bg-[#111118] border rounded-[4px_18px_18px_18px] px-5 py-4 text-sm leading-7 ${msg.streaming ? "border-indigo-500" : "border-[#1e1e2e]"}`}>
        <FormattedText text={msg.content} />
        {msg.streaming && <span className="cursor-blink text-indigo-400 ml-1">▋</span>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm your international study advisor. I can help you find universities, understand visa requirements, explore housing options, and discover scholarships in the USA, Canada, and UK.\n\nWhat would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [sessionId] = useState(() => "session-" + generateId());

  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTool]);

  const connectWS = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_URL}/ws/chat/${sessionId}`);

    ws.onmessage = (e: MessageEvent) => {
      const data = JSON.parse(e.data);

      if (data.type === "token") {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last?.streaming) {
            return [
              ...prev.slice(0, -1),
              { ...last, content: last.content + data.content },
            ];
          }
          return [
            ...prev,
            { id: generateId(), role: "assistant", content: data.content, streaming: true },
          ];
        });
      } else if (data.type === "tool_start") {
        setActiveTool((data.tool as string)?.replace(/_/g, " ") ?? null);
      } else if (data.type === "done") {
        setIsStreaming(false);
        setActiveTool(null);
        setMessages((prev) =>
          prev.map((m) => (m.streaming ? { ...m, streaming: false } : m))
        );
      } else if (data.type === "error") {
        setIsStreaming(false);
        setActiveTool(null);
        setMessages((prev) => [
          ...prev,
          { id: generateId(), role: "error", content: data.content },
        ]);
      }
    };

    ws.onerror = () => {
      setIsStreaming(false);
      setActiveTool(null);
    };

    wsRef.current = ws;
  }, [sessionId]);

  useEffect(() => {
    connectWS();
    return () => wsRef.current?.close();
  }, [connectWS]);

  const sendMessage = useCallback(
    (text?: string) => {
      const msg = text ?? input.trim();
      if (!msg || isStreaming) return;

      connectWS();
      setMessages((prev) => [
        ...prev,
        { id: generateId(), role: "user", content: msg },
      ]);
      setInput("");
      setIsStreaming(true);

      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ message: msg }));
        }
      }, 100);
    },
    [input, isStreaming, connectWS]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col relative overflow-hidden">

      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(#1e1e2e 1px, transparent 1px), linear-gradient(90deg, #1e1e2e 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[#1e1e2e] bg-[#0a0a0f]/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-yellow-300 text-xl">✦</span>
            <span className="text-lg font-bold tracking-tight">
              StudyAbroad<em className="text-indigo-400 not-italic">AI</em>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 border border-[#1e1e2e] rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80]" />
            USA · Canada · UK
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {/* Tool indicator */}
          {activeTool && (
            <div className="flex items-center gap-2.5 pl-11">
              <span className="tool-pulse w-2 h-2 rounded-full bg-yellow-300 shadow-[0_0_8px_#fde047]" />
              <span className="text-xs text-gray-500 italic font-sans">
                Searching: {activeTool}…
              </span>
            </div>
          )}

          {/* Suggestions */}
          {messages.length === 1 && !isStreaming && (
            <div className="flex flex-col gap-2 pl-11">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="text-left text-xs text-gray-500 border border-[#1e1e2e] rounded-xl px-4 py-2.5 hover:border-indigo-500/50 hover:text-gray-300 transition-all font-sans"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="sticky bottom-0 border-t border-[#1e1e2e] bg-[#0a0a0f]/95 backdrop-blur-md px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2.5 bg-[#111118] border border-[#1e1e2e] rounded-2xl px-4 py-2.5">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about universities, visas, housing, scholarships…"
              disabled={isStreaming}
              rows={1}
              className="flex-1 bg-transparent border-none outline-none text-gray-200 text-sm leading-relaxed resize-none max-h-40 overflow-y-auto placeholder:text-gray-600 disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isStreaming}
              className="w-9 h-9 shrink-0 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg font-bold transition-opacity disabled:opacity-30 hover:bg-indigo-500"
            >
              {isStreaming ? "…" : "↑"}
            </button>
          </div>
          <p className="text-center text-xs text-gray-600 mt-2 font-sans">
            Always verify visa and tuition details on official government websites.
          </p>
        </div>
      </footer>
    </div>
  );
}
