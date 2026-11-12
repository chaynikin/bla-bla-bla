# Chaynikin Links

A static one-page site with a glowing 3D chocolate bar in a detailed black-and-gold wrapper, floating over a WebGL scene of drifting chocolate, cocoa beans, hazelnuts and gold foil above a lake of molten chocolate. The background blurs with distance like frosted glass. The links to TikTok, Instagram, GitHub, VK and Telegram, plus an email piece, are pressed into the bar's pieces: tap a piece to open it, drag or swipe (or use the arrow keys) to turn the bar. The email piece opens a short form that hands off to the visitor's mail app.

Set your profile URLs and email address in the `CONFIG` block at the top of `script.js`.

## Editing

- `index.html`, `style.css`, `script.js`: the page, the bar and the links. No build needed.
- `src/background.js`: the 3D background. After editing it, run `npm install` once and then `npm run build`, which regenerates the committed `background.js`.
- After changing any file, bump the `?v=` number on the asset links in `index.html`. Cloudflare tells browsers to cache scripts for hours, and without a new number visitors can get the new page with an old script.

Icons come from [Simple Icons](https://simpleicons.org) (CC0); the background uses [three.js](https://threejs.org) (MIT).
