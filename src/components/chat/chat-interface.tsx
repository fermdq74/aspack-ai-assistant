"use client";

import { useChat } from "ai/react";
import { useRouter } from "next/navigation";
import { useRef, useCallback } from "react";
import type { Message } from "ai";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";

interface ChatInterfaceProps {
  conversationId: string | null;
  initialMessages: Message[];
}

export function ChatInterface({
  conversationId,
  initialMessages,
}: ChatInterfaceProps) {
  const router = useRouter();
  const conversationIdRef = useRef<string | null>(conversationId);

  const { messages, input, isLoading, handleInputChange, handleSubmit, setInput } =
    useChat({
      api: "/api/chat",
      initialMessages,
      body: {
        conversationId: conversationIdRef.current,
      },
      onResponse: async (response) => {
        // If no conversation yet, create one from the x-conversation-id header (if we add it)
        // For now we handle creation before submit
      },
      onError: (error) => {
        console.error("Chat error:", error);
      },
    });

  const handleFormSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!input.trim()) return;

      // If no conversation exists, create one first
      if (!conversationIdRef.current) {
        try {
          const res = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: input.slice(0, 60) }),
          });

          if (!res.ok) throw new Error("Failed to create conversation");

          const newConversation = await res.json();
          conversationIdRef.current = newConversation.id;

          // Navigate to the new conversation URL (replace so back button works correctly)
          router.replace(`/chat/${newConversation.id}`);
        } catch (err) {
          console.error("Error creating conversation:", err);
          return;
        }
      }

      // Submit the chat with the conversation ID in the body
      handleSubmit(e, {
        body: { conversationId: conversationIdRef.current },
      });
    },
    [input, handleSubmit, router]
  );

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <MessageList messages={messages} isLoading={isLoading} />
      <ChatInput
        input={input}
        isLoading={isLoading}
        onInputChange={(value) =>
          handleInputChange({
            target: { value },
          } as React.ChangeEvent<HTMLTextAreaElement>)
        }
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
