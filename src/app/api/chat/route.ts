import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { systemPrompt } from "@/lib/system-prompt";
import { searchKnowledgeTool } from "@/lib/tools/search-knowledge";
import { generateImageTool } from "@/lib/tools/generate-image";
import { NextRequest } from "next/server";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { messages, conversationId } = body as {
    messages: { role: "user" | "assistant"; content: string }[];
    conversationId?: string;
  };

  if (!messages || messages.length === 0) {
    return Response.json({ error: "No messages provided" }, { status: 400 });
  }

  // Verify conversation belongs to user if provided
  if (conversationId) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: session.user.id },
    });
    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }
  }

  const lastUserMessage = messages[messages.length - 1];

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemPrompt,
    messages,
    tools: {
      search_knowledge: searchKnowledgeTool,
      generate_image: generateImageTool,
    },
    // Allow up to 5 steps: tool call → result → follow-up text
    maxSteps: 5,
    onFinish: async ({ text, toolCalls, toolResults }) => {
      if (!conversationId) return;

      try {
        // Save the user message
        if (lastUserMessage.role === "user") {
          await prisma.message.create({
            data: {
              conversationId,
              role: "user",
              content: lastUserMessage.content,
            },
          });
        }

        // Build the assistant content to persist.
        // If there were image generation tool results, embed the image URL
        // as markdown so it renders on reload.
        let assistantContent = text;

        if (toolResults && toolResults.length > 0) {
          for (const tr of toolResults) {
            if (
              tr.toolName === "generate_image" &&
              typeof tr.result === "object" &&
              tr.result !== null &&
              "success" in tr.result &&
              tr.result.success === true &&
              "imageUrl" in tr.result
            ) {
              const imageUrl = tr.result.imageUrl as string;
              // Prepend the image markdown if the final text doesn't already contain it
              if (!assistantContent.includes(imageUrl)) {
                assistantContent = `![Imagen generada](${imageUrl})\n\n${assistantContent}`;
              }
            }
          }
        }

        if (assistantContent.trim()) {
          await prisma.message.create({
            data: {
              conversationId,
              role: "assistant",
              content: assistantContent,
            },
          });
        }

        // Update conversation title if still default
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { title: true, _count: { select: { messages: true } } },
        });

        if (
          conversation?.title === "Nueva conversación" &&
          conversation._count.messages <= 2
        ) {
          const title =
            lastUserMessage.content.slice(0, 60) +
            (lastUserMessage.content.length > 60 ? "..." : "");
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { title, updatedAt: new Date() },
          });
        } else if (conversation) {
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          });
        }
      } catch (err) {
        console.error("Error saving messages:", err);
      }
    },
  });

  return result.toDataStreamResponse();
}
