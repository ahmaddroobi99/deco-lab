# Development

- Product UI: `src/components/lab`
- Domain: `src/lib/deco`
- Routes: `src/routes`
- Tokens: `src/styles.css`

`npm run dev` uses Vite HMR. Do not bind a second preview port for the
live App Builder pane.

Estimator changes should keep:

- `contactProbability.length === 6890`
- values in `(0, 1)`
- threshold as visualization-only
