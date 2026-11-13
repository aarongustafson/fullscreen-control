import { execFileSync } from 'node:child_process';
import {
	copyFileSync,
	mkdtempSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { it, expect } from 'vitest';

it('retains publishing scripts and updates both displayed and executed ESM pins', () => {
	const source = join(dirname(fileURLToPath(import.meta.url)), '..');
	const root = mkdtempSync(join(tmpdir(), 'fullscreen-control-version-'));
	try {
		mkdirSync(join(root, 'scripts'));
		mkdirSync(join(root, 'demo'));
		const pkg = JSON.parse(
			readFileSync(join(source, 'package.json'), 'utf8'),
		);
		expect(pkg.scripts.version).toBe(
			'node scripts/update-demo-versions.js && git add demo/esm.html',
		);
		expect(pkg.scripts.postversion).toBe('git push --follow-tags');
		pkg.version = '9.8.7';
		writeFileSync(join(root, 'package.json'), JSON.stringify(pkg));
		for (const path of ['scripts/update-demo-versions.js', 'demo/esm.html'])
			copyFileSync(join(source, path), join(root, path));
		execFileSync(process.execPath, ['scripts/update-demo-versions.js'], {
			cwd: root,
		});
		expect(
			readFileSync(join(root, 'demo/esm.html'), 'utf8').match(
				/fullscreen-control@9\.8\.7\//g,
			),
		).toHaveLength(2);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
