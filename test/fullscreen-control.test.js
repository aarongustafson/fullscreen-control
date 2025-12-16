import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FullscreenControlElement } from '../fullscreen-control.js';

if (!customElements.get('fullscreen-control')) {
	customElements.define('fullscreen-control', FullscreenControlElement);
}

const waitForComponent = () =>
	new Promise((resolve) => {
		if (typeof requestAnimationFrame === 'function') {
			requestAnimationFrame(() => {
				requestAnimationFrame(resolve);
			});
			return;
		}
		setTimeout(() => {
			setTimeout(resolve, 0);
		}, 0);
	});

const setFullscreenElement = (value) => {
	Object.defineProperty(document, 'fullscreenElement', {
		configurable: true,
		writable: true,
		value,
	});
};

const originalDocumentApis = {
	exitFullscreen: document.exitFullscreen,
	webkitExitFullscreen: document.webkitExitFullscreen,
	mozCancelFullScreen: document.mozCancelFullScreen,
};

describe('FullscreenControlElement', () => {
	let element;

	const reconnectElement = async () => {
		if (element.parentNode) {
			element.remove();
		}
		document.body.appendChild(element);
		await waitForComponent();
	};

	beforeEach(() => {
		element = document.createElement('fullscreen-control');
	});

	afterEach(() => {
		if (element && element.parentNode) {
			element.remove();
		}
		const styleElement = document.getElementById(
			'fullscreen-control-styles',
		);
		if (styleElement) {
			styleElement.remove();
		}
		document.exitFullscreen = originalDocumentApis.exitFullscreen;
		document.webkitExitFullscreen =
			originalDocumentApis.webkitExitFullscreen;
		document.mozCancelFullScreen = originalDocumentApis.mozCancelFullScreen;
		setFullscreenElement(null);
	});

	it('should be defined', () => {
		expect(customElements.get('fullscreen-control')).toBe(
			FullscreenControlElement,
		);
	});

	it('should create an instance', () => {
		expect(element).toBeInstanceOf(FullscreenControlElement);
		expect(element).toBeInstanceOf(HTMLElement);
	});

	it('should not have a shadow root (light DOM)', () => {
		expect(element.shadowRoot).toBeFalsy();
	});

	describe('Light DOM best practices', () => {
		it('should keep shadow root disabled', () => {
			expect(element.shadowRoot).toBeNull();
		});

		it('should support the hidden attribute', async () => {
			const video = document.createElement('video');
			element.appendChild(video);
			element.setAttribute('hidden', '');
			await reconnectElement();
			const styleElement = document.getElementById(
				'fullscreen-control-styles',
			);
			expect(styleElement.textContent).toContain(
				'fullscreen-control[hidden] {',
			);
		});

		it('should set a default inline-block display rule', async () => {
			const video = document.createElement('video');
			element.appendChild(video);
			await reconnectElement();
			const styleElement = document.getElementById(
				'fullscreen-control-styles',
			);
			expect(styleElement.textContent).toContain('display: inline-block');
		});
	});

	describe('Host attributes', () => {
		it('applies a default role when none is provided', async () => {
			const video = document.createElement('video');
			element.appendChild(video);
			await reconnectElement();
			expect(element.getAttribute('role')).toBe('group');
		});

		it('respects an author-provided role', async () => {
			element.setAttribute('role', 'region');
			const video = document.createElement('video');
			element.appendChild(video);
			await reconnectElement();
			expect(element.getAttribute('role')).toBe('region');
		});
	});

	describe('Attributes and properties', () => {
		it('reflects button-text attribute to property', () => {
			element.setAttribute('button-text', 'Go fullscreen');
			expect(element.buttonText).toBe('Go fullscreen');
		});

		it('reflects property changes back to attributes', () => {
			element.buttonText = 'Custom label';
			expect(element.getAttribute('button-text')).toBe('Custom label');
		});

		it('removes optional attributes when set to null', () => {
			element.setAttribute('button-label', 'Screen reader');
			element.buttonLabel = null;
			expect(element.hasAttribute('button-label')).toBe(false);
		});

		it('upgrades properties assigned before definition', () => {
			const upgradeElement = new FullscreenControlElement();
			Object.defineProperty(upgradeElement, 'buttonText', {
				configurable: true,
				writable: true,
				value: 'Pre-set label',
			});
			upgradeElement._upgradeProperty('buttonText');
			expect(upgradeElement.getAttribute('button-text')).toBe(
				'Pre-set label',
			);
		});
	});

	describe('button-text attribute', () => {
		it('should have default text "View fullscreen"', () => {
			expect(element.buttonText).toBe('View fullscreen');
		});

		it('should set text via attribute', () => {
			element.setAttribute('button-text', 'Go fullscreen');
			expect(element.buttonText).toBe('Go fullscreen');
		});

		it('should set text via property', () => {
			element.buttonText = 'Custom label';
			expect(element.getAttribute('button-text')).toBe('Custom label');
			expect(element.buttonText).toBe('Custom label');
		});
	});

	describe('button-label attribute', () => {
		it('should default to empty string', () => {
			expect(element.buttonLabel).toBe('');
		});

		it('should set aria-label via attribute', () => {
			element.setAttribute('button-label', 'Custom aria label');
			expect(element.buttonLabel).toBe('Custom aria label');
		});

		it('should set aria-label via property', () => {
			element.buttonLabel = 'Another aria label';
			expect(element.getAttribute('button-label')).toBe(
				'Another aria label',
			);
			expect(element.buttonLabel).toBe('Another aria label');
		});
	});

	describe('video element enhancement', () => {
		it('should find and enhance a video element', async () => {
			const video = document.createElement('video');
			video.src = 'test.mp4';
			element.appendChild(video);

			// Trigger setup by disconnecting and reconnecting
			await reconnectElement();
			expect(video.hasAttribute('controls')).toBe(true);
		});

		it('should create a fullscreen button for video', async () => {
			const video = document.createElement('video');
			video.src = 'test.mp4';
			element.appendChild(video);

			await reconnectElement();
			const button = element.querySelector('button');
			expect(button).toBeTruthy();
			expect(button.textContent).toBe('View fullscreen');
		});

		it('should update button text when button-text changes', async () => {
			const video = document.createElement('video');
			video.src = 'test.mp4';
			element.appendChild(video);

			await reconnectElement();
			const button = element.querySelector('button');
			element.setAttribute('button-text', 'Pantalla completa');

			expect(button.textContent).toBe('Pantalla completa');
		});
	});

	describe('iframe element enhancement', () => {
		it('should find and enhance an iframe element', async () => {
			const iframe = document.createElement('iframe');
			iframe.src = 'https://example.com';
			element.appendChild(iframe);

			await reconnectElement();
			expect(iframe.hasAttribute('allow')).toBe(true);
			expect(iframe.getAttribute('allow')).toContain('fullscreen');
			expect(iframe.hasAttribute('allowfullscreen')).toBe(true);
		});

		it('should create a fullscreen button for iframe', async () => {
			const iframe = document.createElement('iframe');
			iframe.src = 'https://example.com';
			element.appendChild(iframe);

			await reconnectElement();
			const button = element.querySelector('button');
			expect(button).toBeTruthy();
			expect(button.textContent).toBe('View fullscreen');
		});
	});

	describe('{name} token replacement', () => {
		it('should replace {name} with video aria-label in button-text', async () => {
			const video = document.createElement('video');
			video.setAttribute('aria-label', 'Product demo');
			element.appendChild(video);
			element.setAttribute('button-text', 'View {name} fullscreen');

			await reconnectElement();
			const button = element.querySelector('button');
			expect(button.textContent).toBe('View Product demo fullscreen');
		});

		it('should replace {name} with iframe title in button-label', async () => {
			const iframe = document.createElement('iframe');
			iframe.setAttribute('title', 'YouTube video');
			element.appendChild(iframe);
			element.setAttribute('button-text', 'Fullscreen');
			element.setAttribute('button-label', 'View {name} in fullscreen');

			await reconnectElement();
			const button = element.querySelector('button');
			expect(button.textContent).toBe('Fullscreen');
			expect(button.getAttribute('aria-label')).toBe(
				'View YouTube video in fullscreen',
			);
		});

		it('should use empty string when {name} used but no accessible name exists', async () => {
			const video = document.createElement('video');
			element.appendChild(video);
			element.setAttribute('button-text', 'View {name} fullscreen');

			await reconnectElement();
			const button = element.querySelector('button');
			expect(button.textContent).toBe('View  fullscreen');
		});

		it('should prefer aria-label over title for {name}', async () => {
			const iframe = document.createElement('iframe');
			iframe.setAttribute('aria-label', 'Main video');
			iframe.setAttribute('title', 'Secondary title');
			element.appendChild(iframe);
			element.setAttribute('button-text', '{name}');

			await reconnectElement();
			const button = element.querySelector('button');
			expect(button.textContent).toBe('Main video');
		});

		it('should update button when target name changes', async () => {
			const video = document.createElement('video');
			video.setAttribute('aria-label', 'First video');
			element.appendChild(video);
			element.setAttribute('button-text', '{name}');

			await reconnectElement();
			const button = element.querySelector('button');
			expect(button.textContent).toBe('First video');

			video.setAttribute('aria-label', 'Updated video');
			await waitForComponent();
			expect(button.textContent).toBe('Updated video');
		});

		it('should omit aria-label when button-label is not set', async () => {
			const video = document.createElement('video');
			element.appendChild(video);
			element.setAttribute('button-text', 'Go fullscreen');

			await reconnectElement();
			const button = element.querySelector('button');
			expect(button.hasAttribute('aria-label')).toBe(false);
		});
	});

	describe('positioning and styles', () => {
		it('should inject global styles once', async () => {
			const video = document.createElement('video');
			element.appendChild(video);

			await reconnectElement();
			const styleElement = document.getElementById(
				'fullscreen-control-styles',
			);
			expect(styleElement).toBeTruthy();
			expect(styleElement.tagName).toBe('STYLE');

			// Create another instance and verify styles aren't duplicated
			const element2 = document.createElement('fullscreen-control');
			const video2 = document.createElement('video');
			element2.appendChild(video2);
			document.body.appendChild(element2);

			const styleElements = document.querySelectorAll(
				'#fullscreen-control-styles',
			);
			expect(styleElements.length).toBe(1);

			document.body.removeChild(element2);
		});
	});

	describe('button interaction', () => {
		it('should have proper button attributes', async () => {
			const video = document.createElement('video');
			element.appendChild(video);

			await reconnectElement();
			const button = element.querySelector('button');
			expect(button.getAttribute('type')).toBe('button');
			expect(button.hasAttribute('aria-label')).toBe(false);
			expect(button.getAttribute('aria-controls')).toBe(video.id);
		});

		it('should update aria-label when label changes', async () => {
			const video = document.createElement('video');
			element.appendChild(video);

			await reconnectElement();
			element.setAttribute('button-label', 'Vollbild');
			const button = element.querySelector('button');
			expect(button.getAttribute('aria-label')).toBe('Vollbild');
		});

		it('should remove aria-label when label matches visible text', async () => {
			const video = document.createElement('video');
			element.appendChild(video);

			await reconnectElement();
			const button = element.querySelector('button');
			element.setAttribute('button-label', 'View fullscreen');

			expect(button.hasAttribute('aria-label')).toBe(false);
		});

		it('should reference existing target id with aria-controls', async () => {
			const video = document.createElement('video');
			video.id = 'demo-video';
			element.appendChild(video);

			await reconnectElement();
			const button = element.querySelector('button');
			expect(button.getAttribute('aria-controls')).toBe('demo-video');
			expect(video.id).toBe('demo-video');
		});

		it('should assign an id when target lacks one and reference it', async () => {
			const video = document.createElement('video');
			element.appendChild(video);

			await reconnectElement();
			const assignedId = video.getAttribute('id');
			const button = element.querySelector('button');
			expect(assignedId).toMatch(/^fullscreen-control-target-/);
			expect(button.getAttribute('aria-controls')).toBe(assignedId);
		});

		it('should update aria-controls when target id changes after initialization', async () => {
			const video = document.createElement('video');
			element.appendChild(video);

			await reconnectElement();
			const button = element.querySelector('button');
			video.setAttribute('id', 'custom-video-id');
			await waitForComponent();
			expect(button.getAttribute('aria-controls')).toBe(
				'custom-video-id',
			);
		});
	});

	describe('fullscreen methods', () => {
		beforeEach(async () => {
			const video = document.createElement('video');
			element.appendChild(video);
			await reconnectElement();
		});

		it('should have enterFullscreen method', () => {
			expect(typeof element.enterFullscreen).toBe('function');
		});

		it('should have exitFullscreen method', () => {
			expect(typeof element.exitFullscreen).toBe('function');
		});

		it('should have toggleFullscreen method', () => {
			expect(typeof element.toggleFullscreen).toBe('function');
		});

		it('should call requestFullscreen when enterFullscreen is called', async () => {
			const requestFullscreenSpy = vi.fn().mockResolvedValue(undefined);
			element._target.requestFullscreen = requestFullscreenSpy;

			await element.enterFullscreen();

			expect(requestFullscreenSpy).toHaveBeenCalled();
		});

		it('should dispatch fullscreen-control:enter event', async () => {
			const eventSpy = vi.fn();
			element.addEventListener('fullscreen-control:enter', eventSpy);

			element._target.requestFullscreen = vi
				.fn()
				.mockResolvedValue(undefined);
			await element.enterFullscreen();
			setFullscreenElement(element._target);
			document.dispatchEvent(new Event('fullscreenchange'));

			expect(eventSpy).toHaveBeenCalled();
		});

		it('should dispatch fullscreen-control:exit event', async () => {
			const eventSpy = vi.fn();
			element.addEventListener('fullscreen-control:exit', eventSpy);

			document.exitFullscreen = vi.fn().mockResolvedValue(undefined);
			setFullscreenElement(element._target);
			document.dispatchEvent(new Event('fullscreenchange'));

			await element.exitFullscreen();
			setFullscreenElement(null);
			document.dispatchEvent(new Event('fullscreenchange'));

			expect(eventSpy).toHaveBeenCalled();
		});

		it('should dispatch exit event when fullscreen exits externally', async () => {
			const eventSpy = vi.fn();
			element.addEventListener('fullscreen-control:exit', eventSpy);

			setFullscreenElement(element._target);
			document.dispatchEvent(new Event('fullscreenchange'));

			setFullscreenElement(null);
			document.dispatchEvent(new Event('fullscreenchange'));

			expect(eventSpy).toHaveBeenCalled();
		});
	});

	describe('keyboard interaction', () => {
		it('should handle escape key when in fullscreen', async () => {
			const video = document.createElement('video');
			element.appendChild(video);
			await reconnectElement();
			const exitFullscreenSpy = vi.spyOn(element, 'exitFullscreen');

			// Mock fullscreen state
			Object.defineProperty(document, 'fullscreenElement', {
				writable: true,
				value: element._target,
			});

			// Simulate escape key
			const event = new KeyboardEvent('keydown', { key: 'Escape' });
			element._handleEscape(event);

			expect(exitFullscreenSpy).toHaveBeenCalled();

			// Cleanup
			Object.defineProperty(document, 'fullscreenElement', {
				writable: true,
				value: null,
			});
		});
	});

	describe('cleanup', () => {
		it('should clean up event listeners on disconnect', async () => {
			const video = document.createElement('video');
			element.appendChild(video);
			await reconnectElement();
			const button = element.querySelector('button');
			const removeEventListenerSpy = vi.spyOn(
				button,
				'removeEventListener',
			);

			element.remove();

			expect(removeEventListenerSpy).toHaveBeenCalled();
		});
	});

	describe('edge cases', () => {
		it('should warn when no video or iframe is found', async () => {
			const consoleSpy = vi
				.spyOn(console, 'warn')
				.mockImplementation(() => {});

			const emptyElement = document.createElement('fullscreen-control');
			document.body.appendChild(emptyElement);
			await waitForComponent();

			expect(consoleSpy).toHaveBeenCalledWith(
				'fullscreen-control: No video or iframe element found',
			);

			emptyElement.remove();
			consoleSpy.mockRestore();
		});

		it('should handle errors in enterFullscreen gracefully', async () => {
			const video = document.createElement('video');
			element.appendChild(video);
			await reconnectElement();
			const consoleErrorSpy = vi
				.spyOn(console, 'error')
				.mockImplementation(() => {});
			const error = new Error('Fullscreen not supported');
			element._target.requestFullscreen = vi
				.fn()
				.mockRejectedValue(error);

			await element.enterFullscreen();

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Error entering fullscreen:',
				error,
			);
			consoleErrorSpy.mockRestore();
		});

		it('should handle errors in exitFullscreen gracefully', async () => {
			const video = document.createElement('video');
			element.appendChild(video);
			await reconnectElement();
			setFullscreenElement(element._target);
			const consoleErrorSpy = vi
				.spyOn(console, 'error')
				.mockImplementation(() => {});
			const error = new Error('Exit fullscreen failed');
			document.exitFullscreen = vi.fn().mockRejectedValue(error);

			await element.exitFullscreen();

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Error exiting fullscreen:',
				error,
			);
			consoleErrorSpy.mockRestore();
			setFullscreenElement(null);
		});
	});

	describe('browser prefixes', () => {
		it('should handle webkit prefix for requestFullscreen', async () => {
			const video = document.createElement('video');
			element.appendChild(video);
			await reconnectElement();
			delete element._target.requestFullscreen;
			const webkitRequestFullscreenSpy = vi
				.fn()
				.mockResolvedValue(undefined);
			element._target.webkitRequestFullscreen =
				webkitRequestFullscreenSpy;

			await element.enterFullscreen();

			expect(webkitRequestFullscreenSpy).toHaveBeenCalled();
		});

		it('should handle moz prefix for requestFullscreen', async () => {
			const video = document.createElement('video');
			element.appendChild(video);
			await reconnectElement();
			delete element._target.requestFullscreen;
			delete element._target.webkitRequestFullscreen;
			const mozRequestFullScreenSpy = vi
				.fn()
				.mockResolvedValue(undefined);
			element._target.mozRequestFullScreen = mozRequestFullScreenSpy;

			await element.enterFullscreen();

			expect(mozRequestFullScreenSpy).toHaveBeenCalled();
		});

		it('should handle webkit prefix for exitFullscreen', async () => {
			const video = document.createElement('video');
			element.appendChild(video);
			await reconnectElement();
			setFullscreenElement(element._target);
			delete document.exitFullscreen;
			const webkitExitFullscreenSpy = vi
				.fn()
				.mockResolvedValue(undefined);
			document.webkitExitFullscreen = webkitExitFullscreenSpy;

			await element.exitFullscreen();

			expect(webkitExitFullscreenSpy).toHaveBeenCalled();
			delete document.webkitExitFullscreen;
			setFullscreenElement(null);
		});

		it('should handle moz prefix for exitFullscreen', async () => {
			const video = document.createElement('video');
			element.appendChild(video);
			await reconnectElement();
			setFullscreenElement(element._target);
			delete document.exitFullscreen;
			delete document.webkitExitFullscreen;
			const mozCancelFullScreenSpy = vi.fn().mockResolvedValue(undefined);
			document.mozCancelFullScreen = mozCancelFullScreenSpy;

			await element.exitFullscreen();

			expect(mozCancelFullScreenSpy).toHaveBeenCalled();
			delete document.mozCancelFullScreen;
			setFullscreenElement(null);
		});
	});

	describe('focus management', () => {
		it('should return focus to button after exiting fullscreen when button was clicked', async () => {
			const video = document.createElement('video');
			element.appendChild(video);
			await reconnectElement();
			const button = element.querySelector('button');
			const focusSpy = vi.spyOn(button, 'focus');

			// Mock fullscreen API
			const requestFullscreenSpy = vi.fn().mockResolvedValue(undefined);
			element._target.requestFullscreen = requestFullscreenSpy;

			const exitFullscreenSpy = vi.fn().mockResolvedValue(undefined);
			document.exitFullscreen = exitFullscreenSpy;

			// Mock _isFullscreen to return true when fullscreen, false when not
			let isFullscreen = false;
			vi.spyOn(element, '_isFullscreen').mockImplementation(
				() => isFullscreen,
			);

			// Simulate button click to enter fullscreen
			button.click();
			await new Promise((resolve) => setTimeout(resolve, 0));

			// Simulate fullscreen change event (entering)
			isFullscreen = true;
			document.dispatchEvent(new Event('fullscreenchange'));

			// Exit fullscreen
			await element.exitFullscreen();

			// Simulate fullscreen change event (exiting)
			isFullscreen = false;
			document.dispatchEvent(new Event('fullscreenchange'));

			expect(focusSpy).toHaveBeenCalled();

			delete document.exitFullscreen;
		});

		it('should not return focus when enterFullscreen is called programmatically', async () => {
			const video = document.createElement('video');
			element.appendChild(video);
			await reconnectElement();
			const button = element.querySelector('button');
			const focusSpy = vi.spyOn(button, 'focus');

			// Mock fullscreen API
			const requestFullscreenSpy = vi.fn().mockResolvedValue(undefined);
			element._target.requestFullscreen = requestFullscreenSpy;

			const exitFullscreenSpy = vi.fn().mockResolvedValue(undefined);
			document.exitFullscreen = exitFullscreenSpy;

			// Mock _isFullscreen to return true when fullscreen, false when not
			let isFullscreen = false;
			vi.spyOn(element, '_isFullscreen').mockImplementation(
				() => isFullscreen,
			);

			// Call enterFullscreen programmatically (not via button)
			await element.enterFullscreen();

			// Simulate fullscreen change event (entering)
			isFullscreen = true;
			document.dispatchEvent(new Event('fullscreenchange'));

			// Exit fullscreen
			await element.exitFullscreen();

			// Simulate fullscreen change event (exiting)
			isFullscreen = false;
			document.dispatchEvent(new Event('fullscreenchange'));

			expect(focusSpy).not.toHaveBeenCalled();

			delete document.exitFullscreen;
		});
	});
});
