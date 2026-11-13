import { readFile } from 'node:fs/promises';
import { it, expect } from 'vitest';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

it('documents replacement-string name substitution and null event payloads', async () => {
	const readme = await read('../README.md');
	expect(readme).toContain('replacement string');
	expect(readme).toContain('$&');
	const events = readme
		.split('\n')
		.filter((line) => line.startsWith('| `fullscreen-control:'));
	expect(events).toHaveLength(2);
	for (const event of events) expect(event).toMatch(/\|\s*`null`\s*\|/);
	const manifest = JSON.parse(await read('../custom-elements.json'));
	const component = manifest.modules.find(
		(entry) => entry.path === 'fullscreen-control.js',
	).declarations[0];
	expect(
		component.attributes.find((entry) => entry.name === 'button-text')
			.description,
	).toContain('replacement string');
	for (const event of component.events)
		expect(event.description).toContain('detail is null');
});

it('describes the real light-DOM API and guarded registration', async () => {
	const manifest = JSON.parse(await read('../custom-elements.json'));
	expect(manifest).not.toHaveProperty('readme');
	const component = manifest.modules.find(
		(entry) => entry.path === 'fullscreen-control.js',
	).declarations[0];
	expect(component.slots || []).toEqual([]);
	expect(manifest.modules.map((entry) => entry.path)).toEqual([
		'fullscreen-control.js',
		'index.js',
		'define.js',
	]);
	expect(component.cssProperties.map((entry) => entry.name)).toEqual([
		'--fullscreen-control-button-inset-block-start',
		'--fullscreen-control-button-inset-inline-end',
	]);
	for (const [attribute, property] of [
		['button-text', 'buttonText'],
		['button-label', 'buttonLabel'],
	]) {
		expect(
			component.attributes.find((entry) => entry.name === attribute)
				.fieldName,
		).toBe(property);
		expect(
			component.members.find((entry) => entry.name === property).reflects,
		).toBe(true);
	}
	const definition = manifest.modules.find(
		(entry) => entry.path === 'define.js',
	);
	expect(definition.declarations[0].description).toContain(
		'NotSupportedError',
	);
	expect(definition.exports.map((entry) => entry.name)).toContain(
		'defineFullscreenControl',
	);
	expect(
		manifest.modules.find((entry) => entry.path === 'index.js').description,
	).toContain('Class-only');
});

it('provides paired code/live layouts and native fallback media on every import page', async () => {
	for (const name of ['index', 'esm', 'unpkg']) {
		const html = await read(`../demo/${name}.html`);
		expect(html).toContain('class="code-demo-pair"');
		expect(html).toContain('class="demo"');
		expect(html).toContain('controls');
		const links = [...html.matchAll(/href="([^"]*README\.md)"/g)].map(
			(match) => match[1],
		);
		expect(links).toHaveLength(name === 'index' ? 2 : 1);
		for (const link of links)
			expect(link).toBe(
				'https://github.com/aarongustafson/fullscreen-control/blob/main/README.md',
			);
		expect(html).toContain('<footer>');
		expect(html).toMatch(/<noscript[\s>]/);
	}
});
