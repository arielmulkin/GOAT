# GOAT

An NBA knowledge game. Each round spins a random era; you assign it to an open
slot and name a player from that era — blind. You bank their real number for that
category (trophies or career averages), graded against the all-time best. Your
GOAT Index is the average across every slot you fill.

## Run locally
```bash
npm install
npm run dev
```

## Build
```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build
```

## Deploy to GitHub Pages
```bash
npm run deploy     # builds and pushes dist/ to a gh-pages branch
```
Then in your repo: Settings → Pages → set Source to the `gh-pages` branch.

## Editing the data
All player data lives in `src/GOAT.jsx` in the `PLAYERS` array — one row per
player, every field labeled. Scoring weights/tiers are in `TIERS`.
