// Type definitions for fullscreen-control web component
// Project: fullscreen-control
// Definitions by: Aaron Gustafson

export type FullscreenControlEnterEvent = CustomEvent<void>;
export type FullscreenControlExitEvent = CustomEvent<void>;

export class FullscreenControlElement extends HTMLElement {
	/** Visible button text. Supports the `{name}` token. */
	buttonText: string;
	/** Optional aria-label text. Supports the `{name}` token. */
	buttonLabel: string;

	/** Programmatically enters fullscreen mode. */
	enterFullscreen(): Promise<void>;
	/** Programmatically exits fullscreen mode. */
	exitFullscreen(): Promise<void>;
	/** Toggles fullscreen mode based on the current state. */
	toggleFullscreen(): void;

	addEventListener(
		type: 'fullscreen-control:enter',
		listener: (event: FullscreenControlEnterEvent) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	addEventListener(
		type: 'fullscreen-control:exit',
		listener: (event: FullscreenControlExitEvent) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	addEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: boolean | AddEventListenerOptions,
	): void;
}

declare global {
	interface HTMLElementTagNameMap {
		'fullscreen-control': FullscreenControlElement;
	}
}
