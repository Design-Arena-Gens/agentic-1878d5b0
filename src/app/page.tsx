"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { StoryBeat, StoryChoice } from "@/types/story";

type InspirationState = {
  textSpark: string;
  imagePrompt: string;
  audioPrompt: string;
  vibeTags: string[];
  imageBase64: string | null;
  audioBase64: string;
  audioMimeType: string;
};

type InspirationFormState = {
  theme: string;
  vibe: (typeof VIBES)[number];
  medium: (typeof MEDIUMS)[number];
  focus: (typeof FOCI)[number];
};

const GENRES = [
  "Speculative Fiction",
  "Sci-Fi Thriller",
  "Romantic Comedy",
  "Noir Mystery",
  "Urban Fantasy",
  "Historical Drama",
  "Mythic Adventure",
  "Psychological Horror",
  "Animated Family Saga",
];

const VIBES = ["moody", "uplifting", "mysterious", "epic", "intimate"] as const;
const MEDIUMS = ["text", "image", "audio", "mixed"] as const;
const FOCI = ["character", "world", "scene", "mood"] as const;

export default function Home() {
  const [userIntent, setUserIntent] = useState(
    "Craft a character-driven pilot that balances wonder with emotional stakes.",
  );
  const [audienceProfile, setAudienceProfile] = useState(
    "Ideal for streaming audiences who crave grounded sci-fi with inclusive leads.",
  );
  const [currentGenre, setCurrentGenre] = useState(GENRES[0]);
  const [targetGenre, setTargetGenre] = useState(GENRES[3]);
  const [storyBeats, setStoryBeats] = useState<StoryBeat[]>([]);
  const [storyLoading, setStoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goals, setGoals] = useState<string[]>([]);
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState("");
  const [inspirationInput, setInspirationInput] = useState<InspirationFormState>({
    theme: "Neon-lit metropolis in monsoon season",
    vibe: VIBES[0],
    medium: MEDIUMS[3],
    focus: FOCI[2],
  });
  const [inspiration, setInspiration] = useState<InspirationState | null>(null);
  const [inspirationLoading, setInspirationLoading] = useState(false);

  const audioSrc = useMemo(() => {
    if (!inspiration?.audioBase64) return null;
    return `data:${inspiration.audioMimeType};base64,${inspiration.audioBase64}`;
  }, [inspiration]);

  async function requestStory(
    mode: "start" | "continue" | "genre-shift",
    choice?: StoryChoice,
  ) {
    try {
      setStoryLoading(true);
      setError(null);

      const response = await fetch("/api/story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          currentGenre,
          targetGenre: mode === "genre-shift" ? targetGenre : undefined,
          userIntent,
          choiceId: choice?.id,
          previousBeats: storyBeats,
          audienceProfile,
        }),
      });

      if (!response.ok) {
        const problem = await response.json().catch(() => ({}));
        throw new Error(problem.error ?? "Failed to generate story beat.");
      }

      const data = (await response.json()) as StoryBeat;
      setStoryBeats((prev) => [...prev, data]);

      const uniqueGoals = new Set([
        ...goals,
        ...data.microGoals.map((goal) => goal.trim()),
      ]);
      setGoals(Array.from(uniqueGoals));

      setProgressLog((prev) => [
        ...prev,
        `${data.title} (${new Date().toLocaleTimeString()})`,
        ...(choice ? [`Chose: ${choice.label}`] : []),
      ]);

      if (mode === "genre-shift") {
        setCurrentGenre(targetGenre);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected storyteller error.";
      setError(message);
    } finally {
      setStoryLoading(false);
    }
  }

  async function handleGenerateInspiration() {
    try {
      setInspirationLoading(true);
      setError(null);

      const response = await fetch("/api/inspiration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inspirationInput),
      });

      if (!response.ok) {
        const problem = await response.json().catch(() => ({}));
        throw new Error(problem.error ?? "Failed to craft inspiration kit.");
      }

      const data = (await response.json()) as InspirationState;
      setInspiration(data);
      setProgressLog((prev) => [
        ...prev,
        `Generated inspiration for ${inspirationInput.theme}`,
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected inspiration error.";
      setError(message);
    } finally {
      setInspirationLoading(false);
    }
  }

  function handleAddGoal() {
    const trimmed = newGoal.trim();
    if (!trimmed) return;
    setGoals((prev) => Array.from(new Set([...prev, trimmed])));
    setNewGoal("");
  }

  function handleClearSession() {
    setStoryBeats([]);
    setGoals([]);
    setProgressLog([]);
    setInspiration(null);
    setError(null);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 md:px-10 md:py-16">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg shadow-slate-950/40 backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-teal-300">
                Personalized Storyteller & Creative Mentor
              </p>
              <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
                StoryWeaver Studio
              </h1>
              <p className="max-w-2xl text-sm text-slate-200 md:text-base">
                Shape interactive narratives, gather real-time critique, and
                spark multi-sensory ideas. Your mentor remembers every beat,
                pivots across genres, and keeps your creative rhythm on track.
              </p>
            </div>
            <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-500/20 via-teal-400/10 to-transparent p-5 text-sm text-teal-100 shadow-inner shadow-teal-500/20 md:max-w-xs">
              <p className="font-semibold uppercase tracking-[0.2em] text-teal-200">
                Quick Start
              </p>
              <p className="mt-2">
                1. Set your intent & audience.{" "}
                <span className="text-white">2. Launch the story.</span>{" "}
                3. Explore choices, shift genres, and log your progress.
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-8 md:grid-cols-[2fr,1.1fr]">
          <div className="space-y-8">
            <form
              className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/30 backdrop-blur"
              onSubmit={(event) => {
                event.preventDefault();
                if (storyBeats.length === 0) {
                  requestStory("start");
                } else {
                  requestStory("continue");
                }
              }}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Current Genre
                  <select
                    className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950/70 px-4 py-3 text-base text-white transition hover:border-teal-400 focus:border-teal-300 focus:outline-none"
                    value={currentGenre}
                    onChange={(event) => setCurrentGenre(event.target.value)}
                    disabled={storyLoading}
                  >
                    {GENRES.map((genre) => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Audience Snapshot
                  <input
                    className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950/70 px-4 py-3 text-base text-white transition placeholder:text-slate-500 focus:border-teal-300 focus:outline-none"
                    value={audienceProfile}
                    onChange={(event) => setAudienceProfile(event.target.value)}
                    placeholder="Who are you writing for?"
                    disabled={storyLoading}
                  />
                </label>
              </div>
              <label className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                Creative North Star
                <textarea
                  className="mt-2 h-28 w-full rounded-xl border border-white/20 bg-slate-950/70 px-4 py-3 text-base text-white transition placeholder:text-slate-500 focus:border-teal-300 focus:outline-none"
                  value={userIntent}
                  onChange={(event) => setUserIntent(event.target.value)}
                  placeholder="What do you want this project to achieve?"
                  disabled={storyLoading}
                />
              </label>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  className="rounded-2xl bg-teal-400 px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-slate-950 shadow-lg shadow-teal-500/40 transition hover:-translate-y-0.5 hover:bg-teal-300 disabled:cursor-wait disabled:opacity-60"
                  disabled={storyLoading}
                >
                  {storyBeats.length === 0
                    ? "Launch Story"
                    : "Weave Next Beat"}
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-slate-200 transition hover:border-teal-300 hover:text-teal-200"
                  onClick={handleClearSession}
                >
                  Reset Session
                </button>
                <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {storyLoading ? "Summoning creative forces..." : "Ready"}
                </div>
              </div>
            </form>

            <div className="space-y-6">
              {storyBeats.length === 0 && (
                <div className="rounded-3xl border border-dashed border-white/30 bg-white/5 p-12 text-center text-sm text-slate-300">
                  Your mentor is waiting. Launch the story to receive the first
                  beat, tailored feedback, and fresh goals.
                </div>
              )}

              {storyBeats.map((beat, index) => (
                <article
                  key={`${beat.title}-${index}`}
                  className="space-y-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0 p-7 shadow-xl shadow-slate-950/40 backdrop-blur"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-teal-200">
                        Beat {index + 1}
                      </p>
                      <h2 className="mt-1 text-2xl font-semibold text-white">
                        {beat.title}
                      </h2>
                    </div>
                    <span className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-200">
                      {beat.genreContext}
                    </span>
                  </div>
                  <p className="text-base leading-relaxed text-slate-100">
                    {beat.narrative}
                  </p>
                  <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-5 text-sm text-teal-100">
                    <p className="font-semibold uppercase tracking-[0.25em] text-teal-200">
                      Twist
                    </p>
                    <p className="mt-2 text-teal-50">{beat.twist}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/15 bg-white/5 p-5 text-sm text-slate-100">
                      <p className="font-semibold uppercase tracking-[0.25em] text-slate-300">
                        Character Focus
                      </p>
                      <ul className="mt-3 space-y-2 text-slate-200">
                        <li>
                          <span className="text-slate-400">Name:</span>{" "}
                          {beat.characterFocus.name}
                        </li>
                        <li>
                          <span className="text-slate-400">Motivation:</span>{" "}
                          {beat.characterFocus.motivation}
                        </li>
                        <li>
                          <span className="text-slate-400">Conflict:</span>{" "}
                          {beat.characterFocus.conflict}
                        </li>
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-white/5 p-5 text-sm text-slate-100">
                      <p className="font-semibold uppercase tracking-[0.25em] text-slate-300">
                        Creative Feedback
                      </p>
                      <div className="mt-3 grid gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-teal-200">
                            Strengths
                          </p>
                          <ul className="mt-1 list-disc pl-4 text-slate-200">
                            {beat.creativeFeedback.strengths.map(
                              (strength, idx) => (
                                <li key={`strength-${idx}`}>{strength}</li>
                              ),
                            )}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-rose-200">
                            Opportunities
                          </p>
                          <ul className="mt-1 list-disc pl-4 text-slate-200">
                            {beat.creativeFeedback.opportunities.map(
                              (opportunity, idx) => (
                                <li key={`opportunity-${idx}`}>
                                  {opportunity}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                          Pacing Note
                        </p>
                        <p className="-mt-2 text-slate-200">
                          {beat.creativeFeedback.pacingNote}
                        </p>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                          Dialogue Note
                        </p>
                        <p className="-mt-2 text-slate-200">
                          {beat.creativeFeedback.dialogueNote}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      What&apos;s Next?
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {beat.microGoals.map((goal, idx) => (
                        <li
                          key={`goal-${idx}`}
                          className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200"
                        >
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-100">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      Multimedia Sparks
                    </p>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <div>
                        <p className="text-[0.65rem] uppercase tracking-[0.25em] text-teal-200">
                          Image Prompt
                        </p>
                        <p className="mt-1 text-slate-200">
                          {beat.inspiration.imagePrompt}
                        </p>
                      </div>
                      <div>
                        <p className="text-[0.65rem] uppercase tracking-[0.25em] text-indigo-200">
                          Audio Cue
                        </p>
                        <p className="mt-1 text-slate-200">
                          {beat.inspiration.audioPrompt}
                        </p>
                      </div>
                      <div>
                        <p className="text-[0.65rem] uppercase tracking-[0.25em] text-amber-200">
                          Text Spark
                        </p>
                        <p className="mt-1 text-slate-200">
                          {beat.inspiration.textSpark}
                        </p>
                      </div>
                    </div>
                  </div>

                  {index === storyBeats.length - 1 && (
                    <div className="pt-2">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        Choose the next beat
                      </p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {beat.choices.map((choice) => (
                          <button
                            key={choice.id}
                            className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-left text-sm text-slate-100 transition hover:border-teal-400 hover:bg-teal-400/10 hover:text-teal-50 disabled:cursor-wait disabled:opacity-60"
                            disabled={storyLoading}
                            onClick={() => requestStory("continue", choice)}
                          >
                            <p className="text-xs uppercase tracking-[0.25em] text-teal-200">
                              {choice.label}
                            </p>
                            <p className="mt-2 text-slate-200">
                              {choice.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-8">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/30 backdrop-blur">
              <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                Genre Shift Lab
              </h3>
              <p className="mt-3 text-sm text-slate-200">
                Experiment with “what-if” scenarios by pivoting the genre while
                keeping your characters intact.
              </p>
              <label className="mt-4 block text-xs uppercase tracking-[0.2em] text-slate-400">
                Target Genre
                <select
                  className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950/70 px-4 py-3 text-sm text-white transition hover:border-teal-400 focus:border-teal-300 focus:outline-none"
                  value={targetGenre}
                  onChange={(event) => setTargetGenre(event.target.value)}
                  disabled={storyLoading}
                >
                  {GENRES.map((genre) => (
                    <option key={`target-${genre}`} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="mt-4 w-full rounded-2xl bg-indigo-400 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-950 shadow-lg shadow-indigo-500/40 transition hover:-translate-y-0.5 hover:bg-indigo-300 disabled:cursor-wait disabled:opacity-60"
                onClick={() => requestStory("genre-shift")}
                disabled={storyLoading || storyBeats.length === 0}
              >
                Spin the Genre
              </button>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/30 backdrop-blur">
              <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                Progress & Accountability
              </h3>
              <div className="mt-4 space-y-4 text-sm text-slate-100">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-teal-200">
                    Micro Goals
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {goals.length === 0 && (
                      <span className="rounded-full border border-dashed border-white/20 px-3 py-1 text-xs text-slate-400">
                        New goals will appear here
                      </span>
                    )}
                    {goals.map((goal) => (
                      <span
                        key={goal}
                        className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100"
                      >
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-amber-200">
                    Add Your Own Goal
                  </p>
                  <div className="mt-2 flex gap-2">
                    <input
                      className="flex-1 rounded-xl border border-white/20 bg-slate-950/70 px-4 py-2 text-xs text-white transition placeholder:text-slate-500 focus:border-amber-300 focus:outline-none"
                      value={newGoal}
                      onChange={(event) => setNewGoal(event.target.value)}
                      placeholder="e.g., Draft the rival's monologue"
                    />
                    <button
                      className="rounded-xl border border-amber-400/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-200 transition hover:border-amber-200 hover:text-amber-100"
                      onClick={handleAddGoal}
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    Story Log
                  </p>
                  <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto pr-2 text-xs text-slate-200">
                    {progressLog.length === 0 && (
                      <li className="text-slate-500">
                        Log entries populate as you collaborate.
                      </li>
                    )}
                    {progressLog.map((entry, idx) => (
                      <li key={`log-${idx}`} className="border-l border-teal-400/60 pl-3">
                        {entry}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/30 backdrop-blur">
              <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                Inspiration Foundry
              </h3>
              <p className="mt-3 text-sm text-slate-200">
                Generate image, audio, and text sparks tailored to your current
                creative thread.
              </p>
              <div className="mt-4 grid gap-3">
                <label className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-400">
                  Theme
                  <input
                    className="mt-1 w-full rounded-xl border border-white/20 bg-slate-950/70 px-4 py-2 text-sm text-white transition focus:border-teal-300 focus:outline-none"
                    value={inspirationInput.theme}
                    onChange={(event) =>
                      setInspirationInput((prev) => ({
                        ...prev,
                        theme: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-400">
                  Vibe
                  <select
                    className="mt-1 w-full rounded-xl border border-white/20 bg-slate-950/70 px-4 py-2 text-sm text-white transition focus:border-teal-300 focus:outline-none"
                    value={inspirationInput.vibe}
                    onChange={(event) =>
                      setInspirationInput((prev) => ({
                        ...prev,
                        vibe: event.target.value as (typeof VIBES)[number],
                      }))
                    }
                  >
                    {VIBES.map((vibe) => (
                      <option key={`vibe-${vibe}`} value={vibe}>
                        {vibe}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-400">
                  Medium
                  <select
                    className="mt-1 w-full rounded-xl border border-white/20 bg-slate-950/70 px-4 py-2 text-sm text-white transition focus:border-teal-300 focus:outline-none"
                    value={inspirationInput.medium}
                    onChange={(event) =>
                      setInspirationInput((prev) => ({
                        ...prev,
                        medium: event.target.value as (typeof MEDIUMS)[number],
                      }))
                    }
                  >
                    {MEDIUMS.map((medium) => (
                      <option key={`medium-${medium}`} value={medium}>
                        {medium}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-400">
                  Focus
                  <select
                    className="mt-1 w-full rounded-xl border border-white/20 bg-slate-950/70 px-4 py-2 text-sm text-white transition focus:border-teal-300 focus:outline-none"
                    value={inspirationInput.focus}
                    onChange={(event) =>
                      setInspirationInput((prev) => ({
                        ...prev,
                        focus: event.target.value as (typeof FOCI)[number],
                      }))
                    }
                  >
                    {FOCI.map((focus) => (
                      <option key={`focus-${focus}`} value={focus}>
                        {focus}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                className="mt-4 w-full rounded-2xl bg-amber-400 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-950 shadow-lg shadow-amber-500/40 transition hover:-translate-y-0.5 hover:bg-amber-300 disabled:cursor-wait disabled:opacity-60"
                onClick={handleGenerateInspiration}
                disabled={inspirationLoading}
              >
                {inspirationLoading ? "Rendering..." : "Spark Inspiration"}
              </button>

              {inspiration && (
                <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100">
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.3em] text-amber-200">
                      Text Spark
                    </p>
                    <p className="mt-1 text-slate-100">{inspiration.textSpark}</p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.3em] text-teal-200">
                      Image Prompt
                    </p>
                    <p className="mt-1 text-slate-100">
                      {inspiration.imagePrompt}
                    </p>
                    {inspiration.imageBase64 && (
                      <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`data:image/png;base64,${inspiration.imageBase64}`}
                          alt={inspiration.imagePrompt}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.3em] text-indigo-200">
                      Audio Cue
                    </p>
                    <p className="mt-1 text-slate-100">
                      {inspiration.audioPrompt}
                    </p>
                    {audioSrc && (
                      <audio
                        className="mt-2 w-full"
                        controls
                        src={audioSrc}
                        preload="metadata"
                      >
                        Your browser does not support audio playback.
                      </audio>
                    )}
                  </div>
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">
                      Tags
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {inspiration.vibeTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/20 px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-slate-100"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-xs text-slate-300 shadow-lg shadow-slate-950/30 backdrop-blur">
              <h3 className="font-semibold uppercase tracking-[0.3em] text-slate-300">
                Need a hand?
              </h3>
              <p className="mt-3">
                Troubleshooting the API? Ensure{" "}
                <code className="rounded bg-slate-900 px-1 py-0.5 text-teal-200">
                  OPENAI_API_KEY
                </code>{" "}
                is available on the server. Story beats are stored client-side
                so you can export them however you like.
              </p>
              <p className="mt-3">
                Curious about updates?{" "}
                <Link
                  className="text-teal-200 underline underline-offset-4"
                  href="https://github.com/vercel/ai"
                  target="_blank"
                  rel="noreferrer"
                >
                  Explore AI tooling
                </Link>
                .
              </p>
            </section>
          </aside>
        </section>

        {error && (
          <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100 shadow-lg shadow-rose-500/30">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
