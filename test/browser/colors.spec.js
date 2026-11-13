import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const read = (path) =>
	readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
const source = await read('fullscreen-control.js');
const definition = await read('define.js');
const tokens = [
	'Canvas',
	'CanvasText',
	'ButtonFace',
	'ButtonText',
	'Field',
	'FieldText',
];
// The study's 62 observations reduce to 19 palettes, not 19 OS repainting tests.
const palettes = [
	['#ffffff', '#000000', '#efefef', '#000000', '#ffffff', '#000000'],
	['#121212', '#ffffff', '#6b6b6b', '#ffffff', '#3b3b3b', '#ffffff'],
	['#ffffff', '#000000', '#e9e9ed', '#000000', '#ffffff', '#000000'],
	['#1c1b22', '#fbfbfe', '#2b2a33', '#fbfbfe', '#2b2a33', '#fbfbfe'],
	['#ffffff', '#000000', '#c0c0c0', '#000000d8', '#ffffff', '#000000d8'],
	['#1e1e1e', '#ffffff', '#ffffff3f', '#ffffffd8', '#ffffff3f', '#ffffffd8'],
	['#ffffff', '#000000', '#f0f0f0', '#000000', '#ffffff', '#000000'],
	['#202020', '#ffffff', '#202020', '#ffffff', '#202020', '#ffffff'],
	['#fffaef', '#3d3d3d', '#fffaef', '#202020', '#fffaef', '#3d3d3d'],
	['#2d3236', '#ffffff', '#2d3236', '#b6f6f0', '#2d3236', '#ffffff'],
	['#000000', '#ffffff', '#000000', '#ffee32', '#000000', '#ffffff'],
	['#000000', '#ffffff', '#000000', '#ffee32', '#000000', '#ffee32'],
	['#2d3236', '#ffffff', '#2d3236', '#b6f6f0', '#2d3236', '#b6f6f0'],
	['#fffaef', '#3d3d3d', '#fffaef', '#202020', '#fffaef', '#202020'],
	['#ffffff', '#000000', '#c0c0c0', '#000000', '#ffffff', '#000000'],
	['#000000', '#ffffff', '#c0c0c0', '#000000', '#ffffff', '#000000'],
	['#ffffff', '#000000', '#ffffff', '#000000d8', '#ffffff', '#000000d8'],
	['#282828', '#ffffff', '#202020', '#ffffff', '#202020', '#ffffff'],
	['#202020', '#ffffff', '#00000000', '#ffffff', '#00000000', '#ffffff'],
];

function substitute(css, palette) {
	const colors = Object.fromEntries(
		tokens.map((token, index) => [token.toLowerCase(), palette[index]]),
	);
	return css.replace(
		/\b(CanvasText|Canvas|ButtonFace|ButtonText|FieldText|Field)\b/gi,
		(token) => colors[token.toLowerCase()],
	);
}

async function measurements(locator) {
	return locator.evaluate((element) => {
		const canvas = document.createElement('canvas');
		canvas.width = canvas.height = 1;
		const context = canvas.getContext('2d', { willReadFrequently: true });
		if (!context) throw new Error('Canvas measurement unavailable.');
		const pixel = () => [...context.getImageData(0, 0, 1, 1).data];
		const paint = (color) => {
			context.fillStyle = color;
			context.fillRect(0, 0, 1, 1);
			return pixel();
		};
		const background = (node) => {
			context.clearRect(0, 0, 1, 1);
			const ancestors = [];
			for (; node; node = node.parentElement) ancestors.unshift(node);
			for (const ancestor of ancestors) {
				const style = getComputedStyle(ancestor);
				if (style.opacity !== '1')
					throw new Error('Opacity requires group compositing.');
				paint(style.backgroundColor);
				if (style.backgroundImage !== 'none') {
					const gradient = style.backgroundImage.match(
						/^linear-gradient\((.+), \1\)$/,
					);
					if (!gradient)
						throw new Error(
							`Unsupported background: ${style.backgroundImage}`,
						);
					paint(gradient[1]);
				}
			}
			if (pixel()[3] !== 255)
				throw new Error('Expected an opaque surface.');
			return pixel();
		};
		const luminance = (rgb) =>
			rgb.slice(0, 3).reduce((sum, channel, index) => {
				const value = channel / 255;
				return (
					sum +
					(value <= 0.04045
						? value / 12.92
						: ((value + 0.055) / 1.055) ** 2.4) *
						[0.2126, 0.7152, 0.0722][index]
				);
			}, 0);
		const ratio = (a, b) => {
			const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
			return (values[0] + 0.05) / (values[1] + 0.05);
		};
		const style = getComputedStyle(element);
		const fill = background(element);
		const text = ratio(paint(style.color), fill);
		background(element);
		const border = paint(style.borderTopColor);
		const paintsBorder =
			parseFloat(style.borderTopWidth) > 0 &&
			!['none', 'hidden'].includes(style.borderTopStyle);
		return { text, boundary: paintsBorder ? ratio(border, fill) : 1 };
	});
}

