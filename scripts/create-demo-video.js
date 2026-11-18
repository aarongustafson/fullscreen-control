import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
try {
	const context = await browser.newContext({
		viewport: { width: 320, height: 180 },
	});
	const page = await context.newPage();
	await page.setContent(
		'<style>body{margin:0}canvas{display:block}</style><canvas width="320" height="180"></canvas>',
	);
	const bytes = await page.evaluate(
		() =>
			new Promise((resolve, reject) => {
				const canvas = document.querySelector('canvas');
				const context = canvas.getContext('2d');
				const stream = canvas.captureStream(12);
				const recorder = new MediaRecorder(stream, {
					mimeType: 'video/mp4;codecs=avc1.42001E',
				});
				const chunks = [];
				recorder.ondataavailable = ({ data }) => chunks.push(data);
				recorder.onerror = () => {
					clearInterval(timer);
					stream.getTracks().forEach((track) => track.stop());
					reject(new Error('Unable to record the demo video.'));
				};
				recorder.onstop = async () => {
					stream.getTracks().forEach((track) => track.stop());
					try {
						resolve([
							...new Uint8Array(
								await new Blob(chunks).arrayBuffer(),
							),
						]);
					} catch (error) {
						reject(error);
					}
				};
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
				recorder.start();
				const timer = setInterval(() => {
					frame += 1;
					draw();
					if (frame === 36) {
						clearInterval(timer);
						recorder.stop();
					}
				}, 1000 / 12);
			}),
	);
	await context.close();
	await writeFile(
		fileURLToPath(new URL('../demo/sample.mp4', import.meta.url)),
		Buffer.from(bytes),
	);
} finally {
	await browser.close();
}
