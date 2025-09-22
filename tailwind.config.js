/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
        './src/app/**/*.{ts,tsx}',
        './src/shared/**/*.{ts,tsx}',
        './src/entities/**/*.{ts,tsx}',
        './src/features/**/*.{ts,tsx}',
        './src/components/**/*.{ts,tsx}'
    ],
    theme: {
        extend: {
            colors: {
                // Brand colors via CSS variables
                'deep-navy': 'var(--color-deep-navy)',
                'brand-start': 'var(--color-brand-start)',
                'brand-end': 'var(--color-brand-end)',
                'forest-green': 'var(--color-forest-green)',
                emerald: 'var(--color-emerald)',
                teal: 'var(--color-teal)',
                cobalt: 'var(--color-cobalt)',
                amber: 'var(--color-amber)',
                coral: 'var(--color-coral)',
                violet: 'var(--color-violet)',
                light: 'var(--color-light)',
                medium: 'var(--color-medium)',
                foreground: 'var(--color-foreground)',
                background: 'var(--color-background)'
            },
            boxShadow: {
                'soft-1': '0 8px 24px -12px rgb(12 35 64 / 0.08)',
                soft: '0 8px 30px -12px rgb(12 35 64 / 0.10)', // deep-navy/10
                hover: '0 12px 40px -12px rgb(39 116 255 / 0.20)' // cobalt/20
            },
            borderRadius: {
                '2xl': '1rem',
                full: '9999px'
            },
            container: {
                center: true,
                padding: {
                    DEFAULT: '1rem',
                    md: '2rem',
                    lg: '2.5rem'
                }
            }
        }
    },
    plugins: []
};
