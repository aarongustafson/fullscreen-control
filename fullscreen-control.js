/**
 * FullscreenControlElement - A web component to progressively enhance any video or iframe element to have fullscreen capabilities.
 *
 * @element fullscreen-control
 *
 * @attr {string} button-text - The visible text for the fullscreen button (default: "View fullscreen"). Use {name} to inject the accessible name of the video/iframe.
 * @attr {string} button-label - Optional aria-label for the fullscreen button. Use {name} to inject the accessible name of the video/iframe. If not set, uses button-text.
 *
 * @fires fullscreen-control:enter - Fired when entering fullscreen mode
 * @fires fullscreen-control:exit - Fired when exiting fullscreen mode
 *
 * @slot - Default slot for video or iframe content
 *
 * @cssprop --fullscreen-control-button-inset-block-start - Block-start position of the button (default: 0.5rem)
 * @cssprop --fullscreen-control-button-inset-inline-end - Inline-end position of the button (default: 0.5rem)
 */
const DEFAULT_BUTTON_TEXT = 'View fullscreen';
const STYLE_ELEMENT_ID = 'fullscreen-control-styles';
export class FullscreenControlElement extends HTMLElement {
	static get observedAttributes() {
		return ['button-text', 'button-label'];
	}

	static _injectStyles() {
		if (document.getElementById(STYLE_ELEMENT_ID)) {
			return;
		}

		const style = document.createElement('style');
		style.id = STYLE_ELEMENT_ID;
		style.textContent = `
			fullscreen-control {
				position: relative;
				display: inline-block;
			}

			fullscreen-control[hidden] {
				display: none !important;
			}

			fullscreen-control button {
				position: absolute;
				inset-block-start: var(--fullscreen-control-button-inset-block-start, 0.5rem);
				inset-inline-end: var(--fullscreen-control-button-inset-inline-end, 0.5rem);
				cursor: pointer;
				z-index: 1;
			}
		`;

		document.head.appendChild(style);
	}

	constructor() {
		super();
		this._internals =
			typeof this.attachInternals === 'function'
				? this.attachInternals()
				: null;
		this._button = null;
		this._target = null;
		this._targetId = null;
		this._shouldReturnFocus = false;
		this._isObservingFullscreen = false;
		this._mutationObserver = null;
		this._targetObserver = null;
		this._patchedTarget = null;
		this._originalTargetSetAttribute = null;
		this._originalTargetRemoveAttribute = null;
		this._pendingInitFrame = null;
		this._pendingInitUsesTimeout = false;
		this._pendingButtonUpdate = null;
		this._pendingButtonUpdateUsesTimeout = false;
		this._fullscreenChangeAbortController = null;
		this._isFullscreenActive = false;
		this._handleEscape = this._handleEscape.bind(this);
		this._handleFullscreenChange = this._handleFullscreenChange.bind(this);
		this._handleButtonClick = this._handleButtonClick.bind(this);
	}

	connectedCallback() {
		this._upgradeProperty('buttonText');
		this._upgradeProperty('buttonLabel');
		this._ensureHostAttributes();
		this._setupMutationObserver();
		this._scheduleSetup();
	}

	disconnectedCallback() {
		this._cancelScheduledSetup();
		this._teardownMutationObserver();
		this._cleanup();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) {
			return;
		}

