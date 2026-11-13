# `fullscreen-control` Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/fullscreen-control.svg)](https://www.npmjs.com/package/@aarongustafson/fullscreen-control) [![Build Status](https://img.shields.io/github/actions/workflow/status/aarongustafson/fullscreen-control/ci.yml?branch=main)](https://github.com/aarongustafson/fullscreen-control/actions)

Adds a fullscreen button to the first video or iframe inside a light-DOM custom
element. The media itself enters fullscreen; the host and button do not.
Author native media controls and useful links so the content remains usable
before JavaScript loads or when fullscreen is unavailable.

## Demos

- [Full examples](https://aarongustafson.github.io/fullscreen-control/demo/) ([source](./demo/index.html))
- [esm.sh class import](https://aarongustafson.github.io/fullscreen-control/demo/esm) ([source](./demo/esm.html))
- [unpkg automatic registration](https://aarongustafson.github.io/fullscreen-control/demo/unpkg) ([source](./demo/unpkg.html))

## Installation and registration

```bash
npm install @aarongustafson/fullscreen-control
```

Import the definition module to register the default tag automatically:

```javascript
import '@aarongustafson/fullscreen-control/define.js';
```

The package root and `fullscreen-control.js` export only the class. For manual
registration, import the class and register it once:

```javascript
import { FullscreenControlElement } from '@aarongustafson/fullscreen-control';

customElements.define('fullscreen-control', FullscreenControlElement);
```

Importing `define.js` already calls `defineFullscreenControl()`. Calling that
helper again for an existing tag returns `true`; it does not defer registration.
Without a usable browser registry, it returns `false`. Reusing the already
registered constructor for another unregistered tag throws `NotSupportedError`.
For a custom tag, use a class-only import without importing `define.js`.
The injected selectors target `fullscreen-control`, so custom tags also need
author-provided host and button layout rules.
The module still loads a class extending `HTMLElement`; the guard does not make
imports safe in a DOM-free server process.

## Basic use and fallback

```html
<fullscreen-control button-text="View {name} fullscreen">
  <video src="video.webm" controls aria-label="Product demonstration">
    <track kind="captions" src="captions.vtt" srclang="en" label="English" />
    <a href="video.webm">Open the video</a>
  </video>
</fullscreen-control>
<p><a href="transcript.html">Read the transcript and visual description</a>.</p>
```

Use your own media, captions, and equivalent descriptions. The component adds
`controls` to videos after enhancement, but author it in HTML for the
no-JavaScript fallback. Do not rely on video fallback children alone for
loading errors; keep a visible direct link or transcript outside the video.

For embedded content:

```html
<fullscreen-control>
  <iframe
    src="presentation.html"
    title="Product presentation"
    allow="fullscreen"
    allowfullscreen
  ></iframe>
</fullscreen-control>
<a href="presentation.html">Read the presentation outside the frame</a>
```

The component adds fullscreen permission attributes to iframes. Its current
enhancement replaces the iframe’s `allow` attribute with `fullscreen`; it does
not preserve other permission directives. Check your embed’s needs and the
page’s Permissions Policy before adopting it.

## Labels and localization

| Attribute      | Property      | Default             | Behavior                                                                        |
| -------------- | ------------- | ------------------- | ------------------------------------------------------------------------------- |
| `button-text`  | `buttonText`  | `"View fullscreen"` | Visible text; missing or empty values use the default.                          |
| `button-label` | `buttonLabel` | `""`                | Optional accessible name. Empty or identical resolved labels omit `aria-label`. |

Both string properties reflect to their attributes. Setting `null`, `undefined`,
or an empty string removes the attribute. Getters return the defaults above.
The bundled TypeScript declarations describe the string-valued public API.

Every `{name}` token uses the media’s first nonempty `aria-label` or `title`,
then an empty string. This is not a full accessible-name calculation:
`aria-labelledby`, captions, and other native naming sources are not consulted.
Text is inserted literally, not parsed as HTML.

Author translated labels and set the content language:

```html
<fullscreen-control lang="ja" button-text="全画面表示">
  <video src="video.webm" controls aria-label="製品の紹介"></video>
</fullscreen-control>
```

When providing a distinct `button-label`, include the visible wording in that
name so speech-input users can refer to what they see. Localize the media’s name,
fallback instructions, captions, and descriptions too.

### Icon-only buttons

Give an icon-only button an authored accessible name. For example, a diagonal
two-headed arrow can represent fullscreen without becoming the button’s
screen-reader name:

```html
<fullscreen-control
  class="icon-only"
  button-text="⤢"
  button-label="View {name} fullscreen"
>
  <video src="video.webm" controls aria-label="Product demonstration"></video>
</fullscreen-control>
```

Translate `button-label` and the media name for the content language. Keep a
visible explanation of the icon’s purpose nearby. The demo gives this button a
minimum 44px target and retains its native focus indicator.

## Methods and events

| Method               | Return          | Behavior                                                          |
| -------------------- | --------------- | ----------------------------------------------------------------- |
| `enterFullscreen()`  | `Promise<void>` | Requests fullscreen for the media; normally needs a user gesture. |
| `exitFullscreen()`   | `Promise<void>` | Requests exit only when this media is fullscreen.                 |
| `toggleFullscreen()` | `void`          | Starts entry or exit without returning its promise.               |

The component logs request failures to the console. These methods do not
return a success flag or render a visible error; absent browser methods can
also leave the media unchanged. Keep native controls and fallback links usable,
and provide authored, localized recovery guidance when fullscreen is important
to a task.

| Event                      | Detail      | Behavior                                            |
| -------------------------- | ----------- | --------------------------------------------------- |
| `fullscreen-control:enter` | `undefined` | Observed transition into fullscreen for this media. |
| `fullscreen-control:exit`  | `undefined` | Observed transition out of fullscreen.              |

Both are bubbling, composed `CustomEvent<void>` events. They report observed
`fullscreenchange` transitions, not merely a request. Vendor-prefixed request
methods are attempted as fallbacks, but prefixed-only change events are not
observed. Do not treat method completion as proof that fullscreen succeeded.

```javascript
const control = document.querySelector('fullscreen-control');
control.addEventListener('fullscreen-control:exit', () => {
  console.log('Media left fullscreen');
});
```

## Styling and focus

There is no shadow root. The component injects one shared style element per
document: the default host is relatively positioned and inline-block, with an
absolutely positioned native button at the top-right. It honors `hidden` and
does not inject a color palette or replace native focus styling.

| CSS custom property                             | Default  | Purpose                             |
| ----------------------------------------------- | -------- | ----------------------------------- |
| `--fullscreen-control-button-inset-block-start` | `0.5rem` | Block-start offset for the overlay. |
| `--fullscreen-control-button-inset-inline-end`  | `0.5rem` | Inline-end offset for the overlay.  |

Keep the button overlaid while allowing room for long labels and enlarged
text. The demos place media and button in the same grid cell, leaving a clear
strip for native playback controls. The media area grows when the label needs
more height; the button does not move below it. The positioning hooks still
control its offsets. For example, wrap the component in an element with
`class="media-example"`:

```css
.media-example fullscreen-control {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.media-example video,
.media-example iframe {
  grid-area: 1 / 1;
  inline-size: 100%;
  block-size: 100%;
  aspect-ratio: 16 / 9;
}

.media-example fullscreen-control > button {
  position: static;
  grid-area: 1 / 1;
  place-self: start end;
  max-inline-size: calc(
    100% - var(--fullscreen-control-button-inset-inline-end, 0.5rem) - 0.5rem
  );
  min-block-size: 2.75rem;
  margin-block-start: var(
    --fullscreen-control-button-inset-block-start,
    0.5rem
  );
  margin-inline-end: var(--fullscreen-control-button-inset-inline-end, 0.5rem);
  margin-block-end: 3rem;
  padding: 0.5rem 1rem;
  font: inherit;
  overflow-wrap: anywhere;
  border: 1px solid currentColor;
  background-color: Canvas;
  background-image: linear-gradient(ButtonFace, ButtonFace);
  color: ButtonText;
}

.media-example .icon-only > button {
  inline-size: 2.75rem;
  padding: 0.25rem;
  font-size: 1.75rem;
  line-height: 1;
}
```

The Canvas backing keeps translucent button surfaces opaque over media.
Keep foreground/background pairs together and check text and boundaries for
custom themes, including hover. Avoid opacity-based dimming and blanket
`forced-color-adjust: none`. The demos retain native focus, use foreground
boundaries, and provide an opt-in red theme with a matching white foreground.
Their prose uses Canvas/CanvasText and code/event output uses Canvas-backed
Field/FieldText. Only the Canvas-backed footer uses an 80% foreground mix;
increased contrast and forced colors restore the full foreground.

The button gets `aria-controls`, using an existing media ID or generating one.
Name and ID attribute changes update its label and association. Activation
through the component’s button requests focus return after an observed exit.
Programmatic entry does not set that request. Escape handling and native
fullscreen controls depend on browser support and focus within embedded content.
The component adds `role="group"` only when the author did not provide a role.

## Lifecycle and browser limits

Initialization is scheduled for an animation frame, with a timer fallback.
Direct-child media or wrapper insertion/removal rebuilds the enhancement;
changes inside an unchanged nested wrapper are not watched for media replacement.
Attribute changes update labels without rebuilding the button.

Disconnecting cancels scheduled work, removes the button and listeners,
disconnects observers, and restores patched target attribute methods. It does
not remove the shared style element or restore generated IDs, roles, video
controls, or iframe permission attributes. Rebuilding can replace a focused
button; manage focus when changing the media structure.

This component needs Custom Elements, ES modules, and a supported Fullscreen API.
It uses light DOM, not Shadow DOM. Platform video fullscreen, embedded-content
policies, and mobile browser behavior differ; older engines may need polyfills
or may only offer their native media controls.

Automated tests cover Chromium, Firefox, and WebKit, study-palette substitution,
light/dark rendering, focus, names, lifecycle, reflow, and fallbacks. Bundled
Ubuntu WebKit’s native dark ButtonText/ButtonFace contrast is a known limitation
tracked separately from the study palettes. Root-font enlargement does not
prove browser zoom. Real Windows Contrast themes, Firefox custom colors,
mobile hardware, assistive technology, and platform-specific fullscreen
behavior still need acceptance testing.

## Development

```bash
npm install
npm test
npm run test:coverage
npm run test:browser
npm run lint
npm run format
node scripts/serve.js
```

Open <http://127.0.0.1:4183/demo/index.html>. Install the Playwright engines if
the browser runner reports them missing. The demos use a small, locally
generated silent clip, with a visible description of its complete content.
Playback needs WebM support; use the local text presentation if the clip cannot
play in your browser.
To regenerate it with the installed Chromium engine, run
`node scripts/create-demo-video.js`. It contains no third-party footage.
The text presentation is also local. CDN examples still require their named
CDN in normal use; tests intercept those modules with the checked-out source.

## License

MIT © [Aaron Gustafson](https://www.aaron-gustafson.com/)
