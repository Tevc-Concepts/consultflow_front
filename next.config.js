const withPWA = require('next-pwa')({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
    buildExcludes: [/middleware-manifest\.json$/],
    fallbacks: {
        document: '/offline.html'
    },
    runtimeCaching: [
        {
            // Cache API routes with NetworkFirst
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 10,
                expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
                cacheableResponse: { statuses: [0, 200] },
                plugins: [
                    {
                        // When offline and network-first fails, return a friendly JSON fallback
                        handlerDidError: async () => new Response(
                            JSON.stringify({ ok: false, offline: true, message: 'Offline. Please try again later.' }),
                            { status: 503, headers: { 'Content-Type': 'application/json' } }
                        )
                    }
                ]
            }
        },
        {
            // Cache images with CacheFirst
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
                cacheName: 'image-cache',
                expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
                cacheableResponse: { statuses: [0, 200] }
            }
        }
    ]
});

/** @type {import('next').NextConfig} */
const config = {
    images: {
        // Allow localhost images during development
        remotePatterns: [
            { protocol: 'http', hostname: 'localhost' },
            { protocol: 'https', hostname: 'localhost' }
        ]
    }
};

module.exports = withPWA(config);
