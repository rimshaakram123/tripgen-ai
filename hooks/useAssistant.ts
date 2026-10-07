"use client";

import { useState, useCallback } from "react";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function useAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(
    async (content: string, tripContext?: string): Promise<void> => {
      const userMsg: ChatMessage = { role: "user", content };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 70_000);

      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, tripContext }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed");
        }
        const data = await res.json();

        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: data.response,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (error) {
        const message =
          error instanceof Error && error.name === "AbortError"
            ? "The AI request took too long. Please try a shorter question."
            : error instanceof Error
              ? error.message
              : "I'm having trouble responding right now. Please try again later.";
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: message },
        ]);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    },
    []
  );

  const clear = useCallback(() => setMessages([]), []);

  return { messages, loading, sendMessage, clear };
}
