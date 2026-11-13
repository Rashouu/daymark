import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config';

// The icon is full-bleed with the stamp inside the maskable safe zone, so no extra padding.
export default defineConfig({
  preset: {
    ...preset,
    transparent: { ...preset.transparent, padding: 0 },
    maskable: { ...preset.maskable, padding: 0, resizeOptions: { background: '#f8f7f3' } },
    apple: { ...preset.apple, padding: 0, resizeOptions: { background: '#f8f7f3' } },
  },
  images: ['public/icon.svg'],
});
