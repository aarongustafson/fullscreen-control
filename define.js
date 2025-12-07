import { FullscreenControlElement } from './fullscreen-control.js';

export function defineFullscreenControl(tagName = 'fullscreen-control') {
	const hasWindow = typeof window !== 'undefined';
	const registry = hasWindow ? window.customElements : undefined;

	if (!registry || typeof registry.define !== 'function') {
		return false;
	}

	if (!registry.get(tagName)) {
		registry.define(tagName, FullscreenControlElement);
	}

	return true;
}

defineFullscreenControl();
