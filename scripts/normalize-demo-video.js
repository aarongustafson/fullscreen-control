// Chromium's recorder can write milliseconds into the media-timescale duration.
// Derive that duration from the encoded frames instead of the wall-clock timer.
export function normalizeDemoVideo(bytes) {
	const headers = new Map();
	function visit(start, end) {
		for (let offset = start; offset < end;) {
			if (offset + 8 > end) throw new Error('Truncated demo video box.');
			const size = bytes.readUInt32BE(offset);
			if (size < 8 || offset + size > end)
				throw new Error('Invalid demo video box size.');
			const type = bytes.toString('ascii', offset + 4, offset + 8);
			if (['mdhd', 'trun'].includes(type)) {
				if (headers.has(type))
					throw new Error('Expected a single recorded video track.');
				headers.set(type, { offset, size });
			}
			if (['moov', 'trak', 'mdia', 'moof', 'traf'].includes(type))
				visit(offset + 8, offset + size);
			offset += size;
		}
	}
	visit(0, bytes.length);
	const media = headers.get('mdhd');
	const run = headers.get('trun');
	if (
		!media ||
		!run ||
		media.size < 44 ||
		bytes[media.offset + 8] !== 1 ||
		run.size < 20 ||
		bytes.readUInt32BE(run.offset + 8) !== 0x01000305
	)
		throw new Error('Unsupported demo video timing format.');
	const count = bytes.readUInt32BE(run.offset + 12);
	if (!count || run.size !== 24 + count * 8)
		throw new Error('Invalid demo video frame table.');
	let duration = 0n;
	for (let frame = 0; frame < count; frame++)
		duration += BigInt(bytes.readUInt32BE(run.offset + 24 + frame * 8));
	bytes.writeBigUInt64BE(duration, media.offset + 32);
	return bytes;
}
