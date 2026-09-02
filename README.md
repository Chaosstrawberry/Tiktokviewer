# TikView

Mobile-first TikTok web viewer with Share → Copy link support and a local doomscroll feed.

## Run

Requires Node.js 18+.

```bash
npm install
npm start
```

Open http://localhost:3000

## Features

- iPhone/mobile-first UI
- Paste button
- Supports normal TikTok video URLs
- Resolves TikTok Share short links such as vm.tiktok.com when TikTok redirects them to a video URL
- Official TikTok web player
- Fullscreen
- Copy link
- Local doomscroll feed with swipe/scroll snap
- No database

## Downloading

Direct raw MP4 downloading is intentionally not included. TikTok's official embedded player/API does not provide a general raw MP4 URL for arbitrary public videos.

## Hosting

Because `server.js` is required for Share-link resolution, this is not a static GitHub Pages project. Use a Node.js host and run `npm install` followed by `npm start`.
