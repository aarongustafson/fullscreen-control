import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FullscreenControlElement } from '../fullscreen-control.js';

describe('FullscreenControlElement', () => {
	let element;

	beforeEach(() => {
		element = document.createElement('fullscreen-control');
		document.body.appendChild(element);
	});

	afterEach(() => {
		if (element && element.parentNode) {
			document.body.removeChild(element);
		}
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
		it('should find and enhance a video element', () => {
			const video = document.createElement('video');
			video.src = 'test.mp4';
			element.appendChild(video);

			// Trigger setup by disconnecting and reconnecting
			element.remove();
			document.body.appendChild(element);

			expect(video.hasAttribute('controls')).toBe(true);
		});

		it('should create a fullscreen button for video', () => {
			const video = document.createElement('video');
			video.src = 'test.mp4';
			element.appendChild(video);

			element.remove();
			document.body.appendChild(element);

			const button = element.querySelector('button');
			expect(button).toBeTruthy();
			expect(button.textContent).toBe('View fullscreen');
		});

		it('should update button text when button-text changes', () => {
			const video = document.createElement('video');
			video.src = 'test.mp4';
			element.appendChild(video);

			element.remove();
			document.body.appendChild(element);

			const button = element.querySelector('button');
			element.setAttribute('button-text', 'Pantalla completa');

			expect(button.textContent).toBe('Pantalla completa');
		});
	});

	describe('iframe element enhancement', () => {
		it('should find and enhance an iframe element', () => {
			const iframe = document.createElement('iframe');
			iframe.src = 'https://example.com';
			element.appendChild(iframe);

			element.remove();
			document.body.appendChild(element);

			expect(iframe.hasAttribute('allow')).toBe(true);
			expect(iframe.getAttribute('allow')).toContain('fullscreen');
			expect(iframe.hasAttribute('allowfullscreen')).toBe(true);
		});

		it('should create a fullscreen button for iframe', () => {
			const iframe = document.createElement('iframe');
			iframe.src = 'https://example.com';
			element.appendChild(iframe);

			element.remove();
			document.body.appendChild(element);

			const button = element.querySelector('button');
			expect(button).toBeTruthy();
			expect(button.textContent).toBe('View fullscreen');
		});
	});

	describe('{name} token replacement', () => {
		it('should replace {name} with video aria-label in button-text', () => {
			const video = document.createElement('video');
			video.setAttribute('aria-label', 'Product demo');
			element.appendChild(video);
			element.setAttribute('button-text', 'View {name} fullscreen');

			element.remove();
			document.body.appendChild(element);

			const button = element.querySelector('button');
			expect(button.textContent).toBe('View Product demo fullscreen');
		});

		it('should replace {name} with iframe title in button-label', () => {
			const iframe = document.createElement('iframe');
			iframe.setAttribute('title', 'YouTube video');
			element.appendChild(iframe);
			element.setAttribute('button-text', 'Fullscreen');
			element.setAttribute('button-label', 'View {name} in fullscreen');

			element.remove();
			document.body.appendChild(element);

			const button = element.querySelector('button');
			expect(button.textContent).toBe('Fullscreen');
			expect(button.getAttribute('aria-label')).toBe(
				'View YouTube video in fullscreen',
			);
		});

		it('should use empty string when {name} used but no accessible name exists', () => {
			const video = document.createElement('video');
			element.appendChild(video);
			element.setAttribute('button-text', 'View {name} fullscreen');

			element.remove();
			document.body.appendChild(element);

			const button = element.querySelector('button');
			expect(button.textContent).toBe('View  fullscreen');
		});

		it('should prefer aria-label over title for {name}', () => {
			const iframe = document.createElement('iframe');
			iframe.setAttribute('aria-label', 'Main video');
			iframe.setAttribute('title', 'Secondary title');
			element.appendChild(iframe);
			element.setAttribute('button-text', '{name}');

			element.remove();
			document.body.appendChild(element);

			const button = element.querySelector('button');
			expect(button.textContent).toBe('Main video');
		});

		it('should update button when target name changes', () => {
			const video = document.createElement('video');
			video.setAttribute('aria-label', 'First video');
			element.appendChild(video);
			element.setAttribute('button-text', '{name}');

			element.remove();
			document.body.appendChild(element);

			const button = element.querySelector('button');
			expect(button.textContent).toBe('First video');

			// Change the video's aria-label
			video.setAttribute('aria-label', 'Updated video');
			// Trigger update by changing button-text
			element.setAttribute('button-text', 'View {name}');

			expect(button.textContent).toBe('View Updated video');
		});

		it('should omit aria-label when button-label is not set', () => {
			const video = document.createElement('video');
			element.appendChild(video);
			element.setAttribute('button-text', 'Go fullscreen');

			element.remove();
			document.body.appendChild(element);

			const button = element.querySelector('button');
			expect(button.hasAttribute('aria-label')).toBe(false);
		});
	});

	describe('positioning and styles', () => {
		it('should inject global styles once', () => {
			const video = document.createElement('video');
			element.appendChild(video);

			element.remove();
			document.body.appendChild(element);

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
		it('should have proper button attributes', () => {
			const video = document.createElement('video');
			element.appendChild(video);

			element.remove();
			document.body.appendChild(element);

			const button = element.querySelector('button');
			expect(button.getAttribute('type')).toBe('button');
			expect(button.hasAttribute('aria-label')).toBe(false);
			expect(button.getAttribute('aria-controls')).toBe(video.id);
		});

		it('should update aria-label when label changes', () => {
			const video = document.createElement('video');
			element.appendChild(video);

			element.remove();
			document.body.appendChild(element);

			element.setAttribute('button-label', 'Vollbild');
			const button = element.querySelector('button');
			expect(button.getAttribute('aria-label')).toBe('Vollbild');
		});

		it('should remove aria-label when label matches visible text', () => {
			const video = document.createElement('video');
			element.appendChild(video);

			element.remove();
			document.body.appendChild(element);

			const button = element.querySelector('button');
			element.setAttribute('button-label', 'View fullscreen');

			expect(button.hasAttribute('aria-label')).toBe(false);
		});

		it('should reference existing target id with aria-controls', () => {
			const video = document.createElement('video');
			video.id = 'demo-video';
			element.appendChild(video);

			element.remove();
			document.body.appendChild(element);

			const button = element.querySelector('button');
			expect(button.getAttribute('aria-controls')).toBe('demo-video');
			expect(video.id).toBe('demo-video');
		});

		it('should assign an id when target lacks one and reference it', () => {
			const video = document.createElement('video');
			element.appendChild(video);

			element.remove();
			document.body.appendChild(element);

			const assignedId = video.getAttribute('id');
			const button = element.querySelector('button');
			expect(assignedId).toMatch(/^fullscreen-control-target-/);
			expect(button.getAttribute('aria-controls')).toBe(assignedId);
		});
	});

	describe('fullscreen methods', () => {
		beforeEach(() => {
			const video = document.createElement('video');
			element.appendChild(video);
			element.remove();
			document.body.appendChild(element);
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

			expect(eventSpy).toHaveBeenCalled();
		});

		it('should dispatch fullscreen-control:exit event', async () => {
			const eventSpy = vi.fn();
			element.addEventListener('fullscreen-control:exit', eventSpy);

			document.exitFullscreen = vi.fn().mockResolvedValue(undefined);
			await element.exitFullscreen();

			expect(eventSpy).toHaveBeenCalled();
		});
	});

	describe('keyboard interaction', () => {
		it('should handle escape key when in fullscreen', () => {
			const video = document.createElement('video');
			element.appendChild(video);
			element.remove();
			document.body.appendChild(element);

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
		it('should clean up event listeners on disconnect', () => {
			const video = document.createElement('video');
			element.appendChild(video);
			element.remove();
			document.body.appendChild(element);

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
		it('should warn when no video or iframe is found', () => {
			const consoleSpy = vi
				.spyOn(console, 'warn')
				.mockImplementation(() => {});

			const emptyElement = document.createElement('fullscreen-control');
			document.body.appendChild(emptyElement);

			expect(consoleSpy).toHaveBeenCalledWith(
				'fullscreen-control: No video or iframe element found',
			);

			document.body.removeChild(emptyElement);
			consoleSpy.mockRestore();
		});

		it('should handle errors in enterFullscreen gracefully', async () => {
			const video = document.createElement('video');
			element.appendChild(video);
			element.remove();
			document.body.appendChild(element);

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
			element.remove();
			document.body.appendChild(element);

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
		});
	});

	describe('browser prefixes', () => {
		it('should handle webkit prefix for requestFullscreen', async () => {
			const video = document.createElement('video');
			element.appendChild(video);
			element.remove();
			document.body.appendChild(element);

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
			element.remove();
			document.body.appendChild(element);

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
			element.remove();
			document.body.appendChild(element);

			delete document.exitFullscreen;
			const webkitExitFullscreenSpy = vi
				.fn()
				.mockResolvedValue(undefined);
			document.webkitExitFullscreen = webkitExitFullscreenSpy;

			await element.exitFullscreen();

			expect(webkitExitFullscreenSpy).toHaveBeenCalled();
			delete document.webkitExitFullscreen;
		});

		it('should handle moz prefix for exitFullscreen', async () => {
			const video = document.createElement('video');
			element.appendChild(video);
			element.remove();
			document.body.appendChild(element);

			delete document.exitFullscreen;
			delete document.webkitExitFullscreen;
			const mozCancelFullScreenSpy = vi.fn().mockResolvedValue(undefined);
			document.mozCancelFullScreen = mozCancelFullScreenSpy;

			await element.exitFullscreen();

			expect(mozCancelFullScreenSpy).toHaveBeenCalled();
			delete document.mozCancelFullScreen;
		});
	});

	describe('focus management', () => {
		it('should return focus to button after exiting fullscreen when button was clicked', async () => {
			const video = document.createElement('video');
			element.appendChild(video);
			element.remove();
			document.body.appendChild(element);

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
			element.remove();
			document.body.appendChild(element);

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
