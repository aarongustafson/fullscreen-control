import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';

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