async function demo(page, name = 'index.html') {
	await page.route('https://esm.sh/**', (route) =>
		route.fulfill({ contentType: 'text/javascript', body: source }),
	);
	await page.route('https://unpkg.com/**', (route) =>
		route.fulfill({
			contentType: 'text/javascript',
			body: definition.replace(
				"'./fullscreen-control.js'",
				"'http://127.0.0.1:4183/fullscreen-control.js'",
			),
		}),
	);
	await page.route('https://commondatastorage.googleapis.com/**', (route) =>
		route.abort(),
	);
	await page.route('https://www.youtube.com/**', (route) =>
		route.fulfill({
			contentType: 'text/html',
			body: '<!doctype html><title>Embedded content</title><p>Embedded presentation.</p>',
		}),
	);
	await page.goto(`/demo/${name}`);
	await expect(
		page.locator('fullscreen-control > button').first(),
	).toBeVisible();
}

test('palette replacement calibrates mixed-case and normalized CSSOM colors', async ({
	page,
}) => {
	const css =
		'.probe { background: cAnVaS; color: canvastext; border-color: BUTTONFACE; outline-color: buttontext; text-decoration-color: field; column-rule-color: FieldText; }';
	await page.setContent(
		`<style>${css}</style><div class="probe">Palette</div>`,
	);
	const serialized = await page
		.locator('style')
		.evaluate((style) => style.sheet.cssRules[0].cssText);
	const palette = [
		'#010203',
		'#112233',
		'#445566',
		'#778899',
		'#aabbcc',
		'#ddeeff',
	];
	for (const input of [css, serialized.toLowerCase()]) {
		await page.locator('style').evaluate(
			(style, css) => {
				style.textContent = css;
			},
			substitute(input, palette),
		);
		expect(
			await page.locator('.probe').evaluate((element) => {
				const style = getComputedStyle(element);
				return [
					'backgroundColor',
					'color',
					'borderTopColor',
					'outlineColor',
					'textDecorationColor',
					'columnRuleColor',
				].map((property) => style[property]);
			}),
		).toEqual([
			'rgb(1, 2, 3)',
			'rgb(17, 34, 51)',
			'rgb(68, 85, 102)',
			'rgb(119, 136, 153)',
			'rgb(170, 187, 204)',
			'rgb(221, 238, 255)',
		]);
	}
});

for (const colorScheme of ['light', 'dark']) {
	test(`${colorScheme}: reading surfaces and event output retain text contrast`, async ({
		page,
	}) => {
		await page.emulateMedia({ colorScheme });
		await demo(page);
		await page
			.locator('#event-demo')
			.dispatchEvent('fullscreen-control:enter');
		for (const selector of [
			'body',
			'.demo-section',
			'.demo',
			'pre',
			'.api-reference',
			'.event-log',
			'.event-log .event',
			'footer',
		]) {
			expect(
				(await measurements(page.locator(selector).first())).text,
				selector,
			).toBeGreaterThanOrEqual(4.5);
		}
	});
	test(`${colorScheme}: native button palette is measured separately`, async ({
		page,
		browserName,
	}) => {
		test.fail(
			process.platform === 'linux' &&
				browserName === 'webkit' &&
				colorScheme === 'dark',
			'Bundled Ubuntu WebKit native dark ButtonText/ButtonFace is 1.82:1.',
		);
		await page.emulateMedia({ colorScheme });
		await demo(page);
		expect(
			(
				await measurements(
					page.locator('fullscreen-control > button').first(),
				)
			).text,
		).toBeGreaterThanOrEqual(4.5);
	});
}

