# Testing

```bash
npm test
npm run typecheck
npm run lint
```

Critical coverage lives in `src/lib/deco/deco.test.ts`:

- official mesh topology and scale
- sitting vs standing maps differ
- hip contact higher when sitting
- colormap / official 0.5 threshold
- pose cues
- health/system API contract
- PLY / OBJ export topology

Platform script tests (`scripts/**/*.test.mjs`) remain from the App
Builder template. Tests that read `AGENTS.md` or `.grok/skills/` **skip**
when those sandbox files are absent (they are not shipped on GitHub).
`.grok/app-env.json` **is** shipped so `VITE_AUTH_ENABLED=false` is
reproducible in CI and on Vercel.

Interactive 3D is verified in-browser (WebGL). Unit tests do not spin
WebGL.
