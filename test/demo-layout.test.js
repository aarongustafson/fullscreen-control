import { readFile, readdir } from 'node:fs/promises';
import { expect, it, afterEach, vi } from 'vitest';

it('trims block-edge margins inside demo sections', async () => {
	const styles = await readFile('demo/styles.css', 'utf8');
	expect(styles).toMatch(
		/\.demo-section(?:,\s*\.api-reference)?\s*\{[^}]*\bmargin-trim:\s*block;/,
	);
});

it('progressively enhances every displayed code example on each import page', async () => {
	for (const name of ['index', 'esm', 'unpkg']) {
		const template = document.createElement('template');
		template.innerHTML = await readFile(`demo/${name}.html`, 'utf8');
		const root = template.content;
		for (const code of root.querySelectorAll('pre > code')) {
			expect(
				code.children.length,
				`${name}: keep code as plain text for MicroLighter`,
			).toBe(0);
			const pre = code.parentElement;
			const lighter = pre.parentElement;
			expect(
				lighter.localName,
				`${name}: ${pre.getAttribute('aria-label')}`,
			).toBe('micro-lighter');
			expect(lighter.getAttribute('language')).toMatch(
				/^(html|javascript|css)$/,
			);
			if (/^\s*[\w$]+\.addEventListener\(/.test(code.textContent)) {
				expect(lighter.getAttribute('language')).toBe('javascript');
				expect(lighter.getAttribute('data-label')).toBe('JavaScript');
			}
			expect(lighter.getAttribute('controls')).toBe('copy');
			expect(pre.getAttribute('tabindex')).toBe('0');
			expect(pre.getAttribute('aria-label')).toBeTruthy();
		}
		expect(root.querySelector('a.skip-link')?.getAttribute('href')).toBe(
			'#main',
		);
		expect(root.querySelector('main')?.id).toBe('main');
		expect(root.querySelector('script[src="./demo.js"]')).not.toBeNull();
	}
});

let optionalTheme;
afterEach(() => {
	document.body.replaceChildren();
	document.head
		.querySelectorAll('link[data-code-theme]')
		.forEach((link) => link.remove());
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	vi.resetModules();
});

function authoredSnippet() {
	vi.spyOn(document.head, 'insertBefore').mockImplementation((theme) => {
		optionalTheme = theme;
		return theme;
	});
	document.body.innerHTML = `
		<p id="microlighter-status" hidden></p>
		<micro-lighter language="html"><pre><code><mark>&lt;example-tag&gt;</mark>
  &lt;p&gt;Keep this text&lt;/p&gt;
<mark>&lt;/example-tag&gt;</mark></code></pre></micro-lighter>`;
	vi.stubGlobal('Highlight', class {});
	vi.stubGlobal('CSS', { highlights: new Map() });
	vi.doMock(
		'https://cdn.jsdelivr.net/npm/microlighter@2.2.0/dist/grammars/html.js',
		() => ({ default: { dependencies: ['javascript'] } }),
	);
	vi.doMock(
		'https://cdn.jsdelivr.net/npm/microlighter@2.2.0/dist/grammars/javascript.js',
		() => ({ default: { dependencies: [] } }),
	);
	vi.doMock(
		'https://cdn.jsdelivr.net/npm/microlighter@2.2.0/dist/micro-lighter-element.min.js',
		() => ({}),
	);
	return document.querySelector('code');
}

it('preserves complete text after loading the required grammars and element', async () => {
	const code = authoredSnippet();
	const text = code.textContent;
	await import('../demo/demo.js');
	expect(code.textContent).toBe(text);
	expect(code.childNodes).toHaveLength(1);
	expect(document.querySelector('#microlighter-status').hidden).toBe(true);
	const theme = optionalTheme;
	expect(theme.media).toBe('print');
	theme.dispatchEvent(new Event('load'));
	expect(theme.media).toBe('all');
});

it('retains authored marks and reports a required grammar failure', async () => {
	const code = authoredSnippet();
	const log = vi.spyOn(console, 'error').mockImplementation(() => {});
	vi.doMock(
		'https://cdn.jsdelivr.net/npm/microlighter@2.2.0/dist/grammars/javascript.js',
		() => {
			throw new Error('Grammar unavailable');
		},
	);
	await import('../demo/demo.js');
	expect(code.querySelector('mark')?.textContent).toBe('<example-tag>');
	expect(document.querySelector('#microlighter-status').hidden).toBe(false);
	expect(log).toHaveBeenCalledWith(
		'MicroLighter could not load:',
		expect.any(Error),
	);
});

it('retains authored marks when custom highlights are unsupported', async () => {
	const code = authoredSnippet();
	vi.stubGlobal('Highlight', undefined);
	vi.spyOn(console, 'error').mockImplementation(() => {});
	await import('../demo/demo.js');
	expect(code.querySelector('mark')?.textContent).toBe('<example-tag>');
	expect(
		document.querySelector('#microlighter-status').textContent,
	).toContain('Code remains readable and selectable');
	expect(document.querySelector('#microlighter-status').hidden).toBe(false);
});

it('retains authored marks and reports an unavailable entry module', async () => {
	const code = authoredSnippet();
	vi.spyOn(console, 'error').mockImplementation(() => {});
	vi.doMock(
		'https://cdn.jsdelivr.net/npm/microlighter@2.2.0/dist/micro-lighter-element.min.js',
		() => {
			throw new Error('CDN unavailable');
		},
	);
	await import('../demo/demo.js');
	expect(code.querySelector('mark')?.textContent).toBe('<example-tag>');
	expect(document.querySelector('#microlighter-status').hidden).toBe(false);
});

it.each(['before', 'after'])(
	'reports a theme-only failure %s successful enhancement without claiming the controls failed',
	async (timing) => {
		const code = authoredSnippet();
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		if (timing === 'before') {
			vi.doMock(
				'https://cdn.jsdelivr.net/npm/microlighter@2.2.0/dist/micro-lighter-element.min.js',
				() => {
					optionalTheme.dispatchEvent(new Event('error'));
					return {};
				},
			);
		}
		await import('../demo/demo.js');
		if (timing === 'after') optionalTheme.dispatchEvent(new Event('error'));
		const status = document.querySelector('#microlighter-status');
		expect(status.hidden).toBe(false);
		expect(status.textContent).toContain(
			'Code highlighting and Copy controls are available',
		);
		expect(status.textContent).toContain('syntax theme could not load');
		expect(code.childNodes).toHaveLength(1);
		expect(log).toHaveBeenCalledWith(
			'MicroLighter theme could not load:',
			expect.any(Error),
		);
	},
);

it('does not make the optional CDN stylesheet render-blocking', async () => {
	for (const file of await readdir('demo', { recursive: true })) {
		if (!file.endsWith('.html')) continue;
		const template = document.createElement('template');
		template.innerHTML = await readFile(`demo/${file}`, 'utf8');
		expect(
			template.content.querySelector('link[href*="microlighter"]'),
			file,
		).toBeNull();
	}
});
