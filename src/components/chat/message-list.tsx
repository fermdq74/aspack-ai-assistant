"use client";

import { useEffect, useRef } from "react";
import type { Message } from "ai";
import { MessageItem } from "./message-item";
import { TypingIndicator } from "./typing-indicator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PackageOpen } from "lucide-react";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <PackageOpen className="w-8 h-8 text-slate-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              ASPACK AI Assistant
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Tu asistente especializado en envases y embalajes de cartón.
              Pregúntame sobre materiales, normativas, procesos de fabricación,
              estándares ECMA, sostenibilidad y mucho más.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-left">
            {[
              "¿Cuál es la diferencia entre SBS y FBB?",
              "Explícame el reglamento PPWR",
              "¿Qué gramaje necesito para una caja de 500g?",
              "Estándares ECMA para cajas tuck-end",
            ].map((suggestion) => (
              <div
                key={suggestion}
                className="bg-slate-50 border border-border rounded-lg p-2.5 text-muted-foreground hover:bg-slate-100 cursor-default transition-colors"
              >
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto py-4">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex gap-3 px-4 py-3 animate-fade-in">
            <Avatar className="w-8 h-8 shrink-0 mt-0.5">
              <AvatarFallback className="bg-slate-700 text-white">
                <PackageOpen className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-4 py-2 shadow-sm">
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
