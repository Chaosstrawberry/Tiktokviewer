# TikView

TikView is a static, mobile-first web wrapper for watching TikTok videos through TikTok's official embedded player.

## Features

- 100% static: GitHub Pages compatible
- No Node.js, npm, server, database, or account system
- Dark, mobile-first UI
- Full TikTok video URL support
- Best-effort shortened-link support using TikTok's official oEmbed endpoint
- Official TikTok Embed Player at `https://www.tiktok.com/player/v1/{video_id}`
- Local "My Feed" powered by `localStorage`
- Vertical snap-scrolling feed
- Lazy loading of nearby feed players to reduce memory use on phones
- Copy link and fullscreen controls
- PWA manifest + service worker
- Hash-based routing, so it works cleanly on GitHub Pages without server rewrites

## Important note about shortened links

GitHub Pages is static and browser JavaScript cannot always follow arbitrary third-party redirects because of cross-origin restrictions. TikView therefore tries TikTok's official `oEmbed` endpoint when a URL does not contain a video ID directly. If TikTok does not expose the canonical video through that request, TikView asks the user for the full `www.tiktok.com/@user/video/...` URL.

This is intentionally **not** a downloader and does not attempt to retrieve arbitrary MP4 files.

## Deploy to GitHub Pages

1. Create a new GitHub repository.
2. Upload everything in this folder, preserving `assets/icon.svg`.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select your main branch and `/ (root)`.
6. Save.

GitHub Pages will publish the site. No build command is needed.

## Local testing

You can open `index.html` directly for most UI work. For service-worker/PWA testing, use any simple static HTTP server or GitHub Pages itself; service workers require a secure context such as HTTPS (localhost is also allowed).

## Files

```text
TikView/
├── index.html
├── style.css
├── app.js
├── manifest.json
├── service-worker.js
├── README.md
└── assets/
    └── icon.svg
```
