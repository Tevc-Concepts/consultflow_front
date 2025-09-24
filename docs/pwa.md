# PWA Behavior

The app uses `next-pwa` to generate and register a service worker for offline capabilities.

## Service worker

- Registered automatically from `node_modules/next-pwa/register.js`
- Uses the service worker file at `public/sw.js`

## Offline fallback

- When network and cache are unavailable, pages fall back to `public/offline.html`
- Manifest and icons are in `public/manifest.webmanifest` and `public/icons/*`

## Notes

- In demo mode, the API calls are short-circuited locally, improving offline resilience
- For production, ensure cache strategies match backend invariants and security requirements
