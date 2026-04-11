import { auth } from "@/auth";
import { NextRequest } from "next/server";
import * as fal from "@fal-ai/serverless-client";

fal.config({ credentials: process.env.FAL_API_KEY });

export const maxDuration = 120;

interface FalResult {
  images?: Array<{ url: string; width: number; height: number }>;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prompt, width = 1024, height = 1024 } = await req.json() as {
    prompt: string;
    width?: number;
    height?: number;
  };

  if (!prompt) {
    return Response.json({ error: "Prompt is required" }, { status: 400 });
  }

  try {
    const result = await fal.run("fal-ai/flux-2-pro", {
      input: {
        prompt,
        image_size: { width, height },
        num_images: 1,
        safety_tolerance: "2",
      },
    }) as FalResult;

    const imageUrl = result?.images?.[0]?.url;
    if (!imageUrl) {
      return Response.json({ error: "No image returned from fal.ai" }, { status: 500 });
    }

    return Response.json({ imageUrl });
  } catch (err) {
    console.error("fal.ai error:", err);
    return Response.json(
      { error: "Image generation failed. Please try again." },
      { status: 500 }
    );
  }
}
