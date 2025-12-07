import { beforeAll } from 'vitest';
import { FullscreenControlElement } from '../fullscreen-control.js';

// Define the custom element before tests run
beforeAll(() => {
	if (!customElements.get('fullscreen-control')) {
		customElements.define('fullscreen-control', FullscreenControlElement);
	}

	// Make the class available globally for testing static methods
	globalThis.FullscreenControlElement = FullscreenControlElement;
});
