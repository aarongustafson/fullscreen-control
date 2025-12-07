# fullscreen-control Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/fullscreen-control.svg)](https://www.npmjs.com/package/@aarongustafson/fullscreen-control) [![Build Status](https://img.shields.io/github/actions/workflow/status/aarongustafson/fullscreen-control/ci.yml?branch=main)](https://github.com/aarongustafson/fullscreen-control/actions)

A web component to add progressively enhance any video or iframe element to have fullscreen capabilities.

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
  <!-- Your content here -->
</fullscreen-control>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `example-attribute` | `string` | `""` | Description of the attribute |

## Events

The component fires custom events that you can listen to:

| Event | Description | Detail |
|-------|-------------|--------|
| `fullscreen-control:event` | Fired when something happens | `{ data }` |

### Example Event Handling

```javascript
const element = document.querySelector('fullscreen-control');

element.addEventListener('fullscreen-control:event', (event) => {
  console.log('Event fired:', event.detail);
});
```

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--example-color` | `#000` | Example color property |

### Example Styling

```css
fullscreen-control {
  --example-color: #ff0000;
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
