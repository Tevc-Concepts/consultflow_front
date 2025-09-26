import type { Metadata } from 'next';
import '../styles/globals.css';
import { DeckProvider } from '@shared/state/deck';
import AppShell from '@shared/components/AppShell';
import ErrorBoundary from '@shared/components/ErrorBoundary';

export const metadata: Metadata = {
    title: {
        default: 'Consultflow',
        template: '%s • Consultflow'
    },
    description: 'Consultflow frontend scaffold with Next.js 15 and TailwindCSS',
    applicationName: 'Consultflow',
    metadataBase: new URL('http://localhost:3000'),
    icons: {
        icon: [
            { url: '/favicon.ico', type: 'image/x-icon' },
            { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
            { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
            { url: '/icons/favicon-48.png', sizes: '48x48', type: 'image/png' }
        ],
        apple: [
            { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
        ]
    },
    manifest: '/manifest.webmanifest'
};

export default function RootLayout({
    children
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script defer src="https://feedback.fish/ff.js?pid=2268faa5f0610b"></script>
            </head>
            <body className="min-h-screen bg-background text-foreground">
                <ErrorBoundary>
                    <DeckProvider>
                        <a href="#content" className="skip-link">Skip to content</a>
                        <AppShell>
                            {children}
                        </AppShell>
                    </DeckProvider>
                </ErrorBoundary>
            </body>
        </html>
    );
}
