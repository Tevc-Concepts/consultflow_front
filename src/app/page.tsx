import Image from 'next/image';

export default function HomePage() {
    return (
        <div className="min-h-[calc(100vh-4rem)]">
            <section className="gradient-hero">
                <div className="container py-10 md:py-16">
                    {/* Hero lockup: stacked logo on mobile, secondary horizontal on desktop */}
                    <div className="flex items-center gap-3">
                        <span className="md:hidden inline-flex items-center">
                            <Image
                                src="/images/consulflow_stacked.jpg"
                                alt="Consultflow"
                                width={40}
                                height={40}
                                priority
                                sizes="(max-width: 768px) 40px"
                                className="h-10 w-auto"
                            />
                        </span>
                        <span className="hidden md:inline-flex items-center">
                            <Image
                                src="/images/consultflow_secondary.jpg"
                                alt="Consultflow"
                                width={200}
                                height={40}
                                priority
                                sizes="(min-width: 768px) 200px"
                                className="h-10 w-auto"
                            />
                        </span>
                        <h1 className="text-white">Welcome to Consultflow</h1>
                    </div>
                    <p className="mt-3 max-w-2xl text-white/90">
                        A modern, accessible Next.js 15 + TailwindCSS scaffold with a responsive layout,
                        desktop sidebar, and mobile bottom navigation.
                    </p>
                </div>
            </section>

            <section className="container -mt-6 md:-mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Primary card per visual rules: rounded-2xl, gradient brand, text-white, soft shadow */}
                    <article className="primary-card pad-responsive" aria-label="Getting started">
                        <h2>Getting started</h2>
                        <p className="mt-2 text-white/90">Edit <code className="font-mono">src/app/page.tsx</code> to explore the scaffold.</p>
                    </article>
                    <article className="card p-5" aria-label="Design tokens">
                        <h2>Design tokens</h2>
                        <p className="mt-2">Tailwind-powered tokens: gradients, soft shadows, and rounded cards.</p>
                    </article>
                </div>
            </section>
        </div>
    );
}
