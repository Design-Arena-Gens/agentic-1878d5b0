export type StoryChoice = {
  id: string;
  label: string;
  description: string;
};

export type StoryBeat = {
  title: string;
  narrative: string;
  choices: StoryChoice[];
  twist: string;
  genreContext: string;
  characterFocus: {
    name: string;
    motivation: string;
    conflict: string;
  };
  creativeFeedback: {
    strengths: string[];
    opportunities: string[];
    pacingNote: string;
    dialogueNote: string;
  };
  microGoals: string[];
  suggestedDailyChallenge: string;
  suggestedWeeklyChallenge: string;
  inspiration: {
    imagePrompt: string;
    audioPrompt: string;
    textSpark: string;
  };
};

export type StoryRequestPayload = {
  mode: "start" | "continue" | "genre-shift";
  currentGenre: string;
  targetGenre?: string;
  userIntent: string;
  choiceId?: string;
  previousBeats: StoryBeat[];
  audienceProfile: string;
};

export type InspirationPayload = {
  theme: string;
  vibe: "moody" | "uplifting" | "mysterious" | "epic" | "intimate";
  medium: "text" | "image" | "audio" | "mixed";
  focus: "character" | "world" | "scene" | "mood";
};
