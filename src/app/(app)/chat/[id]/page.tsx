import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ChatInterface } from "@/components/chat/chat-interface";

interface ConversationPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) notFound();

  const initialMessages = conversation.messages.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));

  return (
    <ChatInterface
      conversationId={conversation.id}
      initialMessages={initialMessages}
    />
  );
}
