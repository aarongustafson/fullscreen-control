import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const directory = await mkdtemp(join(tmpdir(), 'fullscreen-demo-video-'));
const browser = await chromium.launch();
try {
	const context = await browser.newContext({
		viewport: { width: 320, height: 180 },
		recordVideo: { dir: directory, size: { width: 320, height: 180 } },
	});
	const page = await context.newPage();
	const video = page.video();
	await page.setContent(
		'<style>body{margin:0}canvas{display:block}</style><canvas width="320" height="180"></canvas>',
	);
	await page.evaluate(
		() =>
			new Promise((resolve) => {
				const context = document
					.querySelector('canvas')
					.getContext('2d');
				let frame = 0;
				const draw = () => {
					context.fillStyle = '#eeeeee';
					context.fillRect(0, 0, 320, 180);
					context.fillStyle = '#234a6b';
					context.beginPath();
					context.arc(30 + frame * 7, 90, 20, 0, Math.PI * 2);
					context.fill();
				};
				draw();
				const timer = setInterval(() => {
					frame += 1;
					draw();
					if (frame === 36) {
						clearInterval(timer);
						resolve();
					}
				}, 1000 / 12);
			}),
	);
	await context.close();
	await video.saveAs(
		fileURLToPath(new URL('../demo/sample.webm', import.meta.url)),
	);
} finally {
	await browser.close();
	await rm(directory, { recursive: true, force: true });
}
