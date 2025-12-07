import eslintConfig from '@open-wc/eslint-config';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
	...eslintConfig,
	eslintConfigPrettier,
	{
		ignores: ['node_modules/**', 'coverage/**'],
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
