import { ChatInterface } from "@/components/chat/chat-interface";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function NewChatPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <ChatInterface conversationId={null} initialMessages={[]} />;
}
