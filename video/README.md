# Grainline promo video

A 32-second promo clip (1920×1080, 30 fps) made with [Remotion](https://www.remotion.dev).
It draws the products with the site's own `drawing.js` and prices them with
`pricing.js`, so the video stays in step with the shop.

```sh
cd video
npm install
npm run studio   # preview and scrub through it in the browser
npm run render   # writes out/grainline-promo.mp4
```

Scenes live in `src/scenes/`, in the order and lengths listed in `src/Promo.tsx`.
Colors, fonts and the shared animation helpers are in `src/theme.tsx`.
