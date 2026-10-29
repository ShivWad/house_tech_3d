# House Switch: scroll-driven pitch prototype

A cinematic, scroll-controlled 3D journey for a premium switch manufacturer: dusk exterior → video doorbell close-up (key press, bell lights, door swings open) → through the front door → close-up of a 2×2 champagne key panel → four presses that switch on a wall light, an artwork spotlight, a display niche and corridor path lights → a wide view of the lit room, then a free "Try the switches" mode.

Stack: Vite, React 19, Three.js, React Three Fiber, Drei and GSAP ScrollTrigger. Everything is procedural, so there are no model, texture or HDR downloads and no API keys. Fonts are self-hosted from `@fontsource-variable`.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the build
```

## How it works

- **One timeline.** GSAP ScrollTrigger scrubs `anim.p` (0 → 1) over a tall, empty scroll track while the canvas stays `position: fixed`. The camera, key travel, light levels and every text fade are pure functions of `p` (`src/config/journey.js`). Reverse, fast or jumpy scrolling therefore always lands on the same frame. This was checked by pixel-diffing a rapid-scroll frame against a reverse-scroll frame: the difference was zero.
- **Explore mode** is a separate state. Entering it locks page scroll and blends `anim.modeT` from the journey camera and lights to a fixed view and manual light levels. From inside the house the camera moves there; from outside, a short fade to dark covers the cut so the camera never flies through walls. Exit with "Back to journey" or Esc. "Replay" fades out, resets to the top and fades back in.
- **Rendering** uses `frameloop="demand"`, so a frame is drawn only when an animated value changes. One light casts shadows (the art spot). There is no post-processing. Glow comes from real light sources plus additive decals on the lit surfaces, not from a global brightness filter. Every light stays mounted at intensity 0 when off, so toggling never recompiles shaders.
- **Accessibility.** The HTML panel replica (buttons with `aria-pressed`) and keys 1–4 toggle the lights, and every control has a visible focus state. With `prefers-reduced-motion`, visitors get a static room view with working controls and an opt-in "Play the journey" button. Without WebGL, or if the scene crashes, a drawn room elevation responds to the same controls.

## Where to tune things

| What | File |
| --- | --- |
| Scroll length, press timings, text timings, camera keyframes (landscape + `portrait` overrides), explore view | `src/config/journey.js` |
| Light colours and intensities (dusk context and the four fixtures) | `src/config/lighting.js` |
| Key-cap finish, engraving, panel dimensions and key travel; room surface finishes | `src/config/materials.js` |
| Doorbell finish, size, accent light and glow levels | `src/config/materials.js` (`DOORBELL_FINISH`) |
| Panel and doorbell positions, room dimensions, fixture positions | `src/scene/layout.js` |
| Procedural textures (plaster, oak, travertine, labels, glow shapes) | `src/scene/textures.js` |

## Placeholders and limitations

- **Brand.** "Wordmark" with a 2×2 glyph is a placeholder. Copy is limited to the brief's lines plus "Four keys. One room."
- **Enquiry form.** "Discuss your project" opens a form that is **not connected** to anything. Submitting shows "Nothing was sent". No contact details were invented.
- **Product.** The panel is modelled by eye from the reference photo. Its dimensions are slightly enlarged so it reads in wide shots. Press behaviour (momentary key, light follows) is a visual demonstration, not a product specification.
- **Architecture and landscape** are art-directed procedural geometry, not a real project. The tree and cypresses are deliberately simple silhouettes.
- **Verification** was done in headless Chromium with software WebGL (SwiftShader) at 1440×810 and 390×844. It covered the full journey, reverse and rapid scrolling, explore mode (HTML keys, 1–4 shortcuts, clicking the 3D panel, Esc), replay, the enquiry dialog, reduced motion and the no-WebGL fallback. Not yet checked: real GPUs, real phones (iOS Safari address-bar resizing in particular), frame rate, and screen readers.
- Textures are generated on the main thread at startup. This takes a moment on low-end phones.
- The main JS bundle is about 1.2 MB minified (about 360 kB gzip) because Three.js loads with the app shell. It could be split further if load time matters.
