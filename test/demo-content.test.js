import { readFile } from 'node:fs/promises';
import { Window } from 'happy-dom';
import { afterEach, expect, test } from 'vitest';

const windows = [];
afterEach(async () => {
	await Promise.all(
		windows.splice(0).map((window) => window.happyDOM.close()),
	);
});

async function readPage(name) {
	const window = new Window({
		settings: {
			disableCSSFileLoading: true,
			disableJavaScriptFileLoading: true,
			disableJavaScriptEvaluation: true,
			disableIframePageLoading: true,
		},
	});
	windows.push(window);
	return new window.DOMParser().parseFromString(
		await readFile(`demo/${name}`, 'utf8'),
		'text/html',
	);
}

for (const name of ['index.html', 'esm.html', 'unpkg.html']) {
	test(`${name}: every example has its own unique fragment destination`, async () => {
		const page = await readPage(name);
		const ids = [...page.querySelectorAll('[id]')].map((node) => node.id);
		expect(new Set(ids).size).toBe(ids.length);
		const destinations = new Set();
		for (const pair of page.querySelectorAll('.code-demo-pair')) {
			const block = pair.parentElement;
			expect(
				block.querySelector(':scope > h2, :scope > h3'),
			).not.toBeNull();
			expect(block.id).toMatch(/^[a-z][a-z0-9-]+$/);
			expect(destinations.has(block.id)).toBe(false);
			destinations.add(block.id);
		}
	});
}

test('plain authored content introduces self mode before optional code composition', async () => {
	const page = await readPage('index.html');
	const controls = [
		...page.querySelectorAll('.demo fullscreen-control[target="self"]'),
	];
	expect(controls.length).toBeGreaterThan(1);
	expect(controls[0].querySelector('micro-lighter')).toBeNull();
	expect(controls[0].querySelector('h3, h4')).not.toBeNull();
	expect(controls[0].querySelector('a[href="./frame.html"]')).not.toBeNull();
	expect(controls[0].getAttribute('aria-label')).toBeTruthy();
	expect(controls[0].getAttribute('error-text')).toBeTruthy();
	expect(
		page.getElementById('microlighter-example').querySelector('#code-demo'),
	).not.toBeNull();
});

test('the Japanese wrapper authors entry, exit, and recovery wording in its content language', async () => {
	const page = await readPage('index.html');
	const host = page.querySelector(
		'.demo fullscreen-control[lang="ja"][target="self"]',
	);
	expect(host).not.toBeNull();
	for (const name of [
		'aria-label',
		'button-text',
		'exit-text',
		'error-text',
	]) {
		expect(host.getAttribute(name)).toMatch(/[ぁ-んァ-ン一-龯]/);
	}
	const snippet = host
		.closest('.code-demo-pair')
		.firstElementChild.querySelector('code').textContent;
	for (const name of [
		'aria-label',
		'button-text',
		'exit-text',
		'error-text',
	]) {
		expect(snippet).toContain(`${name}="${host.getAttribute(name)}"`);
	}
});

for (const name of ['index.html', 'esm.html', 'unpkg.html']) {
	test(`${name}: the basic video snippet retains the live description and direct link`, async () => {
		const page = await readPage(name);
		const pair = page.querySelector('.code-demo-pair');
		const snippet =
			pair.firstElementChild.querySelector('code').textContent;
		const description = pair.querySelector('.demo > p');
		const link = description.querySelector('a');
		const text = description.firstChild.textContent
			.trim()
			.replace(/\s+/g, ' ');
		expect(snippet.replace(/\s+/g, ' ')).toContain(
			`${text} <a href="${link.getAttribute('href')}">${link.textContent}</a>.`,
		);
	});
}
