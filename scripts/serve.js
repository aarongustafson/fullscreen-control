import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const types = new Map([
	['.css', 'text/css'],
	['.html', 'text/html'],
	['.js', 'text/javascript'],
	['.json', 'application/json'],
	['.webm', 'video/webm'],
]);

createServer(async (request, response) => {
	const pathname = new URL(request.url, 'http://localhost').pathname;
	const requestedPath = resolve(root, `.${pathname}`);
	if (!requestedPath.startsWith(`${resolve(root)}${sep}`)) {
		response.writeHead(403).end();
		return;
	}
	try {
		const file = await stat(requestedPath);
		if (!file.isFile()) {
			response.writeHead(404).end();
			return;
		}
		let start = 0;
		let end = file.size - 1;
		const range = request.headers.range;
		if (range) {
			const match = range.match(/^bytes=(\d*)-(\d*)$/);
			if (!match || (!match[1] && !match[2])) {
				response
					.writeHead(416, { 'content-range': `bytes */${file.size}` })
					.end();
				return;
			}
			start = match[1]
				? Number(match[1])
				: Math.max(0, file.size - Number(match[2]));
			end = match[1] && match[2] ? Number(match[2]) : file.size - 1;
			if (
				!Number.isSafeInteger(start) ||
				!Number.isSafeInteger(end) ||
				start >= file.size ||
				end < start
			) {
				response
					.writeHead(416, { 'content-range': `bytes */${file.size}` })
					.end();
				return;
			}
			end = Math.min(end, file.size - 1);
		}
		response.writeHead(range ? 206 : 200, {
			'accept-ranges': 'bytes',
			'content-length': end - start + 1,
			...(range
				? { 'content-range': `bytes ${start}-${end}/${file.size}` }
				: {}),
			'content-type':
				types.get(extname(requestedPath)) || 'application/octet-stream',
			'cache-control': 'no-store',
		});
		if (request.method === 'HEAD' || file.size === 0) {
			response.end();
			return;
		}
		createReadStream(requestedPath, { start, end })
			.on('error', (error) => {
				console.error('Unable to stream test fixture:', error);
				response.destroy(error);
			})
			.pipe(response);
	} catch (error) {
		if (error.code === 'ENOENT') response.writeHead(404).end();
		else {
			console.error('Unable to serve test fixture:', error);
			response.writeHead(500).end();
		}
	}
}).listen(4183, '127.0.0.1');
