import * as React from 'react';

export interface ReportSlideProps {
    title: string;
    summary: string;
    bullets: string[];
    notes?: string[];
    mode?: 'CEO' | 'CFO';
    companyId?: string;
    timeframe?: string;
}

export default function ReportSlide({ title, summary, bullets, notes, mode = 'CEO', companyId, timeframe }: ReportSlideProps) {
    return (
        <section aria-label="Report Slide" className="rounded-2xl border border-medium/60 p-4">
            <header className="mb-2">
                <h4 className="text-base font-semibold text-deep-navy">{title}</h4>
                <p className="text-xs text-deep-navy/70">Company {companyId ?? '—'} • {timeframe ?? '—'} • Mode: {mode}</p>
            </header>
            <p className="text-sm text-deep-navy/90">{summary}</p>
            {bullets?.length ? (
                <ul className="mt-2 list-disc pl-5 text-sm space-y-1">
                    {bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                    ))}
                </ul>
            ) : null}
            {notes?.length ? (
                <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium">Presenter notes</summary>
                    <ul className="mt-1 list-disc pl-5 text-xs space-y-1 text-deep-navy/80">
                        {notes.map((n, i) => (
                            <li key={i}>{n}</li>
                        ))}
                    </ul>
                </details>
            ) : null}
        </section>
    );
}

export { ReportSlide };
