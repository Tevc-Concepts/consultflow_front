'use client';

import * as React from 'react';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Link from 'next/link';

export default function LoginPage() {
    return (
        <div className="min-h-[60vh] grid place-items-center">
            <Card className="w-full max-w-md">
                <h1 className="text-xl font-semibold mb-2">Sign in to Consultflow</h1>
                <p className="text-sm text-deep-navy/70">Demo only — no real authentication yet.</p>
                <div className="mt-4 space-y-2">
                    <Button className="w-full">Continue with Email</Button>
                    <Button className="w-full" variant="ghost">Continue with Google</Button>
                    <Button className="w-full" variant="ghost">Continue with Microsoft</Button>
                </div>
                <div className="mt-3 text-xs text-deep-navy/70">
                    Or go to <Link href="/onboarding" className="underline">Onboarding</Link> to pick a demo company.
                </div>
            </Card>
        </div>
    );
}
