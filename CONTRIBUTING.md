# Contributing to Consultflow Frontend

Thanks for your interest in contributing! This document outlines how to propose changes and our coding standards.

## Getting started

1. Clone the repo and install dependencies:
   - `npm install`
2. Run the dev server:
   - `npm run dev`
3. Build to check types/linting:
   - `npm run build`

## Branching & commits

- Create feature branches from `main`
- Use clear, conventional commit messages when possible (e.g., `feat(reports): add drill-down rows`)

## Coding standards

- Follow the domain structure: `app/`, `shared/`, `components/ui/`, `styles/`
- Keep files readable and focused (aim <300 lines per file)
- Use TypeScript strictly; prefer explicit return types for public APIs
- Maintain accessibility and responsiveness
- Persist only minimal slices of state (LocalStorage) and guard for SSR

## Lint, test, build

- Lint: `npm run lint`
- Build (typecheck + lint + compile): `npm run build`
- Prefer adding unit tests around complex logic where feasible

## Pull requests

- Describe the problem and solution; include screenshots or GIFs for UI
- Note any breaking changes or migrations
- Reference related issues

## Security

- Do not commit secrets. Use environment variables where needed.

## Docs

- Update `docs/` and `README.md` when adding features or changing behavior
