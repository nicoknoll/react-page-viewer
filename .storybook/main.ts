import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
    framework: '@storybook/react-vite',
    stories: ['../examples/**/*.stories.tsx'],
    staticDirs: ['../public'],
};

export default config;
