import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(tsx|mdx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y'],
  framework: '@storybook/react-vite',
  staticDirs: [{ from: '../tokens/tokens.css', to: 'tokens.css' }],
};

export default config;
