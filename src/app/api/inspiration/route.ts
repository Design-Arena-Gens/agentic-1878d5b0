import { NextResponse } from "next/server";

import {
  assertOpenAIKey,
  extractResponseText,
  getOpenAIClient,
} from "@/lib/openai";
import { InspirationPayload } from "@/types/story";

const inspirationSchema = {
  type: "object",
  additionalProperties: false,
  required: ["imagePrompt", "audioPrompt", "textSpark", "vibeTags"],
  properties: {
    imagePrompt: { type: "string" },
    audioPrompt: { type: "string" },
    textSpark: { type: "string" },
    vibeTags: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: { type: "string" },
    },
  },
} as const;

const INSPIRATION_SYSTEM_PROMPT = `
You are MuseCrafter, an AI that fabricates multimedia inspiration kits for creators.
Produce rich, cinematic prompts for imagery and sound, along with a concise text spark.
Respond strictly using the provided JSON schema.
`.trim();

export async function POST(request: Request) {
  try {
    assertOpenAIKey();

    const payload = (await request.json()) as InspirationPayload;
    const { theme, vibe, medium, focus } = payload;

    if (!theme || !vibe || !medium || !focus) {
      return NextResponse.json(
        { error: "Missing required fields: theme, vibe, medium, focus" },
        { status: 400 },
      );
    }

    const client = getOpenAIClient();

    const ideation = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: INSPIRATION_SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            theme,
            vibe,
            medium,
            focus,
            instruction:
              "Supply detailed prompts suitable for DALL·E 3 and short audio cue generation. Reflect the requested vibe and focus.",
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "inspiration_kit",
          schema: inspirationSchema,
        },
        verbosity: "medium",
      },
    });

    const ideationText = extractResponseText(ideation);
    const parsed = JSON.parse(ideationText);

    const [imageResult, audioResult] = await Promise.all([
      client.images.generate({
        model: "dall-e-3",
        prompt: parsed.imagePrompt,
        size: "1024x1024",
        response_format: "b64_json",
      }),
      client.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "ember",
        input: parsed.audioPrompt,
        response_format: "mp3",
      }),
    ]);

    const imageBase64 = imageResult.data?.[0]?.b64_json ?? null;
    const audioBuffer = Buffer.from(await audioResult.arrayBuffer());

    return NextResponse.json({
      textSpark: parsed.textSpark,
      imagePrompt: parsed.imagePrompt,
      audioPrompt: parsed.audioPrompt,
      vibeTags: parsed.vibeTags,
      imageBase64,
      audioBase64: audioBuffer.toString("base64"),
      audioMimeType: "audio/mpeg",
    });
  } catch (error) {
    console.error("Inspiration API error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error generating inspiration kit",
      },
      { status: 500 },
    );
  }
}
