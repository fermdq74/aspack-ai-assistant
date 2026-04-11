"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PackageOpen, User, Download, Search, ImageIcon, Loader2 } from "lucide-react";
import type { Message, ToolInvocation } from "ai";

interface MessageItemProps {
  message: Message;
}

// ─── Tool result renderers ────────────────────────────────────────────────────

function ImageToolInvocation({ invocation }: { invocation: ToolInvocation }) {
  if (invocation.state === "call") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-slate-50 border border-border rounded-lg px-3 py-2 my-2">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span>Generando imagen…</span>
        <span className="text-xs opacity-60">(puede tardar unos segundos)</span>
      </div>
    );
  }

  if (invocation.state === "result") {
    const result = invocation.result as {
      success: boolean;
      imageUrl?: string;
      error?: string;
      originalDescription?: string;
    };

    if (!result.success || !result.imageUrl) {
      return (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 my-2">
          {result.error ?? "Error al generar la imagen."}
        </div>
      );
    }

    return (
      <div className="my-3 space-y-2">
        <div className="relative group rounded-xl overflow-hidden border border-border shadow-sm inline-block max-w-full">
          <Image
            src={result.imageUrl}
            alt={result.originalDescription ?? "Imagen generada"}
            width={512}
            height={512}
            className="block max-w-full h-auto"
            unoptimized
          />
          {/* Download overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end justify-end p-2 opacity-0 group-hover:opacity-100">
            <a
              href={result.imageUrl}
              download="aspack-generated-image.jpg"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-white text-foreground text-xs font-medium px-2.5 py-1.5 rounded-lg shadow hover:bg-slate-100 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="w-3.5 h-3.5" />
              Descargar
            </a>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function KnowledgeToolInvocation({ invocation }: { invocation: ToolInvocation }) {
  if (invocation.state === "call") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-slate-50 border border-border rounded-lg px-3 py-2 my-2">
        <Search className="w-4 h-4 text-primary animate-pulse" />
        <span>Consultando base de conocimiento…</span>
      </div>
    );
  }
  // Result is silent — the assistant will cite sources in its text response
  return null;
}

function ToolInvocationRenderer({ invocation }: { invocation: ToolInvocation }) {
  if (invocation.toolName === "generate_image") {
    return <ImageToolInvocation invocation={invocation} />;
  }
  if (invocation.toolName === "search_knowledge") {
    return <KnowledgeToolInvocation invocation={invocation} />;
  }
  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === "user";

  const hasToolInvocations =
    message.toolInvocations && message.toolInvocations.length > 0;

  // For assistant messages that are purely a tool call with no text,
  // render only the tool UI
  const textContent =
    typeof message.content === "string" ? message.content : "";

  if (!isUser && !textContent && hasToolInvocations) {
    return (
      <div className="flex gap-3 px-4 py-3 animate-fade-in">
        <Avatar className="w-8 h-8 shrink-0 mt-0.5">
          <AvatarFallback className="bg-slate-700 text-white">
            <PackageOpen className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
        <div className="max-w-[80%]">
          {message.toolInvocations!.map((inv) => (
            <ToolInvocationRenderer key={inv.toolCallId} invocation={inv} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3 animate-fade-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <Avatar className="w-8 h-8 shrink-0 mt-0.5">
        {isUser ? (
          <AvatarFallback className="bg-primary text-primary-foreground">
            <User className="w-4 h-4" />
          </AvatarFallback>
        ) : (
          <AvatarFallback className="bg-slate-700 text-white">
            <PackageOpen className="w-4 h-4" />
          </AvatarFallback>
        )}
      </Avatar>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-white border border-border text-foreground rounded-tl-sm"
        )}
      >
        {/* Tool invocations rendered inside the bubble for assistant messages */}
        {!isUser && hasToolInvocations &&
          message.toolInvocations!.map((inv) => (
            <ToolInvocationRenderer key={inv.toolCallId} invocation={inv} />
          ))}

        {/* Message text */}
        {textContent &&
          (isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{textContent}</p>
          ) : (
            <div className="prose-chat">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  img: ({ src, alt }) => {
                    if (!src) return null;
                    return (
                      <span className="block my-3">
                        <span className="relative group inline-block rounded-xl overflow-hidden border border-border shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt={alt ?? "Imagen generada"}
                            className="block max-w-full h-auto"
                          />
                          <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end justify-end p-2 opacity-0 group-hover:opacity-100">
                            <a
                              href={src}
                              download="aspack-image.jpg"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 bg-white text-foreground text-xs font-medium px-2.5 py-1.5 rounded-lg shadow hover:bg-slate-100 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Descargar
                            </a>
                          </span>
                        </span>
                      </span>
                    );
                  },
                }}
              >
                {textContent}
              </ReactMarkdown>
            </div>
          ))}
      </div>
    </div>
  );
}
