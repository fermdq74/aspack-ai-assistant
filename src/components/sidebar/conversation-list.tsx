"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageSquare, Trash2 } from "lucide-react";
import type { SidebarConversation } from "@/types";

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
}

interface ConversationListProps {
  onNavigate?: () => void;
}

export function ConversationList({ onNavigate }: ConversationListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [conversations, setConversations] = useState<SidebarConversation[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations, pathname]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/conversations/${deleteId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== deleteId));

        // If we deleted the current conversation, go to /chat
        if (pathname === `/chat/${deleteId}`) {
          router.push("/chat");
        }
      }
    } catch (err) {
      console.error("Error deleting conversation:", err);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="px-2 space-y-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-10 rounded-md bg-muted/50 animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="px-3 py-6 text-center">
        <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-xs text-slate-500">
          No hay conversaciones aún.
          <br />
          Empieza una nueva.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="px-2 space-y-0.5">
        {conversations.map((conv) => {
          const isActive = pathname === `/chat/${conv.id}`;
          return (
            <div
              key={conv.id}
              className={cn(
                "group flex items-start gap-2 rounded-md px-2 py-2 cursor-pointer transition-colors",
                isActive
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
              onClick={() => {
                router.push(`/chat/${conv.id}`);
                onNavigate?.();
              }}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium break-words leading-snug">{conv.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatRelativeDate(conv.updatedAt)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteId(conv.id);
                }}
                className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-400 hover:bg-red-400/10 mt-0.5"
                aria-label="Eliminar conversación"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar conversación</DialogTitle>
            <DialogDescription>
              ¿Seguro que quieres eliminar esta conversación? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteId(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
