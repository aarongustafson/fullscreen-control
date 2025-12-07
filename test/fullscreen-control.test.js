import { describe, it, expect, beforeEach } from 'vitest';
import { FullscreenControlElement } from '../fullscreen-control.js';

describe('FullscreenControlElement', () => {
	let element;

	beforeEach(() => {
		element = document.createElement('fullscreen-control');
		document.body.appendChild(element);
	});

	it('should be defined', () => {
		expect(customElements.get('fullscreen-control')).toBe(FullscreenControlElement);
	});

	it('should create an instance', () => {
		expect(element).toBeInstanceOf(FullscreenControlElement);
		expect(element).toBeInstanceOf(HTMLElement);
	});

	it('should have a shadow root', () => {
		expect(element.shadowRoot).toBeTruthy();
	});

	// Add more tests here
});
