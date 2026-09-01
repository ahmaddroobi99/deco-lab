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

Platform script tests (`scripts/**/*.test.mjs`) remain from the App
Builder template.

Interactive 3D is verified in-browser (WebGL). Unit tests do not spin
WebGL.
