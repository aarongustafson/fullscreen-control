# `fullscreen-control` Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/fullscreen-control.svg)](https://www.npmjs.com/package/@aarongustafson/fullscreen-control) [![Build Status](https://img.shields.io/github/actions/workflow/status/aarongustafson/fullscreen-control/ci.yml?branch=main)](https://github.com/aarongustafson/fullscreen-control/actions)

A web component to progressively enhance any video or iframe element with fullscreen capabilities.

## Demo

[Live Demo](https://aarongustafson.github.io/fullscreen-control/demo/) ([Source](./demo/index.html))

## Installation

```bash
npm install @aarongustafson/fullscreen-control
```

## Usage

### Option 1: Auto-define the custom element (easiest)

Import the package to automatically define the `<fullscreen-control>` custom element:

```javascript
import '@aarongustafson/fullscreen-control';
```

Or use the define-only script in HTML:

```html
<script src="./node_modules/@aarongustafson/fullscreen-control/define.js" type="module"></script>
```

### Option 2: Import the class and define manually

Import the class and define the custom element with your preferred tag name:

```javascript
import { FullscreenControlElement } from '@aarongustafson/fullscreen-control/fullscreen-control.js';

customElements.define('my-custom-name', FullscreenControlElement);
```

### Basic Example

```html
<fullscreen-control>
  <video src="video.mp4"></video>
</fullscreen-control>
```

Or with an iframe:

```html
<fullscreen-control button-text="View {name} fullscreen">
  <iframe src="https://example.com" title="Product teaser"></iframe>
</fullscreen-control>
```

## Accessibility

The component automatically manages focus for keyboard accessibility. When the fullscreen button is clicked to enter fullscreen mode, focus will automatically return to the button after exiting fullscreen, ensuring a seamless keyboard navigation experience. The control also links the button to the wrapped media via `aria-controls`, generating a unique `id` for the slotted element when it does not already have one.

Both `button-text` and `button-label` support the `{name}` placeholder. If the slotted video or iframe has an accessible name (via `aria-label`, `title`, or other native naming), `{name}` will be replaced with that value; otherwise it resolves to an empty string.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `button-text` | `string` | `"View fullscreen"` | Visible text for the fullscreen button. Supports `{name}` to inject the slotted media's accessible name. |
| `button-label` | `string` | `""` (falls back to `button-text`) | Optional aria-label for the fullscreen button. Supports `{name}`. Only set this when the screen reader announcement should differ from the visible text; otherwise omit it so it mirrors `button-text`. |

## Events

The component fires custom events that you can listen to:

| Event | Description | Detail |
|-------|-------------|--------|
| `fullscreen-control:enter` | Fired when entering fullscreen mode | `CustomEvent` |
| `fullscreen-control:exit` | Fired when exiting fullscreen mode | `CustomEvent` |

### Example Event Handling

```javascript
const element = document.querySelector('fullscreen-control');

element.addEventListener('fullscreen-control:enter', (event) => {
  console.log('Entered fullscreen');
});

element.addEventListener('fullscreen-control:exit', (event) => {
  console.log('Exited fullscreen');
});
```

## Methods

| Method | Description |
|--------|-------------|
| `enterFullscreen()` | Programmatically enter fullscreen mode |
| `exitFullscreen()` | Programmatically exit fullscreen mode |
| `toggleFullscreen()` | Toggle fullscreen mode on/off |

## CSS Custom Properties

The component uses light DOM, so you can style the button directly using standard CSS selectors. Additionally, two CSS custom properties are available for positioning:

| Property | Default | Description |
|----------|---------|-------------|
| `--fullscreen-control-button-inset-block-start` | `0.5rem` | Block-start (top) position of the button |
| `--fullscreen-control-button-inset-inline-end` | `0.5rem` | Inline-end (right in LTR) position of the button |

### Example Styling

```css
/* Style the button directly */
fullscreen-control button {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 20px;
}

/* Adjust button position */
fullscreen-control {
  --fullscreen-control-button-inset-block-start: 1rem;
  --fullscreen-control-button-inset-inline-end: 1rem;
}
```

## Browser Support

This component uses modern web standards:
- Custom Elements v1
- Shadow DOM v1
- ES Modules

For older browsers, you may need polyfills.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# View demo
open demo/index.html
```

## License

MIT © [Aaron Gustafson](https://www.aaron-gustafson.com/)
