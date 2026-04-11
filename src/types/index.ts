export type Role = "USER" | "ADMIN";
export type MessageRole = "user" | "assistant" | "tool";

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
  _count?: { messages: number };
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

// API request/response types
export interface CreateConversationRequest {
  title?: string;
}

export interface CreateConversationResponse {
  id: string;
  title: string;
  createdAt: string;
}

export interface ChatRequestBody {
  messages: { role: MessageRole; content: string }[];
  conversationId?: string;
}

export interface ApiError {
  error: string;
  status?: number;
}

// UI state types
export interface SidebarConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}
