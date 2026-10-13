# Grainline promo videos

Two clips made with [Remotion](https://www.remotion.dev), both at 30 fps:

- **Promo**: 32 seconds, 1920×1080, for the website or YouTube.
- **TikTok**: 12 seconds, 1080×1920, for TikTok and Reels. A walnut board is
  cut and oiled, then the three pieces are built and lit.

They draw the products with the site's own `drawing.js` and price them with
`pricing.js`, so the videos stay in step with the shop.

```sh
cd video
npm install
npm run studio          # preview and scrub through them in the browser
npm run render          # writes out/grainline-promo.mp4
npm run render:tiktok   # writes out/grainline-tiktok.mp4
```

Landscape scenes live in `src/scenes/` (order and lengths in `src/Promo.tsx`),
vertical ones in `src/tiktok/` (order and lengths in `src/TikTok.tsx`). The
hinge logo used by both is `src/Hinge.tsx`.
Colors, fonts and the shared animation helpers are in `src/theme.tsx`.
