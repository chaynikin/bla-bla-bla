# Chaynikin Links

A static one-page site for Chaynikin's links. When the page opens, a pixel-art chocolate bar flies in, cracks along its grooves and breaks into six pieces; each piece is a link to TikTok, Instagram, GitHub, VK, Telegram or email. The pieces stay put (they can't be turned); tap one to open it, hover to turn it into white chocolate. Tapping during the entrance skips ahead, and visitors who prefer reduced motion see the separated tiles straight away. The email tile opens a short form that hands off to the visitor's mail app.

Behind the pieces is a WebGL scene of drifting chocolate bars, chunks, cocoa beans, hazelnuts and gold foil above a lake of molten chocolate, blurred with distance like frosted glass. It is drawn in the same pixel-art style as the pieces: the same chocolate colours, the same dithering and light from the top left. There is no visible heading; the page title stays for screen readers.

Set your profile URLs and email address in the `CONFIG` block at the top of `script.js`.

## Editing

- `index.html`, `style.css`, `script.js`: the page, the tiles and the links. No build needed.
- The pixel size, icon colours and piece size are CSS variables at the top of `style.css` (`--px`, `--icon-color`, `--tile-color`, `--tile-size`); the chocolate shades are the `RAMPS` in `script.js`, which the background uses too.
- `src/background.js`: the 3D background. After editing it, run `npm install` once and then `npm run build`, which regenerates the committed `background.js`.
- After changing any file, bump the `?v=` number on the asset links in `index.html`. Cloudflare tells browsers to cache scripts for hours, and without a new number visitors can get the new page with an old script.

Icons come from [Simple Icons](https://simpleicons.org) (CC0); the background uses [three.js](https://threejs.org) (MIT).