test('all study palettes retain text and necessary button-boundary contrast', async ({
	page,
}) => {
	test.setTimeout(120000);
	const css = await read('demo/styles.css');
	await demo(page);
	const style = await page.addStyleTag({ content: css });
	const frameStyle = page
		.frameLocator('#iframe-demo iframe')
		.locator('style');
	const frameCss = await frameStyle.textContent();
	await page.locator('#event-demo').dispatchEvent('fullscreen-control:enter');
	for (const palette of palettes) {
		await style.evaluate(
			(style, css) => {
				style.textContent = css;
			},
			substitute(css, palette),
		);
		await frameStyle.evaluate(
			(style, css) => {
				style.textContent = css;
			},
			substitute(frameCss, palette),
		);
		expect(
			(
				await measurements(
					page.frameLocator('#iframe-demo iframe').locator('body'),
				)
			).text,
		).toBeGreaterThanOrEqual(4.5);
		for (const selector of [
			'body',
			'.demo-section',
			'.demo',
			'pre',
			'.api-reference',
			'.event-log',
			'.event-log .event',
			'footer',
		]) {
			expect(
				(await measurements(page.locator(selector).first())).text,
				`${palette[0]} ${selector}`,
			).toBeGreaterThanOrEqual(4.5);
		}
		for (const button of await page
			.locator('fullscreen-control > button')
			.all()) {
			for (const hover of [false, true]) {
				if (hover) await button.hover();
				const result = await measurements(button);
				expect(
					result.text,
					`${palette[0]} ${await button.textContent()}`,
				).toBeGreaterThanOrEqual(4.5);
				expect(result.boundary).toBeGreaterThanOrEqual(3);
			}
		}
	}
});

test('fixture server supports native media byte-range requests', async ({
	request,
}) => {
	const response = await request.get('/demo/sample.webm', {
		headers: { Range: 'bytes=0-1' },
	});
	expect(response.status()).toBe(206);
	expect(response.headers()['content-range']).toMatch(/^bytes 0-1\/\d+$/);
	expect([...(await response.body())]).toEqual([0x1a, 0x45]);
	const invalid = await request.get('/demo/sample.webm', {
		headers: { Range: 'bytes=999999999-' },
	});
	expect(invalid.status()).toBe(416);
});

test('local silent video decodes and plays to completion without autoplay', async ({
	page,
}) => {
	await demo(page);
	const video = page.locator('video').first();
	await expect
		.poll(() => video.evaluate((video) => video.readyState))
		.toBeGreaterThanOrEqual(1);
	expect(await video.evaluate((video) => video.paused)).toBe(true);
	await video.evaluate((video) => {
		const play = document.createElement('button');
		play.textContent = 'Play test clip';
		play.addEventListener('click', () => {
			video
				.play()
				.catch((error) =>
					console.error('Test playback failed:', error),
				);
		});
		video.parentElement.after(play);
	});
	await page
		.getByRole('button', { name: 'Play test clip', exact: true })
		.click();
	await expect
		.poll(() => video.evaluate((video) => video.currentTime))
		.toBeGreaterThan(0);
	await expect
		.poll(() => video.evaluate((video) => video.ended), { timeout: 10000 })
		.toBe(true);
});

