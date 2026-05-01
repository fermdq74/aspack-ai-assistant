import { streamText, createDataStreamResponse } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { systemPrompt } from "@/lib/system-prompt";
import { proactiveKnowledgeSearch } from "@/lib/tools/search-knowledge";
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

  if (conversationId) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: session.user.id },
    });
    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }
  }

  const lastUserMessage = messages[messages.length - 1];

  // Search the knowledge base before calling the LLM. This is more reliable
  // than tool-based RAG because it doesn't depend on the model choosing to
  // invoke the tool — the context is always available when relevant docs exist.
  const knowledgeResults = proactiveKnowledgeSearch(lastUserMessage.content);

  const activeSystem =
    knowledgeResults.length > 0
      ? `${systemPrompt}

---

## Información recuperada de la base de conocimiento ASPACK

La siguiente información fue recuperada automáticamente de los documentos internos. Úsala para responder y cita la fuente con el formato *(Fuente: knowledge/ruta/archivo.md)* al final de cada párrafo o sección relevante.

${knowledgeResults
  .map((r) => `**Fuente: ${r.source}**\n\n${r.excerpt}`)
  .join("\n\n---\n\n")}`
      : systemPrompt;

  return createDataStreamResponse({
    execute: async (dataStream) => {
      // Signal the client that knowledge was retrieved so it can show an indicator
      if (knowledgeResults.length > 0) {
        dataStream.writeMessageAnnotation({
          type: "knowledge_search",
          sources: knowledgeResults.map((r) => r.source),
        });
      }

      const result = streamText({
        model: anthropic("claude-sonnet-4-6"),
        system: activeSystem,
        messages,
        tools: { generate_image: generateImageTool },
        maxSteps: 3,
        onFinish: async ({ text, toolResults }) => {
          if (!conversationId) return;

          try {
            if (lastUserMessage.role === "user") {
              await prisma.message.create({
                data: {
                  conversationId,
                  role: "user",
                  content: lastUserMessage.content,
                },
              });
            }

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

      result.mergeIntoDataStream(dataStream);
    },
    onError: (error) =>
      error instanceof Error ? error.message : String(error),
  });
}
