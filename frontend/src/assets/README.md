# Assets Directory

This directory contains static assets (images, fonts, etc.) that are processed by Vite.

## Directory Structure

```
assets/
  logos/          # Logo files (see logos/README.md)
  images/         # General images
  icons/          # Icon files
  fonts/          # Font files (if any)
```

## Usage

Import assets using the `@/assets/` alias:

```typescript
import logo from '@/assets/logos/ventureup-logo.png';
import heroImage from '@/assets/images/hero-background.jpg';
```

## Benefits

- **Optimization**: Vite processes and optimizes images during build
- **Type Safety**: TypeScript can check if files exist
- **Tree Shaking**: Unused assets can be removed
- **Hashing**: File names are hashed for cache busting in production

## Notes

- All imports are relative to `src/assets/`
- Use the `@/assets/` alias configured in `vite.config.ts`
- Supported formats: PNG, JPG, SVG, GIF, WebP
