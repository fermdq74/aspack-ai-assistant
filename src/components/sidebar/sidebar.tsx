"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConversationList } from "./conversation-list";
import { PackageOpen, Plus, LogOut, ChevronDown } from "lucide-react";

interface SidebarProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const router = useRouter();

  const handleNewChat = () => {
    router.push("/chat");
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  const userInitials = user.email
    ? user.email.slice(0, 2).toUpperCase()
    : "US";

  return (
    <aside className="w-64 flex flex-col h-full bg-slate-900 text-slate-100 shrink-0">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
          <PackageOpen className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold truncate text-white">ASPACK AI</h1>
          <p className="text-[10px] text-slate-400 truncate">
            Asistente de embalaje
          </p>
        </div>
      </div>

      <div className="px-3 pb-3">
        <Button
          onClick={handleNewChat}
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
        >
          <Plus className="w-4 h-4" />
          Nueva conversación
        </Button>
      </div>

      <Separator className="bg-slate-800" />

      {/* Conversation list */}
      <div className="flex-1 overflow-hidden py-2">
        <p className="px-4 pb-1 text-[10px] uppercase tracking-wider text-slate-500 font-medium">
          Conversaciones
        </p>
        <ScrollArea className="h-full">
          <ConversationList onNavigate={() => {}} />
        </ScrollArea>
      </div>

      <Separator className="bg-slate-800" />

      {/* User info */}
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-slate-800 transition-colors group">
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarFallback className="bg-slate-600 text-slate-200 text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-slate-200 truncate">
                  {user.name ?? user.email?.split("@")[0] ?? "Usuario"}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {user.email}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="top"
            className="w-56 mb-1"
          >
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user.name ?? user.email?.split("@")[0]}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
