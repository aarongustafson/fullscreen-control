import { readFile } from 'node:fs/promises';
import { expect, test } from 'vitest';
import { normalizeDemoVideo } from '../scripts/normalize-demo-video.js';

test('the silent clip declares the full duration of its encoded frames', async () => {
	const bytes = await readFile('demo/sample.mp4');
	const header = bytes.indexOf('mdhd');
	expect(bytes[header + 4]).toBe(1);
	const timescale = bytes.readUInt32BE(header + 24);
	const duration = Number(bytes.readBigUInt64BE(header + 28));
	const run = bytes.indexOf('trun');
	expect(bytes.readUInt32BE(run + 4) & 0x300).toBe(0x300);
	const count = bytes.readUInt32BE(run + 8);
	let encodedDuration = 0;
	for (let frame = 0; frame < count; frame++) {
		encodedDuration += bytes.readUInt32BE(run + 20 + frame * 8);
	}
	expect(duration / timescale).toBeCloseTo(encodedDuration / timescale, 2);
});

test('recording normalization repairs media timing without changing encoded frames', async () => {
	const bytes = await readFile('demo/sample.mp4');
	const header = bytes.indexOf('mdhd');
	const original = Buffer.from(bytes);
	bytes.writeBigUInt64BE(2939n, header + 28);
	normalizeDemoVideo(bytes);
	expect(bytes).toEqual(original);
	expect(normalizeDemoVideo(bytes)).toEqual(original);
	expect(() =>
		normalizeDemoVideo(bytes.subarray(0, bytes.length - 1)),
	).toThrow('Invalid demo video box size.');
});
