# Public Logo Assets

This directory contains logo files that are served as static assets (not processed by Vite).

## Usage

Reference logos directly via URL path:

```typescript
// In JSX:
<img src="/logos/ventureup-logo.png" alt="VentureUP Link" />

// Or in CSS:
background-image: url('/logos/ventureup-logo.png');
```

## When to Use Public vs Assets

**Use `public/logos/` when:**
- You need to reference the logo by URL path (e.g., in HTML meta tags, Open Graph images)
- The logo needs to be accessible at a fixed URL
- You're using the logo in external contexts (email templates, etc.)

**Use `src/assets/logos/` when:**
- You want Vite to process and optimize the image
- You want type safety and import checking
- You want the logo to be bundled with your code

## File Structure

```
public/
  logos/
    ventureup-logo.png          # Main logo
    ventureup-logo-white.png    # White variant for dark backgrounds
    ventureup-logo-dark.png     # Dark variant for light backgrounds
    favicon.ico                 # Browser favicon
    favicon-32x32.png           # Favicon PNG
    apple-touch-icon.png        # iOS home screen icon
```

## Notes

- Files in `public/` are copied as-is to the build output
- Access files via `/logos/filename.png` (leading slash is important)
- No import needed - just use the path directly
