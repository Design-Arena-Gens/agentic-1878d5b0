import { NextResponse } from "next/server";

import {
  assertOpenAIKey,
  extractResponseText,
  getOpenAIClient,
} from "@/lib/openai";
import { StoryRequestPayload } from "@/types/story";

const storyBeatSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "narrative",
    "choices",
    "twist",
    "genreContext",
    "characterFocus",
    "creativeFeedback",
    "microGoals",
    "suggestedDailyChallenge",
    "suggestedWeeklyChallenge",
    "inspiration",
  ],
  properties: {
    title: { type: "string" },
    narrative: { type: "string" },
    twist: { type: "string" },
    genreContext: { type: "string" },
    choices: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "description"],
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          description: { type: "string" },
        },
      },
    },
    characterFocus: {
      type: "object",
      additionalProperties: false,
      required: ["name", "motivation", "conflict"],
      properties: {
        name: { type: "string" },
        motivation: { type: "string" },
        conflict: { type: "string" },
      },
    },
    creativeFeedback: {
      type: "object",
      additionalProperties: false,
      required: ["strengths", "opportunities", "pacingNote", "dialogueNote"],
      properties: {
        strengths: {
          type: "array",
          minItems: 1,
          maxItems: 3,
          items: { type: "string" },
        },
        opportunities: {
          type: "array",
          minItems: 1,
          maxItems: 3,
          items: { type: "string" },
        },
        pacingNote: { type: "string" },
        dialogueNote: { type: "string" },
      },
    },
    microGoals: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: { type: "string" },
    },
    suggestedDailyChallenge: { type: "string" },
    suggestedWeeklyChallenge: { type: "string" },
    inspiration: {
      type: "object",
      additionalProperties: false,
      required: ["imagePrompt", "audioPrompt", "textSpark"],
      properties: {
        imagePrompt: { type: "string" },
        audioPrompt: { type: "string" },
        textSpark: { type: "string" },
      },
    },
  },
} as const;

const SYSTEM_PROMPT = `
You are StoryWeaver Mentor, an AI guide for aspiring writers, filmmakers, and artists.

Goals:
- Craft vibrant, choose-your-own-adventure story beats that adapt to the user's goals and selections.
- Protect continuity: use the provided previous beats when relevant, but evolve the story in surprising, coherent ways.
- Provide concise, actionable creative feedback covering plot, character, pacing, and dialogue.
- Generate multimedia inspiration hooks: a DALL·E-ready image prompt, an audio mood cue, and a compact text spark.
- Track progress with focused micro-goals and accountability challenges.
- Support genre shifting while preserving character identities and emotional arcs.

Rules:
- Always conform exactly to the provided JSON schema.
- Story beats must be no longer than 220 words. Keep them high-energy and sensory rich.
- Choices should be distinct strategic directions for the story, not minor variations.
- When 'mode' is 'genre-shift', reframe the tone and world-building to the requested target genre while honoring core characters and conflicts.
- Creative feedback should reference the current narrative beat directly.
- Micro goals should be phrased as short imperatives (e.g., "Outline the antagonist's secret agenda").
- Daily/weekly challenges should be motivational and time-bound.
- Image prompts must be detailed, cinematic, and include style/lighting cues. Assume they will be used with DALL·E 3.
- Audio prompts should describe instrumentation, tempo, and atmosphere for a 30-second loopable cue.
- Text spark should be 1-2 evocative sentences that invite experimentation.
`.trim();

export async function POST(request: Request) {
  try {
    assertOpenAIKey();

    const payload = (await request.json()) as StoryRequestPayload;
    const {
      mode,
      currentGenre,
      targetGenre,
      userIntent,
      choiceId,
      previousBeats,
      audienceProfile,
    } = payload;

    if (!mode || !currentGenre || !userIntent) {
      return NextResponse.json(
        { error: "Missing required fields: mode, currentGenre, userIntent" },
        { status: 400 },
      );
    }

    const condensedHistory =
      previousBeats?.slice(-3)?.map((beat) => ({
        title: beat.title,
        narrative: beat.narrative,
        choiceTaken: beat.choices.find((choice) => choice.id === choiceId)
          ?.label,
        genreContext: beat.genreContext,
        twist: beat.twist,
        characterFocus: beat.characterFocus,
      })) ?? [];

    const client = getOpenAIClient();

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            mode,
            currentGenre,
            targetGenre: targetGenre ?? null,
            userIntent,
            choiceId: choiceId ?? null,
            audienceProfile,
            storySoFar: condensedHistory,
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "story_beat",
          schema: storyBeatSchema,
        },
        verbosity: "medium",
      },
    });

    const outputText = extractResponseText(response);
    const parsed = JSON.parse(outputText);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Story API error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error generating story beat",
      },
      { status: 500 },
    );
  }
}
