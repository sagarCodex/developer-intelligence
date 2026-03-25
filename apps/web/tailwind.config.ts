import type { Config } from 'tailwindcss';
import uiPreset from '@repo/ui/tailwind';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  presets: [uiPreset as Config],
  plugins: [],
};

export default config;
