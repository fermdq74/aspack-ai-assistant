import { tool } from "ai";
import { z } from "zod";
import * as fal from "@fal-ai/serverless-client";

fal.config({ credentials: process.env.FAL_API_KEY });

interface FalResult {
  images?: Array<{ url: string; width: number; height: number }>;
}

/**
 * Enhances a user's packaging concept description into a detailed
 * prompt optimized for photorealistic packaging renders.
 */
function enhancePrompt(userDescription: string): string {
  const packagingKeywords = [
    "packaging",
    "caja",
    "envase",
    "carton",
    "cartón",
    "box",
    "cartonaje",
    "embalaje",
    "blister",
    "estuche",
  ];

  const isPackagingRelated = packagingKeywords.some((kw) =>
    userDescription.toLowerCase().includes(kw)
  );

  const packagingEnhancement = isPackagingRelated
    ? "realistic cardboard box with accurate proportions, offset lithography print quality, visible cardboard texture and material weight, professional product photography, studio lighting with soft shadows, white background, commercial packaging render, high detail print graphics"
    : "";

  const baseEnhancement =
    "photorealistic, high resolution, professional commercial photography, sharp focus, 8k";

  return [userDescription, packagingEnhancement, baseEnhancement]
    .filter(Boolean)
    .join(", ");
}

export const generateImageTool = tool({
  description:
    "Generate an image of a packaging concept, box design, material texture, or any visual element the user wants to see. Use this tool whenever the user asks to visualize, render, or create an image of something. The tool automatically enhances prompts with sector-specific details for realistic packaging renders.",
  parameters: z.object({
    description: z
      .string()
      .describe(
        "The user's description of what they want to visualize, in their own words. Be as specific as possible about colors, materials, text, graphics, and format."
      ),
    width: z
      .number()
      .optional()
      .default(1024)
      .describe("Image width in pixels. Use 1024x1024 for square, 1280x720 for landscape."),
    height: z
      .number()
      .optional()
      .default(1024)
      .describe("Image height in pixels."),
  }),
  execute: async ({ description, width = 1024, height = 1024 }) => {
    const enhancedPrompt = enhancePrompt(description);

    try {
      const result = await fal.run("fal-ai/flux-2-pro", {
        input: {
          prompt: enhancedPrompt,
          image_size: { width, height },
          num_images: 1,
          safety_tolerance: "2",
        },
      }) as FalResult;

      const imageUrl = result?.images?.[0]?.url;

      if (!imageUrl) {
        return {
          success: false,
          error: "No image was returned. Please try again.",
        };
      }

      return {
        success: true,
        imageUrl,
        enhancedPrompt,
        originalDescription: description,
      };
    } catch (err) {
      console.error("Image generation error:", err);
      return {
        success: false,
        error: "Image generation failed. Please check your FAL_API_KEY and try again.",
      };
    }
  },
});
