# Logo Assets

This directory contains logo image files that are imported and processed by Vite.

## Usage

Import logos in your components:

```typescript
import logo from '@/assets/logos/ventureup-logo.png';
import logoWhite from '@/assets/logos/ventureup-logo-white.png';

// Then use in JSX:
<img src={logo} alt="VentureUP Link" />
```

## Supported Formats

- PNG (recommended for logos with transparency)
- SVG (scalable vector graphics)
- JPG/JPEG (for logos without transparency)

## File Naming Convention

- Use kebab-case: `ventureup-logo.png`
- Include variant in name: `ventureup-logo-white.png`, `ventureup-logo-dark.png`
- Include size if needed: `ventureup-logo-32x32.png`, `ventureup-logo-64x64.png`

## Recommended Sizes

- **Favicon**: 32x32 or 16x16
- **Navbar/Header**: 40x40 to 64x64
- **Footer**: 80x80 to 120x120
- **Landing Page Hero**: 200x200 or larger
- **Email/Social**: 512x512

## Notes

- Files in this directory are processed by Vite and optimized during build
- Use `@/assets/logos/` alias (configured in vite.config.ts) for imports
- For static files that don't need processing, use `public/logos/` instead
