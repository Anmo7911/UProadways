# रात की बस · Raat Ki Bus

A working recreation of the **busdriver.wtf** UI/UX — a nonstop retro Hindi-songs
playlist player with a bus-ticket hero, dashboard-style player bar, mood filters,
keyboard shortcuts, a horn button, and a "share your ticket" modal.

This is an **original build** (own code, own art direction, own copy, own
branding/name) that reproduces the *experience* — not a byte-for-byte copy of
the live site's code, text, or images. Song titles/artists are factual data,
not copyrightable expression, so the playlist uses real classic Hindi songs.

## Run it

No build step needed — it's plain HTML/CSS/JS.

1. Unzip the folder.
2. Open `index.html` directly in a browser, **or** for full YouTube-embed
   playback (some browsers block the YouTube API over `file://`), serve it
   locally:
   ```bash
   cd raat-ki-bus
   python3 -m http.server 8080
   # then open http://localhost:8080
   ```

## How playback works

Each track plays through YouTube's `listType=search` embed — the player looks
up the song title + artist and plays the top match live, so you don't need
hard-coded video IDs (and it keeps working as videos get taken down/re-uploaded).
If you have your own confirmed video IDs, swap the `player.loadPlaylist(...)`
call in `script.js` for `player.loadVideoById(id)` for exact control.

## Structure

```
index.html    — markup: ticket hero, track list, dashboard player bar, modal
styles.css    — dark "night highway" theme: amber/tail-light palette, ticket
                stub with perforated edge, dashboard console player bar
script.js     — clock, mood filtering, YouTube IFrame API playback,
                keyboard shortcuts, horn sound (Web Audio), share modal
tracks.js     — playlist data (title / artist / mood tags)
```

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Space` | Play / pause |
| `←` `→` | Seek -5s / +5s |
| `N` `P` | Next / previous track |
| `Q` | Scroll to queue |
| `T` | Open share-ticket modal |
| `H` | Honk the horn |

## Deploying on Vercel

This is a plain static site — no build step needed.

1. Push this folder to a GitHub repo.
2. On [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Framework preset: **Other**. Leave the build command empty and the output
   directory as the repo root — there's nothing to compile.
4. Deploy. `vercel.json` is already included (clean URLs + basic caching for
   `styles.css` / `script.js`); no extra config needed.

YouTube playback needs a real `http(s)` origin (not `file://`), so it works
best once deployed rather than opened directly from disk.

## Customizing

- **Swap the playlist**: edit `tracks.js`.
- **Swap the branding**: search/replace "रात की बस" / "Raat Ki Bus" / "NH 44"
  / "Anand" in `index.html`.
- **Swap thumbnails**: replace the `THUMB_POOL` emoji in `tracks.js` with real
  `<img>` cover art paths, and update the `.track__art` rendering in
  `script.js` to use `<img>` instead of emoji text.
- **Colors**: everything is driven by CSS variables at the top of
  `styles.css` (`--bg`, `--amber`, `--tail`, etc).
