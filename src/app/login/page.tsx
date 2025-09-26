'use client';

import * as React from 'react';
import Link from 'next/link';
import LoginForm from '@features/auth/LoginForm';

export default function LoginPage() {
    return (
        <div className="min-h-[60vh] grid place-items-center">
            <div className="w-full max-w-md space-y-4">
                <LoginForm />
                
                <div className="text-center">
                    <p className="text-xs text-deep-navy/70">
                        Or try the{' '}
                        <Link href="/onboarding" className="underline text-cobalt hover:no-underline">
                            demo mode
                        </Link>
                        {' '}to explore with sample data.
                    </p>
                </div>
            </div>
        </div>
    );
}
