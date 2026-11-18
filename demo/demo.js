const status = document.getElementById('microlighter-status');
status.hidden = false;
status.textContent = 'Loading optional code highlighting and Copy controls.';

try {
	await import('https://cdn.jsdelivr.net/npm/microlighter@2.2.0/dist/micro-lighter-element.min.js');
	status.textContent = '';
	status.hidden = true;
} catch (error) {
	console.error('MicroLighter could not load:', error);
	status.textContent =
		'MicroLighter could not load. Code remains readable and selectable; fullscreen works independently.';
}
