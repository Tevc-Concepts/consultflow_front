'use client';

import * as React from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import Button from '@components/ui/Button';
import BrandBadge from '@components/ui/BrandBadge';
import ReportSlide from '@shared/components/ReportSlide';
import { useDeck } from '@shared/state/deck';
import Link from 'next/link';

export interface AIWidgetProps {
    className?: string;
    companyId?: string;
    timeframe?: string; // e.g., last_90_days
}

type Mode = 'CEO' | 'CFO';

type AIResult = {
    summary: string;
    bullets: string[];
    suggestions: string[];
    slideNotes: string[];
};

const presets = [
    'Explain current cashflow',
    'Top 3 cost drivers',
    'Create slide for board meeting'
];

export default function AIWidget({ className, companyId = 'c1', timeframe = 'last_30_days' }: AIWidgetProps) {
    const [open, setOpen] = React.useState(false);
    const { addSlide } = useDeck();
    const [mode, setMode] = React.useState<Mode>('CEO');
    const [prompt, setPrompt] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [result, setResult] = React.useState<AIResult | null>(null);
    const [showSlide, setShowSlide] = React.useState(false);

    async function onAsk(e?: React.FormEvent) {
        e?.preventDefault?.();
        if (!prompt.trim()) return;
        setLoading(true);
        setResult(null);
        setShowSlide(false);
        try {
            const finalPrompt = `${mode} mode: ${prompt.trim()}`;
            const res = await axios.post<AIResult>('/api/demo/ai', { prompt: finalPrompt, companyId, timeframe });
            setResult(res.data);
        } catch (err) {
            setResult({
                summary: 'Unable to get AI response right now.',
                bullets: [],
                suggestions: [],
                slideNotes: []
            });
        } finally {
            setLoading(false);
        }
    }

    function applyPreset(text: string) {
        setPrompt(text);
        void onAsk();
    }

    function saveToBuilder(r: AIResult) {
        const title = mode === 'CEO' ? 'Executive Summary' : 'Financial Summary';
        addSlide({
            title,
            summary: r.summary,
            bullets: r.bullets,
            notes: r.slideNotes,
            mode,
            companyId,
            timeframe
        });
    }

    // Render result adjusted by mode (simplify for CEO)
    function renderResult(r: AIResult) {
        const bullets = mode === 'CEO' ? r.bullets.slice(0, 3).map((b) => simplifyText(b)) : r.bullets;
        return (
            <div className="mt-3 space-y-2">
                <div className="text-sm text-deep-navy/90">{mode === 'CEO' ? simplifyText(r.summary) : r.summary}</div>
                {bullets.length > 0 && (
                    <ul className="list-disc pl-5 text-sm space-y-1">
                        {bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                        ))}
                    </ul>
                )}
                <div className="pt-2 flex items-center gap-2">
                    <Button size="sm" onClick={() => setShowSlide(true)}>
                        Create Slide
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => saveToBuilder(r)}>
                        Save to Builder
                    </Button>
                    <Link href="/builder" className="text-xs text-cobalt underline underline-offset-2">Open Builder</Link>
                </div>
                {showSlide && (
                    <div className="mt-3">
                        <ReportSlide
                            title={mode === 'CEO' ? 'Executive Summary' : 'Financial Summary'}
                            summary={r.summary}
                            bullets={r.bullets}
                            notes={r.slideNotes}
                            mode={mode}
                            companyId={companyId}
                            timeframe={timeframe}
                        />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={["fixed bottom-20 right-4 z-40", className].filter(Boolean).join(' ')}>
            <AnimatePresence>
                {!open && (
                    <motion.button
                        key="fab"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setOpen(true)}
                        className="rounded-full bg-gradient-to-r from-brand-start to-brand-end px-4 py-2 text-sm font-medium text-white shadow-soft-1 hover:shadow-hover focus-visible:ring-2 focus-visible:ring-cobalt"
                        aria-haspopup="dialog"
                        aria-expanded={open}
                        aria-label="Open AI assistant"
                    >
                        <span className="inline-flex items-center gap-2">
                            <BrandBadge size={20}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3.5 w-3.5"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 3v4m0 10v4m9-9h-4M7 12H3m12.364-5.364l2.828 2.828M7.808 16.192l-2.828 2.828m0-13.656l2.828 2.828m10.728 8.0l-2.828 2.828" /></svg>
                            </BrandBadge>
                            Ask AI
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {open && (
                    <>
                        {/* Desktop modal */}
                        <motion.div
                            key="overlay"
                            className="hidden md:block fixed inset-0 bg-black/40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setOpen(false)}
                            aria-hidden
                        />
                        <motion.div
                            key="desktop"
                            className="hidden md:flex fixed inset-0 items-center justify-center p-6"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 16 }}
                        >
                            <div role="dialog" aria-modal="true" className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-soft">
                                <Header onClose={() => setOpen(false)} mode={mode} setMode={setMode} />
                                <Content prompt={prompt} setPrompt={setPrompt} loading={loading} onAsk={onAsk} applyPreset={applyPreset} result={result} renderResult={renderResult} />
                            </div>
                        </motion.div>

                        {/* Mobile compact panel */}
                        <motion.div
                            key="mobile"
                            className="md:hidden fixed bottom-24 right-4 w-80 rounded-2xl bg-white p-4 shadow-soft"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            role="dialog"
                            aria-modal="true"
                        >
                            <Header onClose={() => setOpen(false)} mode={mode} setMode={setMode} />
                            <Content prompt={prompt} setPrompt={setPrompt} loading={loading} onAsk={onAsk} applyPreset={applyPreset} result={result} renderResult={renderResult} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function Header({ onClose, mode, setMode }: { onClose: () => void; mode: Mode; setMode: (m: Mode) => void }) {
    return (
        <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-deep-navy">AI Assistant</h3>
            <div className="flex items-center gap-2">
                <div className="inline-flex rounded-full border border-medium/60 p-0.5" role="tablist" aria-label="Mode">
                    {(['CEO', 'CFO'] as Mode[]).map((m) => (
                        <button
                            key={m}
                            role="tab"
                            aria-selected={mode === m}
                            className={[
                                'px-3 py-1 text-xs rounded-full',
                                mode === m ? 'bg-medium/60 text-deep-navy font-medium' : 'text-deep-navy/80 hover:bg-medium/40'
                            ].join(' ')}
                            onClick={() => setMode(m)}
                        >
                            {m}
                        </button>
                    ))}
                </div>
                <button
                    className="rounded-full px-2 py-1 text-xs text-deep-navy hover:bg-medium/40 focus-visible:ring-2 focus-visible:ring-cobalt"
                    onClick={onClose}
                    aria-label="Close"
                >
                    Close
                </button>
            </div>
        </div>
    );
}

function Content({
    prompt,
    setPrompt,
    loading,
    onAsk,
    applyPreset,
    result,
    renderResult
}: {
    prompt: string;
    setPrompt: (v: string) => void;
    loading: boolean;
    onAsk: (e?: React.FormEvent) => void;
    applyPreset: (v: string) => void;
    result: AIResult | null;
    renderResult: (r: AIResult) => React.ReactNode;
}) {
    return (
        <div className="mt-3">
            <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                    <button
                        key={p}
                        className="rounded-full bg-medium/40 px-2 py-1 text-xs text-deep-navy hover:bg-medium/60 focus-visible:ring-2 focus-visible:ring-cobalt"
                        onClick={() => applyPreset(p)}
                        aria-label={`Ask: ${p}`}
                    >
                        {p}
                    </button>
                ))}
            </div>
            <form onSubmit={onAsk} className="mt-3 flex gap-2">
                <label className="sr-only" htmlFor="ai-prompt">Prompt</label>
                <input
                    id="ai-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-1 rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                    placeholder="Ask about trends, cash, profit..."
                />
                <Button type="submit" variant="primary" size="sm" disabled={loading}>
                    {loading ? 'Thinking…' : 'Ask'}
                </Button>
            </form>
            {result ? renderResult(result) : null}
        </div>
    );
}

function simplifyText(text: string) {
    // Basic simplifier for CEO mode: trim and remove overly technical parts
    return text.replace(/\b(CAC|EBITDA|YoY|QoQ)\b/gi, (m) => m.toUpperCase()).replace(/\s+/g, ' ').trim();
}

export { AIWidget };
