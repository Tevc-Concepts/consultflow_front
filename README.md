# Consultflow Frontend Scaffold

TypeScript Next.js 15 app using the App Router and TailwindCSS. Includes a desktop sidebar, mobile bottom navigation, and accessible defaults.

## Features

- Next.js 15 (App Router) + TypeScript
- TailwindCSS with brand design tokens (colors, gradients, soft shadows, rounded cards)
- Accessible, mobile-first layout
- Desktop sidebar + bottom mobile navigation

## Prerequisites

- Node.js 18+ and npm 9+

## Install

```bash
npm install
```

## Run the dev server

```bash
npm run dev
```

Visit http://localhost:3000

## Build for production

```bash
npm run build
npm start
```

## Lint

```bash
npm run lint
```

## Project structure

```
src/
  app/
    layout.tsx      # Top-level layout (imports globals, sidebar + mobile nav)
    page.tsx        # Sample home page
  shared/
    components/
      Sidebar.tsx   # Accessible sidebar (desktop)
      MobileNav.tsx # Accessible bottom nav (mobile)
  styles/
    globals.css     # Tailwind directives + design tokens
```

## Notes

- All components are TypeScript and export both default and named exports.
- Design tokens (colors etc.) live in CSS variables and are mapped into Tailwind theme.
- Customize navigation links in `src/shared/components/*`.
