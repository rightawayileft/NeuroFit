# NeuroRehab Tracker

## Quick Start (Local Dev)

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. Since `host: true` is set in vite config, you can also access it from your phone on the same Wi-Fi at `http://<your-computer-ip>:5173`.

## Your App File

Drop your latest app file into `src/` and rename it to `App.jsx`:

```
src/
  App.jsx    ← your AppV12.jsx (or whatever version), renamed
  main.jsx   ← entry point (don't edit)
```

That's it. No changes needed to the app file itself.

## Deploy to Vercel (via GitHub)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com), sign in with GitHub
3. Click **"Add New Project"** → import your repo
4. Vercel auto-detects Vite — just click **Deploy**
5. You'll get a URL like `neurorehab-tracker.vercel.app`

On your Android phone, open the URL in Chrome → tap **⋮** menu → **"Add to Home Screen"**. It will install as a standalone app (no browser bar) thanks to the manifest.

## App Icons

The manifest references `icon-192.png` and `icon-512.png` in `/public`. You need to provide these for the home screen icon to display. Options:

- **Quick**: Use any online PNG generator (e.g. [realfavicongenerator.net](https://realfavicongenerator.net)) to create icons from an image or the included `favicon.svg`
- **Placeholder**: The app works fine without them — you'll just get a generic browser icon on the home screen

## Data & Backups

- All data is stored in **localStorage** in your browser
- Use the **Export** button in Settings to download a JSON backup
- Use the **Import** button to restore from a backup
- Data persists as long as you don't clear browser data
- **Back up regularly** — localStorage is not a database

## Updating the App

When you have a new version of the app file:

1. Replace `src/App.jsx` with the new version
2. Commit and push to GitHub
3. Vercel auto-deploys within ~30 seconds

Your localStorage data in the browser is untouched by deploys.
