"use client";

import { useChat } from "ai/react";
import { useRouter } from "next/navigation";
import { useRef, useCallback, useEffect } from "react";
import type { Message } from "ai";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";

const PENDING_MSG_KEY = "aspack_pending_message";

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

  const { messages, input, isLoading, handleInputChange, handleSubmit, append } =
    useChat({
      api: "/api/chat",
      initialMessages,
      onFinish: () => {
        // Now that Next.js always knows the real route (we navigate before
        // streaming), router.refresh() correctly refreshes the sidebar.
        router.refresh();
      },
      onError: (error) => {
        console.error("Chat error:", error);
      },
    });

  // On mount, check if there's a pending message to auto-submit.
  // This covers the new-conversation flow: the user typed on /chat,
  // we created the conversation, navigated here, and stored the message.
  useEffect(() => {
    if (!conversationId) return;

    const pending = sessionStorage.getItem(PENDING_MSG_KEY);
    if (!pending) return;

    sessionStorage.removeItem(PENDING_MSG_KEY);
    append(
      { role: "user", content: pending },
      { body: { conversationId } }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once on mount only

  const handleFormSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;

      if (!conversationIdRef.current) {
        // First message: create the conversation, then navigate to it.
        // The pending message is stored in sessionStorage so the newly
        // mounted ChatInterface picks it up and auto-submits.
        try {
          const res = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: input.slice(0, 60) }),
          });

          if (!res.ok) throw new Error("Failed to create conversation");

          const newConversation = await res.json();
          sessionStorage.setItem(PENDING_MSG_KEY, input);
          router.replace(`/chat/${newConversation.id}`);
        } catch (err) {
          console.error("Error creating conversation:", err);
        }
        return;
      }

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