test('class-only imports preserve manual registration and default positioning hooks', async ({
	page,
}) => {
	await page.route('**/fixture.html', (route) =>
		route.fulfill({
			contentType: 'text/html',
			body: '<!doctype html><fullscreen-control style="--fullscreen-control-button-inset-block-start:2rem;--fullscreen-control-button-inset-inline-end:3rem"><video controls></video></fullscreen-control><script type="module">import { FullscreenControlElement } from "/index.js"; window.classOnlyLoaded = typeof FullscreenControlElement === "function";</script>',
		}),
	);
	await page.goto('/fixture.html');
	await expect
		.poll(() => page.evaluate(() => window.classOnlyLoaded))
		.toBe(true);
	expect(
		await page.evaluate(() =>
			Boolean(customElements.get('fullscreen-control')),
		),
	).toBe(false);
	await expect(page.locator('button')).toHaveCount(0);
	await page.evaluate((path) => import(path), '/define.js');
	await expect(page.locator('button')).toBeVisible();
	expect(
		await page.locator('button').evaluate((button) => {
			const style = getComputedStyle(button);
			return [
				style.position,
				style.insetBlockStart,
				style.insetInlineEnd,
			];
		}),
	).toEqual(['absolute', '32px', '48px']);
	expect(
		await page.evaluate(async (path) => {
			const { defineFullscreenControl } = await import(path);
			if (!defineFullscreenControl())
				throw new Error('Default registration failed.');
			try {
				defineFullscreenControl('custom-fullscreen');
			} catch (error) {
				if (error instanceof DOMException) return error.name;
				throw error;
			}
			throw new Error('Constructor reuse must throw.');
		}, '/define.js'),
	).toBe('NotSupportedError');
});

test('labels, associations, HTML-safe content, and lifecycle cleanup remain native', async ({
	page,
}) => {
	await demo(page);
	const host = page.locator('#named-demo');
	const button = host.locator('button');
	const video = host.locator('video');
	await expect(button).toHaveAccessibleName('View Moving circle fullscreen');
	await expect(button).toHaveAttribute(
		'aria-controls',
		await video.getAttribute('id'),
	);
	await video.evaluate((video) =>
		video.setAttribute('aria-label', '<em>New name</em>'),
	);
	await expect(button).toHaveText('View <em>New name</em> fullscreen');
	await expect(button.locator('em')).toHaveCount(0);
	await expect(
		page.locator('fullscreen-control[lang="ja"] button'),
	).toHaveAccessibleName('全画面表示');
	expect(
		await button.evaluate(
			(button) => getComputedStyle(button).outlineStyle,
		),
	).not.toBe('solid');
	await button.focus();
	expect(
		await button.evaluate((button) => button.matches(':focus-visible')),
	).toBe(true);
	expect(
		await button.evaluate(
			(button) => getComputedStyle(button).outlineStyle,
		),
	).not.toBe('none');
	await host.evaluate((host) => {
		const parent = host.parentElement;
		host.remove();
		parent.appendChild(host);
	});
	await expect(host.locator('button')).toHaveCount(1);
	await expect(page.locator('#fullscreen-control-styles')).toHaveCount(1);
});

test('name substitution retains existing replacement-string semantics without parsing HTML', async ({
	page,
}) => {
	await demo(page);
	for (const selector of ['#named-demo', '.icon-only']) {
		const host = page.locator(selector);
		for (const [name, expected] of [
			['$&', 'View {name} fullscreen'],
			['$$', 'View $ fullscreen'],
			['$`', 'View View  fullscreen'],
			["$'", 'View  fullscreen fullscreen'],
		]) {
			await host
				.locator('video')
				.evaluate(
					(video, name) => video.setAttribute('aria-label', name),
					name,
				);
			await expect(host.locator('button')).toHaveAccessibleName(expected);
			await expect(host.locator('button')).toHaveText(
				selector === '.icon-only' ? '⤢' : expected,
			);
		}
	}
});

