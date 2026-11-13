import eslintConfig from '@open-wc/eslint-config';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
	...eslintConfig,
	eslintConfigPrettier,
	{
		files: ['scripts/create-demo-video.js'],
		rules: {
			'import-x/no-extraneous-dependencies': [
				'error',
				{ devDependencies: true },
			],
		},
	},
	{
		ignores: [
			'node_modules/**',
			'coverage/**',
			'demo/**',
			'playwright-report/**',
			'test-results/**',
		],
	},
	{
		files: ['demo/**/*.html'],
		rules: {
			// Allow CDN imports in demo files
			'import-x/no-unresolved': [
				'error',
				{
					ignore: ['^https://'],
				},
			],
		},
	},
];
