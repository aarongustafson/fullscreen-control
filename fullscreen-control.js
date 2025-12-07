/**
 * FullscreenControlElement - A web component to add progressively enhance any video or iframe element to have fullscreen capabilities.
 *
 * @element fullscreen-control
 *
 * @attr {string} example-attribute - Description of the attribute
 *
 * @fires fullscreen-control:event-name - Description of the event
 *
 * @slot - Default slot for content
 *
 * @cssprop --component-name-color - Description of CSS custom property
 */
export class FullscreenControlElement extends HTMLElement {
	static get observedAttributes() {
		return ['example-attribute'];
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	connectedCallback() {
		this.render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue !== newValue) {
			this.render();
		}
	}

	render() {
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
				}
			</style>
			<slot></slot>
		`;
	}
}