test('native iframe fullscreen fires events and restores keyboard focus after exit', async ({
	page,
}) => {
	await demo(page);
	test.skip(
		!(await page.evaluate(() => document.fullscreenEnabled)),
		'Native Fullscreen API unavailable in this browser configuration.',
	);
	const host = page.locator('#iframe-demo');
	await host.evaluate((host) => {
		host.dataset.events = '';
		host.dataset.payloads = '[]';
		for (const type of ['enter', 'exit'])
			host.addEventListener(`fullscreen-control:${type}`, (event) => {
				host.dataset.events += `${type} `;
				const payloads = JSON.parse(host.dataset.payloads);
				payloads.push({
					detail: event.detail,
					bubbles: event.bubbles,
					composed: event.composed,
				});
				host.dataset.payloads = JSON.stringify(payloads);
			});
	});
	const button = host.locator('button');
	await button.focus();
	await page.keyboard.press('Enter');
	await expect
		.poll(() => page.evaluate(() => document.fullscreenElement?.tagName))
		.toBe('IFRAME');
	await expect(host).toHaveAttribute('data-events', 'enter ');
	await page.evaluate(() => document.exitFullscreen());
	await expect(host).toHaveAttribute('data-events', 'enter exit ');
	expect(
		await host.evaluate((host) => JSON.parse(host.dataset.payloads)),
	).toEqual([
		{ detail: null, bubbles: true, composed: true },
		{ detail: null, bubbles: true, composed: true },
	]);
	await expect(button).toBeFocused();
});

test('diagonal-arrow control keeps its authored accessible name and native focus', async ({
	page,
}) => {
	await demo(page);
	const host = page.locator('.icon-only');
	const button = host.locator('button');
	await expect(button).toHaveCount(1);
	await expect(button).toHaveText('⤢');
	await expect(button).toHaveAccessibleName('View Moving circle fullscreen');
	await expect(button).toHaveAttribute(
		'aria-controls',
		await host.locator('video').getAttribute('id'),
	);
	await button.focus();
	expect(
		await button.evaluate(
			(button) => getComputedStyle(button).outlineStyle,
		),
	).not.toBe('none');
	await host
		.locator('video')
		.evaluate((video) => video.setAttribute('aria-label', 'Updated clip'));
	await expect(button).toHaveAccessibleName('View Updated clip fullscreen');
	await expect(button).toHaveText('⤢');
});

test('overlaid demos preserve authored logical positioning offsets', async ({
	page,
}) => {
	await demo(page);
	const host = page.locator('fullscreen-control').first();
	await host.evaluate((host) => {
		host.style.setProperty(
			'--fullscreen-control-button-inset-block-start',
			'1rem',
		);
		host.style.setProperty(
			'--fullscreen-control-button-inset-inline-end',
			'1.5rem',
		);
	});
	for (const direction of ['ltr', 'rtl']) {
		await host.evaluate((host, direction) => {
			host.dir = direction;
		}, direction);
		const offsets = await host.evaluate((host) => {
			const media = host.querySelector('video').getBoundingClientRect();
			const button = host.querySelector('button').getBoundingClientRect();
			return {
				top: button.top - media.top,
				end:
					host.dir === 'rtl'
						? button.left - media.left
						: media.right - button.right,
			};
		});
		expect(offsets.top).toBeCloseTo(16, 1);
		expect(offsets.end).toBeCloseTo(24, 1);
	}
});

test('ordinary fullscreen label words do not split at 320px with enlarged text', async ({
	page,
}) => {
	await demo(page);
	await page.setViewportSize({ width: 320, height: 900 });
	await page.evaluate(() => {
		document.documentElement.style.fontSize = '200%';
	});
	const button = page.locator('#named-demo button');
	expect(
		await button.evaluate((button) => {
			const text = button.firstChild;
			const start = text.textContent.indexOf('fullscreen');
			const range = document.createRange();
			range.setStart(text, start);
			range.setEnd(text, start + 'fullscreen'.length);
			return [...range.getClientRects()].filter((rect) => rect.width > 0)
				.length;
		}),
	).toBe(1);
});

test('event log retains full contrast and only five literal messages', async ({
	page,
}) => {
	await demo(page);
	for (let index = 0; index < 12; index++)
		await page
			.locator('#event-demo')
			.dispatchEvent('fullscreen-control:enter', {
				detail: '<img src=x onerror=alert(1)>',
			});
	await expect(page.locator('#event-log-content .event')).toHaveCount(5);
	await expect(page.locator('#event-log-content img')).toHaveCount(0);
});

