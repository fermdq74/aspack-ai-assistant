"use client";

import { useRef, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ChatInput({
  input,
  isLoading,
  onInputChange,
  onSubmit,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  }, [input]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSubmit(e);
    }
  };

  return (
    <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-3xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta sobre envases de cartón... (Enter para enviar, Shift+Enter para nueva línea)"
            disabled={isLoading}
            rows={1}
            className={cn(
              "pr-14 min-h-[52px] max-h-[200px] rounded-xl resize-none border-input shadow-sm transition-shadow",
              "focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-md",
              isLoading && "opacity-70"
            )}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 h-8 w-8 rounded-lg shrink-0"
          >
            <SendHorizonal className="w-4 h-4" />
            <span className="sr-only">Enviar mensaje</span>
          </Button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-2">
          ASPACK AI puede cometer errores. Verifica información importante con fuentes oficiales.
        </p>
      </div>
    </div>
  );
}
