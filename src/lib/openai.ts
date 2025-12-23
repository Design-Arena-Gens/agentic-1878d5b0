import OpenAI from "openai";

let cachedClient: OpenAI | null = null;

export function assertOpenAIKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set. Please configure it in your environment.",
    );
  }
}

export type StoryMode = "start" | "continue" | "genre-shift" | "feedback-solo";

export function getOpenAIClient(): OpenAI {
  if (!cachedClient) {
    assertOpenAIKey();
    cachedClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return cachedClient;
}

export function extractResponseText(response: unknown): string {
  if (
    typeof response === "object" &&
    response !== null &&
    "output_text" in response &&
    typeof (response as { output_text?: unknown }).output_text === "string"
  ) {
    return (response as { output_text: string }).output_text;
  }

  if (
    typeof response !== "object" ||
    response === null ||
    !("output" in response)
  ) {
    return "";
  }

  const outputItems = (response as { output?: unknown }).output;
  if (!Array.isArray(outputItems)) {
    return "";
  }

  return outputItems
    .map((item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        !("content" in item)
      ) {
        return "";
      }

      const content = (item as { content?: unknown }).content;
      if (!Array.isArray(content)) {
        return "";
      }

      return content
        .map((entry) => {
          if (!entry || typeof entry !== "object") {
            return "";
          }
          if ("text" in entry) {
            const textValue = (entry as { text?: unknown }).text;
            if (typeof textValue === "string") {
              return textValue;
            }
            if (
              typeof textValue === "object" &&
              textValue !== null &&
              "value" in textValue &&
              typeof (textValue as { value?: unknown }).value === "string"
            ) {
              return (textValue as { value: string }).value;
            }
          }
          return "";
        })
        .join("");
    })
    .join("");
}
