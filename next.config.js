const withPWA = require('@ducanh2912/next-pwa').default({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development' || process.env.VERCEL === '1',
    register: true,
    skipWaiting: true,
    buildExcludes: [/middleware-manifest\.json$/],
    fallbacks: {
        document: '/offline.html'
    }
});

/** @type {import('next').NextConfig} */
const config = {
    images: {
        // Allow localhost images during development and Vercel domains
        remotePatterns: [
            { protocol: 'http', hostname: 'localhost' },
            { protocol: 'https', hostname: 'localhost' },
            { protocol: 'https', hostname: '*.vercel.app' }
        ]
    },
    // Vercel optimizations
    serverExternalPackages: ['better-sqlite3'],
    // Ensure SQLite works in serverless environment
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.externals = config.externals || [];
            config.externals.push('better-sqlite3');
        }
        return config;
    }
};

module.exports = withPWA(config);