		switch (name) {
			case 'button-text':
			case 'button-label':
				if (this._button) {
					this._updateButtonText();
				}
				break;
			default:
				break;
		}
	}

	get buttonText() {
		return this.getAttribute('button-text') || DEFAULT_BUTTON_TEXT;
	}

	set buttonText(value) {
		this._reflectStringAttribute('button-text', value);
	}

	get buttonLabel() {
		return this.getAttribute('button-label') || '';
	}

	set buttonLabel(value) {
		this._reflectStringAttribute('button-label', value);
	}

	_getTargetName() {
		if (!this._target) {
			return '';
		}

		// Try aria-label first, then title, then empty string
		return (
			this._target.getAttribute('aria-label') ||
			this._target.getAttribute('title') ||
			''
		);
	}

	_replaceNameToken(text) {
		const name = this._getTargetName();
		return text.replace(/\{name\}/g, name);
	}

	_updateButtonText() {
		if (!this._button) {
			return;
		}

		const visibleText = this._replaceNameToken(this.buttonText);
		this._button.textContent = visibleText;

		const hasCustomLabel = this.hasAttribute('button-label');
		const resolvedLabel = hasCustomLabel
			? this._replaceNameToken(this.buttonLabel)
			: '';

		if (hasCustomLabel && resolvedLabel && resolvedLabel !== visibleText) {
			this._button.setAttribute('aria-label', resolvedLabel);
		} else {
			this._button.removeAttribute('aria-label');
		}
	}

	_setup() {
		this._target = this.querySelector('video, iframe');
		if (!this._target) {
			console.warn(
				'fullscreen-control: No video or iframe element found',
			);
			return false;
		}

		this._targetId = this._ensureTargetId();
		this._enhanceTarget();
		FullscreenControlElement._injectStyles();
		this._createButton();
		this._observeTargetAttributes();
		this._startFullscreenObserver();
		return true;
	}

	_cleanup() {
		if (this._internals?.states) {
			if (typeof this._internals.states.delete === 'function') {
				this._internals.states.delete('rendered');
			} else if (typeof this._internals.states.remove === 'function') {
				this._internals.states.remove('rendered');
			}
		}
		this._cancelQueuedButtonTextUpdate();
		if (this._button) {
			this._button.removeEventListener('click', this._handleButtonClick);
			this._button.remove();
			this._button = null;
		}
		document.removeEventListener('keydown', this._handleEscape);
		this._stopFullscreenObserver();
		this._disconnectTargetObserver();
		this._restoreTargetAttributePatchedMethods();
		this._target = null;
		this._targetId = null;
		this._shouldReturnFocus = false;
		this._isFullscreenActive = false;
	}

	_enhanceTarget() {
		// Add allowfullscreen attribute to iframes
		if (this._target.tagName.toLowerCase() === 'iframe') {
			// Modern syntax
			this._target.setAttribute('allow', 'fullscreen');
			// Legacy attributes for broader compatibility
			this._target.setAttribute('allowfullscreen', '');
			this._target.setAttribute('webkitallowfullscreen', '');
			this._target.setAttribute('mozallowfullscreen', '');
		}

		// Ensure the target has controls if it's a video
		if (this._target.tagName.toLowerCase() === 'video') {
			this._target.setAttribute('controls', '');
		}
	}

	_createButton() {
		this._button = document.createElement('button');
		this._button.setAttribute('type', 'button');
		this._syncButtonControlAssociation();

		this._updateButtonText();
		this._button.addEventListener('click', this._handleButtonClick);

		this.appendChild(this._button);
	}

	_handleButtonClick(event) {
		event.preventDefault();
		this._shouldReturnFocus = true;
		this.toggleFullscreen();
	}

	_handleEscape(event) {
		if (event.key === 'Escape' && this._isFullscreen()) {
			this.exitFullscreen();
		}
	}

	_handleFullscreenChange() {
		const isFullscreen = this._isFullscreen();
		if (isFullscreen) {
			// Listen for escape key when in fullscreen
			document.addEventListener('keydown', this._handleEscape);
			if (!this._isFullscreenActive) {
				this._dispatchFullscreenEvent('enter');
			}
		} else {
			// Remove escape listener when not in fullscreen
			document.removeEventListener('keydown', this._handleEscape);
			if (this._isFullscreenActive) {
				this._dispatchFullscreenEvent('exit');
			}

			// Return focus to button if it triggered fullscreen
			if (this._shouldReturnFocus && this._button) {
				this._button.focus();
				this._shouldReturnFocus = false;
			}
		}
		this._isFullscreenActive = isFullscreen;
	}

	_scheduleSetup() {
		if (!this.isConnected) {
			return;
		}

		this._cancelScheduledSetup();

		if (typeof requestAnimationFrame === 'function') {
			this._pendingInitUsesTimeout = false;
			this._pendingInitFrame = requestAnimationFrame(() => {
				this._pendingInitFrame = null;
				this._pendingInitUsesTimeout = false;
				this._initialize();
			});
			return;
		}

		this._pendingInitUsesTimeout = true;
		this._pendingInitFrame = setTimeout(() => {
			this._pendingInitFrame = null;
			this._pendingInitUsesTimeout = false;
			this._initialize();
		}, 0);
	}

	_cancelScheduledSetup() {
		if (this._pendingInitFrame === null) {
			return;
		}

		if (this._pendingInitUsesTimeout) {
			clearTimeout(this._pendingInitFrame);
		} else if (typeof cancelAnimationFrame === 'function') {
			cancelAnimationFrame(this._pendingInitFrame);
		} else {
			clearTimeout(this._pendingInitFrame);
		}

		this._pendingInitFrame = null;
		this._pendingInitUsesTimeout = false;
	}

	_initialize() {
		this._cleanup();
		const didSetup = this._setup();
		if (didSetup && this._internals?.states) {
			this._internals.states.add('rendered');
		}
	}

	_ensureHostAttributes() {
		if (!this.hasAttribute('role')) {
			this.setAttribute('role', 'group');
		}
	}

	_setupMutationObserver() {
		if (this._mutationObserver || typeof MutationObserver !== 'function') {
			return;
		}

		this._mutationObserver = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.type !== 'childList') {
					continue;
				}
				const relatedNodes = [
					...mutation.addedNodes,
					...mutation.removedNodes,
				];
				if (
					relatedNodes.some((node) =>
						FullscreenControlElement._mutationTouchesMedia(node),
					)
				) {
					this._scheduleSetup();
					break;
				}
			}
		});

		this._mutationObserver.observe(this, {
			childList: true,
			subtree: false,
		});
	}

	_teardownMutationObserver() {
		if (this._mutationObserver) {
			this._mutationObserver.disconnect();
			this._mutationObserver = null;
		}
	}

	static _mutationTouchesMedia(node) {
		if (typeof Element === 'undefined' || !(node instanceof Element)) {
			return false;
		}
		if (node.matches('video, iframe')) {
			return true;
		}
		return Boolean(node.querySelector('video, iframe'));
	}

	_reflectStringAttribute(attrName, value) {
		if (value === null || value === undefined || value === '') {
			this.removeAttribute(attrName);
			return;
		}
		this.setAttribute(attrName, String(value));
	}

	_upgradeProperty(prop) {
		if (Object.prototype.hasOwnProperty.call(this, prop)) {
			const value = this[prop];
			delete this[prop];
			this[prop] = value;
		}
	}

	_observeTargetAttributes() {
		this._disconnectTargetObserver();
		this._restoreTargetAttributePatchedMethods();
		if (!this._target) {
			return;
		}

		if (typeof MutationObserver === 'function') {
			this._targetObserver = new MutationObserver((mutations) => {
				for (const mutation of mutations) {
					if (mutation.type !== 'attributes') {
						continue;
					}
					this._handleTargetAttributeChange(mutation.attributeName);
				}
			});

			this._targetObserver.observe(this._target, {
				attributes: true,
				attributeFilter: ['aria-label', 'title', 'id'],
			});
		}

		this._patchTargetAttributeMethods();
	}

	_disconnectTargetObserver() {
		if (this._targetObserver) {
			this._targetObserver.disconnect();
			this._targetObserver = null;
		}
	}

	_patchTargetAttributeMethods() {
		if (!this._target || this._patchedTarget === this._target) {
			return;
		}

		this._patchedTarget = this._target;
		this._originalTargetSetAttribute = this._patchedTarget.setAttribute;
		this._originalTargetRemoveAttribute =
			this._patchedTarget.removeAttribute;

		const element = this._patchedTarget;
		const component = this;

		element.setAttribute = function patchedSetAttribute(name, value) {
			const result = component._originalTargetSetAttribute.call(
				this,
				name,
				value,
			);
			component._handleTargetAttributeChange(name);
			return result;
		};

		element.removeAttribute = function patchedRemoveAttribute(name) {
			const result = component._originalTargetRemoveAttribute.call(
				this,
				name,
			);
			component._handleTargetAttributeChange(name);
			return result;
		};
	}

	_restoreTargetAttributePatchedMethods() {
		if (!this._patchedTarget) {
			return;
		}
		if (this._originalTargetSetAttribute) {
			this._patchedTarget.setAttribute = this._originalTargetSetAttribute;
		}
		if (this._originalTargetRemoveAttribute) {
			this._patchedTarget.removeAttribute =
				this._originalTargetRemoveAttribute;
		}
		this._patchedTarget = null;
		this._originalTargetSetAttribute = null;
		this._originalTargetRemoveAttribute = null;
	}

	_handleTargetAttributeChange(attributeName) {
		if (!attributeName) {
			return;
		}
		if (attributeName === 'aria-label' || attributeName === 'title') {
			this._queueButtonTextUpdate();
		}
		if (attributeName === 'id') {
			this._targetId = this._target?.getAttribute('id') || null;
			this._syncButtonControlAssociation();
		}
	}

	_queueButtonTextUpdate() {
		if (!this._button || this._pendingButtonUpdate !== null) {
			return;
		}

		const runUpdate = () => {
			this._pendingButtonUpdate = null;
			this._pendingButtonUpdateUsesTimeout = false;
			this._updateButtonText();
		};

		if (typeof requestAnimationFrame === 'function') {
			this._pendingButtonUpdateUsesTimeout = false;
			this._pendingButtonUpdate = requestAnimationFrame(runUpdate);
			return;
		}

		this._pendingButtonUpdateUsesTimeout = true;
		this._pendingButtonUpdate = setTimeout(runUpdate, 0);
	}

	_cancelQueuedButtonTextUpdate() {
		if (this._pendingButtonUpdate === null) {
			return;
		}

		if (this._pendingButtonUpdateUsesTimeout) {
			clearTimeout(this._pendingButtonUpdate);
		} else if (typeof cancelAnimationFrame === 'function') {
			cancelAnimationFrame(this._pendingButtonUpdate);
		} else {
			clearTimeout(this._pendingButtonUpdate);
		}
		this._pendingButtonUpdate = null;
		this._pendingButtonUpdateUsesTimeout = false;
	}

	_startFullscreenObserver() {
		if (this._isObservingFullscreen) {
			return;
		}

		if (typeof AbortController === 'function') {
			this._fullscreenChangeAbortController = new AbortController();
			document.addEventListener(
				'fullscreenchange',
				this._handleFullscreenChange,
				{
					signal: this._fullscreenChangeAbortController.signal,
				},
			);
		} else {
			document.addEventListener(
				'fullscreenchange',
				this._handleFullscreenChange,
			);
		}

		this._isObservingFullscreen = true;
	}

	_stopFullscreenObserver() {
		if (!this._isObservingFullscreen) {
			return;
		}
		if (this._fullscreenChangeAbortController) {
			this._fullscreenChangeAbortController.abort();
			this._fullscreenChangeAbortController = null;
		} else {
			document.removeEventListener(
				'fullscreenchange',
				this._handleFullscreenChange,
			);
		}
		this._isObservingFullscreen = false;
	}

	_syncButtonControlAssociation() {
		if (!this._button) {
			return;
		}
		if (this._targetId) {
			this._button.setAttribute('aria-controls', this._targetId);
		} else {
			this._button.removeAttribute('aria-controls');
		}
	}

	_dispatchFullscreenEvent(type) {
		this.dispatchEvent(
			new CustomEvent(`fullscreen-control:${type}`, {
				bubbles: true,
				composed: true,
			}),
		);
	}

	_isFullscreen() {
		return (
			document.fullscreenElement === this._target ||
			document.webkitFullscreenElement === this._target ||
			document.mozFullScreenElement === this._target
		);
	}

	/**
	 * Enter fullscreen mode
	 */
	async enterFullscreen() {
		if (!this._target) {
			console.warn(
				'fullscreen-control: No target element to make fullscreen',
			);
			return;
		}

		try {
			let didEnter = false;
			if (this._target.requestFullscreen) {
				await this._target.requestFullscreen();
				didEnter = true;
			} else if (this._target.webkitRequestFullscreen) {
				await this._target.webkitRequestFullscreen();
				didEnter = true;
			} else if (this._target.mozRequestFullScreen) {
				await this._target.mozRequestFullScreen();
				didEnter = true;
			}
		} catch (error) {
			console.error('Error entering fullscreen:', error);
		}
	}

	/**
	 * Exit fullscreen mode
	 */
	async exitFullscreen() {
		try {
			if (document.exitFullscreen) {
				await document.exitFullscreen();
			} else if (document.webkitExitFullscreen) {
				await document.webkitExitFullscreen();
			} else if (document.mozCancelFullScreen) {
				await document.mozCancelFullScreen();
			}
		} catch (error) {
			console.error('Error exiting fullscreen:', error);
		}
	}

	/**
	 * Toggle fullscreen mode
	 */
	toggleFullscreen() {
		if (!this._target) {
			console.warn(
				'fullscreen-control: No target element to toggle fullscreen',
			);
			return;
		}
		if (this._isFullscreen()) {
			this.exitFullscreen();
		} else {
			this.enterFullscreen();
		}
	}

	_ensureTargetId() {
		if (!this._target) {
			return null;
		}

		const existingId = this._target.getAttribute('id');
		if (existingId && existingId.trim() !== '') {
			return existingId;
		}

		const generatedId = FullscreenControlElement._generateTargetId();
		this._target.setAttribute('id', generatedId);
		return generatedId;
	}

	static _generateTargetId() {
		FullscreenControlElement._idCounter += 1;
		return `fullscreen-control-target-${FullscreenControlElement._idCounter}`;
	}
}

FullscreenControlElement._idCounter = 0;
