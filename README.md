## StoryWeaver Studio

StoryWeaver Studio is an AI-powered companion for writers, filmmakers, and artists. It blends interactive storytelling, real-time critique, multimedia inspiration, and habit-building tools into a single creative dashboard.

### Features

- Dynamic, choose-your-own-adventure story beats with twists, character insights, and genre-aware narration.
- Instant creative feedback covering structure, pacing, dialogue, and character arcs.
- Multimedia sparks: detailed DALL·E-ready prompts, ambient audio cues (mp3), and evocative text sparks.
- Progress tracking with auto-generated micro-goals, daily/weekly challenges, and a running story log.
- One-click genre pivoting that preserves core characters while reimagining the world.

### Local Development

1. Install dependencies

```bash
npm install
```

2. Provide an OpenAI API key (copy `.env.local.example` to `.env.local` and fill in your key).

3. Start the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to launch the studio.

### Deployment

Deploy instantly to Vercel:

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-1878d5b0
```

Once live, verify the build with:

```bash
curl https://agentic-1878d5b0.vercel.app
```
