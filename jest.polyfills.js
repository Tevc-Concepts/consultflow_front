// Minimal polyfills for route tests when running in jsdom
if (typeof global.Request === 'undefined' && typeof window !== 'undefined') {
  global.Request = window.Request;
  global.Response = window.Response;
  global.Headers = window.Headers;
}
if (typeof global.URL === 'undefined' && typeof window !== 'undefined') {
  global.URL = window.URL;
}
if (typeof global.URLSearchParams === 'undefined' && typeof window !== 'undefined') {
  global.URLSearchParams = window.URLSearchParams;
}
