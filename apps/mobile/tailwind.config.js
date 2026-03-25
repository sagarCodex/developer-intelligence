const uiPreset = require('@repo/ui/tailwind');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  presets: [uiPreset],
  plugins: [],
};
