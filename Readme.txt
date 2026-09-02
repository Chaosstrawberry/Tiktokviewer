# TikView

A minimal web interface for watching TikTok videos directly inside a website.

## Features

- Paste TikTok video URLs
- Detect TikTok video IDs
- Embedded video player
- Play / pause
- Volume
- Progress bar
- Fullscreen
- Copy video link
- Mobile responsive
- No database
- No Node.js required
- No build process

## Files

index.html
style.css
app.js

## Run locally

Simply open:

index.html

in a modern browser.

## Host on GitHub Pages

1. Create a GitHub repository.
2. Upload:

   index.html
   style.css
   app.js
   README.md

3. Open:

   Settings → Pages

4. Select:

   Deploy from a branch

5. Select:

   main

6. Select:

   / (root)

7. Save.

GitHub will provide your website URL.

## How it works

The application extracts the TikTok post ID from URLs such as:

https://www.tiktok.com/@username/video/123456789

It then loads TikTok's official embedded player:

https://www.tiktok.com/player/v1/123456789

The video therefore stays inside the website rather than using a normal TikTok page navigation.

## Important

This project uses TikTok's official embedded player.

It does not attempt to scrape private/internal TikTok media URLs.

Some videos may be unavailable because of TikTok's availability, moderation,
regional restrictions, or the video's privacy settings.