test('forced colors and increased contrast preserve native focus and full-strength supporting text', async ({
	page,
	browserName,
}) => {
	test.skip(
		browserName !== 'chromium',
		'Forced-color emulation is Chromium-only.',
	);
	await page.emulateMedia({ forcedColors: 'active', contrast: 'more' });
	await demo(page);
	const button = page.locator('.custom-style button');
	await button.focus();
	expect(
		await button.evaluate(
			(element) => getComputedStyle(element).forcedColorAdjust,
		),
	).toBe('auto');
	expect(
		await button.evaluate(
			(element) => getComputedStyle(element).outlineStyle,
		),
	).not.toBe('none');
	expect(
		await page
			.locator('footer')
			.evaluate((element) => getComputedStyle(element).color),
	).toBe(
		await page
			.locator('body')
			.evaluate((element) => getComputedStyle(element).color),
	);
	await expect(page.locator('.icon-only button')).toHaveText('⤢');
	await expect(page.locator('.icon-only button')).toHaveAccessibleName(
		'View Moving circle fullscreen',
	);
});

for (const name of ['index.html', 'esm.html', 'unpkg.html']) {
	test(`${name}: code/live pairs and controls reflow at wide and narrow enlarged text`, async ({
		page,
	}) => {
		await demo(page, name);
		for (const width of [1400, 1024, 768, 320]) {
			await page.setViewportSize({ width, height: 900 });
			await page.evaluate(() => {
				document.documentElement.style.fontSize = '200%';
			});
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= innerWidth,
				),
			).toBe(true);
			for (const button of await page
				.locator('fullscreen-control > button')
				.all()) {
				await button.scrollIntoViewIfNeeded();
				const geometry = await button.evaluate((button) => {
					const box = button.getBoundingClientRect();
					const media = button.parentElement
						.querySelector('video, iframe')
						.getBoundingClientRect();
					return {
						left: box.left,
						right: box.right,
						height: box.height,
						topOffset: box.top - media.top,
						endOffset: media.right - box.right,
						bottomGap: media.bottom - box.bottom,
						inset:
							parseFloat(
								getComputedStyle(document.documentElement)
									.fontSize,
							) / 2,
						hit: button.contains(
							document.elementFromPoint(
								box.left + box.width / 2,
								box.top + box.height / 2,
							),
						),
					};
				});
				expect(geometry.left).toBeGreaterThanOrEqual(0);
				expect(geometry.right).toBeLessThanOrEqual(width);
				expect(geometry.height).toBeGreaterThanOrEqual(44);
				expect(geometry.hit).toBe(true);
				expect(geometry.topOffset).toBeCloseTo(geometry.inset, 1);
				expect(geometry.endOffset).toBeCloseTo(geometry.inset, 1);
				expect(geometry.bottomGap).toBeGreaterThanOrEqual(
					geometry.inset * 6 - 1,
				);
			}
		}
		await page.setViewportSize({ width: 1400, height: 900 });
		await page.evaluate(() => {
			document.documentElement.style.fontSize = '';
		});
		for (const pair of await page.locator('.code-demo-pair').all()) {
			const code = await pair.locator('pre').boundingBox();
			const live = await pair.locator('.demo').boundingBox();
			expect(code.x + code.width).toBeLessThanOrEqual(live.x);
		}
	});
	for (const failure of ['no JavaScript', 'module failure']) {
		test(`${name}: usable media with ${failure}`, async ({ browser }) => {
			const context = await browser.newContext({
				javaScriptEnabled: failure !== 'no JavaScript',
			});
			const page = await context.newPage();
			if (failure === 'module failure')
				await page.route(/\.js(?:\?|$)/, (route) => route.abort());
			await page.goto(`http://127.0.0.1:4183/demo/${name}`);
			await expect(page.locator('video').first()).toHaveAttribute(
				'controls',
				'',
			);
			await expect(
				page.locator('fullscreen-control > button'),
			).toHaveCount(0);
			await expect(
				page.getByText('Silent clip:', { exact: false }).first(),
			).toBeVisible();
			await context.close();
		});
	}
}
