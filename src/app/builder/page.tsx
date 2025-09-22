'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { useDeck } from '@shared/state/deck';
import { Card } from '@components/ui/Card';
import Button from '@components/ui/Button';
import Modal from '@components/ui/Modal';
import ReportSlide from '@shared/components/ReportSlide';

// Types
type BlockKind = 'kpis' | 'chart' | 'narrative' | 'table' | 'raw';
type Id = string;

type Block = {
    id: Id;
    kind: BlockKind;
    data: any;
    binding?: 'none' | 'reports_kpis' | 'reports_chart' | 'tax_table';
};

type Slide = {
    id: Id;
    name: string;
    blocks: Block[];
};

type BuilderState = {
    slides: Slide[];
    current: Id | null;
    selectedBlock: Id | null;
};

const STORAGE_KEY = 'consultflow:builder:v1';

// Demo templates
const demoSlides: Slide[] = [
    {
        id: 's-1',
        name: 'Executive KPIs',
        blocks: [
            {
                id: 'b-1', kind: 'kpis', data: {
                    items: [
                        { label: 'Revenue', value: 1250000, delta: 8.4 },
                        { label: 'Gross Profit', value: 540000, delta: 5.1 },
                        { label: 'Net Income', value: 180000, delta: 3.7 },
                        { label: 'Cash Balance', value: 720000, delta: -2.3 },
                    ]
                }
            },
            { id: 'b-2', kind: 'narrative', data: { text: 'Growth led by enterprise deals; expenses stable; cash slightly down due to inventory purchases.' } },
        ]
    },
    {
        id: 's-2',
        name: 'Revenue vs Expenses',
        blocks: [
            {
                id: 'b-3', kind: 'chart', data: {
                    series: [
                        { date: 'Jan', revenue: 100, expenses: 70 },
                        { date: 'Feb', revenue: 120, expenses: 75 },
                        { date: 'Mar', revenue: 140, expenses: 90 },
                        { date: 'Apr', revenue: 135, expenses: 100 },
                        { date: 'May', revenue: 160, expenses: 110 },
                    ]
                }
            },
            { id: 'b-4', kind: 'table', data: { columns: ['Item', 'Amount'], rows: [['VAT Payable', '₦1,250,000'], ['PAYE', '₦740,000']] } },
        ]
    }
];

// Utils
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function useBuilderState(): [BuilderState, React.Dispatch<React.SetStateAction<BuilderState>>] {
    const [state, setState] = React.useState<BuilderState>(() => {
        if (typeof window === 'undefined') return { slides: demoSlides, current: 's-1', selectedBlock: null };
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw) as BuilderState;
        } catch { }
        return { slides: demoSlides, current: 's-1', selectedBlock: null };
    });

    React.useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { }
    }, [state]);

    return [state, setState];
}

// Block renderers
function KPIBlock({ data }: { data: { items: Array<{ label: string; value: number; delta?: number }> } }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.items.map((k, i) => (
                <div key={i} className="rounded-2xl border border-medium/60 p-3">
                    <div className="text-xs text-deep-navy/70">{k.label}</div>
                    <div className="text-lg font-semibold">{Intl.NumberFormat('en-NG').format(k.value)}</div>
                    {typeof k.delta === 'number' && (
                        <div className={['text-xs', k.delta >= 0 ? 'text-emerald-600' : 'text-coral'].join(' ')}>
                            {k.delta >= 0 ? '+' : ''}{k.delta}%
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function MiniChart({ data }: { data: Array<{ date: string; revenue: number; expenses: number }> }) {
    // simple SVG polyline chart
    const w = 520, h = 180, p = 20;
    const max = Math.max(...data.flatMap(d => [d.revenue, d.expenses]), 1);
    const x = (i: number) => p + (i * (w - 2 * p)) / Math.max(1, data.length - 1);
    const y = (v: number) => h - p - (v * (h - 2 * p)) / max;
    const path = (key: 'revenue' | 'expenses') => data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d[key])}`).join(' ');
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-48">
            <rect x={0} y={0} width={w} height={h} fill="white" />
            <path d={path('revenue')} stroke="#2774FF" fill="none" strokeWidth={2} />
            <path d={path('expenses')} stroke="#FF6F59" fill="none" strokeWidth={2} />
        </svg>
    );
}

function NarrativeBlock({ text }: { text: string }) {
    return <p className="text-sm md:text-base text-deep-navy/90 leading-relaxed">{text}</p>;
}

function TableBlock({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-medium/60 rounded-xl">
                <thead className="bg-medium/40 text-deep-navy">
                    <tr>
                        {columns.map((c, i) => (
                            <th key={i} className="px-3 py-2 text-left font-medium">{c}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i} className="odd:bg-white even:bg-medium/20">
                            {r.map((cell, j) => (
                                <td key={j} className="px-3 py-2">{cell}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function RawBlock({ data }: { data: any }) {
    return <pre className="text-xs md:text-sm bg-medium/20 rounded-xl p-3 overflow-auto max-h-48">{JSON.stringify(data, null, 2)}</pre>;
}

function BlockRenderer({ block, onMove, onRemove, selected, onSelect }: {
    block: Block;
    selected: boolean;
    onSelect: () => void;
    onMove: (dir: -1 | 1) => void;
    onRemove: () => void;
}) {
    return (
        <div
            className={[
                'rounded-2xl border p-4 mb-3 bg-white',
                selected ? 'border-cobalt ring-2 ring-cobalt/40' : 'border-medium/60'
            ].join(' ')}
            role="group"
            tabIndex={0}
            onClick={onSelect}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="text-xs uppercase tracking-wide text-deep-navy/70">{block.kind}</div>
                <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => onMove(-1)}>↑</Button>
                    <Button size="sm" variant="ghost" onClick={() => onMove(1)}>↓</Button>
                    <Button size="sm" variant="danger" onClick={onRemove}>Remove</Button>
                </div>
            </div>
            {block.kind === 'kpis' && <KPIBlock data={block.data} />}
            {block.kind === 'chart' && <MiniChart data={block.data.series} />}
            {block.kind === 'narrative' && <NarrativeBlock text={block.data.text} />}
            {block.kind === 'table' && <TableBlock columns={block.data.columns} rows={block.data.rows} />}
            {block.kind === 'raw' && <RawBlock data={block.data} />}
        </div>
    );
}

export default function BuilderPage() {
    const [state, setState] = useBuilderState();
    const currentIdx = state.slides.findIndex(s => s.id === state.current);
    const current = state.slides[currentIdx] ?? null;
    const containerRef = React.useRef<HTMLDivElement>(null);
    const slideRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
    const deck = useDeck();
    const [dragOverSlide, setDragOverSlide] = React.useState<string | null>(null);
    const [importOpen, setImportOpen] = React.useState(false);
    const [importSelection, setImportSelection] = React.useState<Record<string, boolean>>({});
    const stripRef = React.useRef<HTMLDivElement>(null);

    // Demo API data for live bindings
    type ReportsResp = { kpis: Array<{ label: string; value: number; delta?: number }>; series: Array<{ date: string; revenue: number; expenses: number }>; };
    type TaxResp = { vat?: { totalPayable?: number }; paye?: { total?: number }; cit?: { total?: number } };
    const [reportsData, setReportsData] = React.useState<ReportsResp | null>(null);
    const [taxData, setTaxData] = React.useState<TaxResp | null>(null);

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const [r, t] = await Promise.all([
                    axios.get<ReportsResp>('/api/demo/reports'),
                    axios.get<TaxResp>('/api/demo/tax-summary')
                ]);
                if (!mounted) return;
                setReportsData({
                    kpis: (r.data as any).kpis ?? [],
                    series: (r.data as any).series ?? []
                });
                setTaxData(t.data ?? {} as any);
            } catch (e) {
                // best-effort; keep null
            }
        })();
        return () => { mounted = false; };
    }, []);

    // Drag and drop: palette -> slide (append)
    function onDropPalette(e: React.DragEvent, slideId: Id) {
        e.preventDefault();
        const kind = e.dataTransfer.getData('text/block-kind') as BlockKind;
        if (!kind) return;
        addBlockToSlide(slideId, kind);
    }
    function onDragOver(e: React.DragEvent) { e.preventDefault(); }

    function addBlockToSlide(slideId: Id, kind: BlockKind) {
        setState(s => ({
            ...s,
            slides: s.slides.map(sl => sl.id === slideId ? ({
                ...sl,
                blocks: [...sl.blocks, createDefaultBlock(kind)]
            }) : sl)
        }));
    }

    function createDefaultBlock(kind: BlockKind): Block {
        if (kind === 'kpis') return { id: uid(), kind, data: { items: [{ label: 'Revenue', value: 100000 }, { label: 'Gross Profit', value: 50000 }, { label: 'Net Income', value: 20000 }, { label: 'Cash', value: 80000 }] }, binding: 'none' };
        if (kind === 'chart') return { id: uid(), kind, data: { series: [{ date: 'Jan', revenue: 100, expenses: 60 }, { date: 'Feb', revenue: 120, expenses: 80 }] }, binding: 'none' };
        if (kind === 'narrative') return { id: uid(), kind, data: { text: 'Enter narrative here...' }, binding: 'none' };
        if (kind === 'table') return { id: uid(), kind, data: { columns: ['Name', 'Amount'], rows: [['Sample', '₦100,000']] }, binding: 'none' };
        return { id: uid(), kind: 'raw', data: { any: 'Place raw JSON here' }, binding: 'none' };
    }

    function addSlide(template?: Slide) {
        setState(s => {
            const slide: Slide = template ? { ...template, id: uid(), blocks: template.blocks.map(b => ({ ...b, id: uid() })) } : { id: uid(), name: `Slide ${s.slides.length + 1}`, blocks: [] };
            return { ...s, slides: [...s.slides, slide], current: slide.id };
        });
        setTimeout(() => {
            const el = slideRefs.current[state.current ?? ''];
            el?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }, 30);
    }

    function removeSlide(id: Id) {
        setState(s => {
            const slides = s.slides.filter(sl => sl.id !== id);
            const current = slides[slides.length - 1]?.id ?? null;
            return { ...s, slides, current, selectedBlock: null };
        });
    }

    function selectSlide(id: Id) { setState(s => ({ ...s, current: id, selectedBlock: null })); }

    function updateSlideName(id: Id, name: string) {
        setState(s => ({ ...s, slides: s.slides.map(sl => sl.id === id ? { ...sl, name } : sl) }));
    }

    function selectBlock(id: Id) { setState(s => ({ ...s, selectedBlock: id })); }
    function updateBlock(blockId: Id, updater: (b: Block) => Block) {
        setState(s => ({
            ...s,
            slides: s.slides.map(sl => sl.id !== state.current ? sl : ({
                ...sl,
                blocks: sl.blocks.map(b => b.id === blockId ? updater(b) : b)
            }))
        }));
    }
    function moveBlock(blockId: Id, dir: -1 | 1) {
        setState(s => ({
            ...s,
            slides: s.slides.map(sl => sl.id !== state.current ? sl : ({
                ...sl,
                blocks: (() => {
                    const idx = sl.blocks.findIndex(b => b.id === blockId);
                    if (idx < 0) return sl.blocks;
                    const next = [...sl.blocks];
                    const newIdx = Math.min(next.length - 1, Math.max(0, idx + dir));
                    const [item] = next.splice(idx, 1);
                    next.splice(newIdx, 0, item);
                    return next;
                })()
            }))
        }));
    }
    function removeBlock(blockId: Id) {
        setState(s => ({
            ...s,
            slides: s.slides.map(sl => sl.id !== state.current ? sl : ({
                ...sl,
                blocks: sl.blocks.filter(b => b.id !== blockId)
            })),
            selectedBlock: s.selectedBlock === blockId ? null : s.selectedBlock
        }));
    }

    // Touch-friendly: add buttons to append blocks without drag on small screens
    const isSmall = typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false;

    // Deck integration: import/export
    function deckToBuilderSlide(d: import('@shared/state/deck').Slide): Slide {
        const bulletsText = (d.bullets ?? []).map(b => `• ${b}`).join('\n');
        const blocks: Block[] = [];
        if (d.summary) blocks.push({ id: uid(), kind: 'narrative', data: { text: d.summary }, binding: 'none' });
        if (d.bullets?.length) blocks.push({ id: uid(), kind: 'raw', data: { bullets: d.bullets }, binding: 'none' });
        return { id: uid(), name: d.title || 'Imported Slide', blocks };
    }

    function builderSlideToDeck(sl: Slide): Omit<import('@shared/state/deck').Slide, 'id' | 'createdAt'> {
        const title = sl.name;
        const summary = sl.blocks.find(b => b.kind === 'narrative')?.data?.text || 'Summary';
        const kpiBlock = sl.blocks.find(b => b.kind === 'kpis');
        const bullets: string[] = kpiBlock ? (kpiBlock.data.items ?? []).map((it: any) => `${it.label}: ${Intl.NumberFormat('en-NG').format(it.value)}${typeof it.delta === 'number' ? ` (${it.delta}%)` : ''}`) : [];
        return { title, summary, bullets, notes: [], mode: 'CEO', companyId: 'demo', timeframe: 'last_90_days' };
    }

    function importAllFromDeck() {
        if (!deck) return;
        setState(s => ({ ...s, slides: [...s.slides, ...deck.slides.map(deckToBuilderSlide)] }));
    }

    function exportCurrentToDeck() {
        if (!deck || !current) return;
        deck.addSlide(builderSlideToDeck(current));
    }

    // Slide-level reordering via drag-and-drop
    function onSlideDragStart(e: React.DragEvent, slideId: Id) {
        e.dataTransfer.setData('text/slide-id', slideId);
        e.dataTransfer.effectAllowed = 'move';
    }
    function onSlideDragOver(e: React.DragEvent, targetId: Id) {
        e.preventDefault();
        setDragOverSlide(targetId);
        e.dataTransfer.dropEffect = 'move';
    }
    function onSlideDrop(e: React.DragEvent, targetId: Id) {
        e.preventDefault();
        setDragOverSlide(null);
        const dragId = e.dataTransfer.getData('text/slide-id');
        if (!dragId || dragId === targetId) return;
        setState(s => {
            const srcIdx = s.slides.findIndex(sl => sl.id === dragId);
            const dstIdx = s.slides.findIndex(sl => sl.id === targetId);
            if (srcIdx < 0 || dstIdx < 0) return s;
            const next = [...s.slides];
            const [item] = next.splice(srcIdx, 1);
            next.splice(dstIdx, 0, item);
            const current = s.current && next.some(sl => sl.id === s.current) ? s.current : next[0]?.id ?? null;
            return { ...s, slides: next, current };
        });
    }
    function moveSlide(dir: -1 | 1) {
        if (!state.current) return;
        setState(s => {
            const idx = s.slides.findIndex(sl => sl.id === s.current);
            if (idx < 0) return s;
            const newIdx = Math.min(s.slides.length - 1, Math.max(0, idx + dir));
            if (newIdx === idx) return s;
            const slides = [...s.slides];
            const [item] = slides.splice(idx, 1);
            slides.splice(newIdx, 0, item);
            return { ...s, slides };
        });
    }

    // Live binding application
    function applyBinding(b: Block): Block {
        if (!b.binding || b.binding === 'none') return b;
        if (b.kind === 'kpis' && b.binding === 'reports_kpis' && reportsData) {
            return { ...b, data: { items: (reportsData.kpis ?? []).slice(0, 4) } };
        }
        if (b.kind === 'chart' && b.binding === 'reports_chart' && reportsData) {
            return { ...b, data: { series: reportsData.series ?? [] } };
        }
        if (b.kind === 'table' && b.binding === 'tax_table' && taxData) {
            const rows: (string | number)[][] = [];
            if (taxData.vat?.totalPayable != null) rows.push(['VAT Payable', Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(taxData.vat.totalPayable)]);
            if (taxData.paye?.total != null) rows.push(['PAYE', Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(taxData.paye.total)]);
            if (taxData.cit?.total != null) rows.push(['CIT', Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(taxData.cit.total)]);
            return { ...b, data: { columns: ['Item', 'Amount'], rows } };
        }
        return b;
    }

    async function exportPDF() {
        const [{ jsPDF }, html2canvas] = await Promise.all([
            import('jspdf'),
            import('html2canvas')
        ]);
        const pdf = new jsPDF('p', 'pt', 'a4');
        for (let i = 0; i < state.slides.length; i++) {
            const sl = state.slides[i];
            const el = slideRefs.current[sl.id];
            if (!el) continue;
            const canvas = await html2canvas.default(el, { scale: 2, backgroundColor: '#ffffff' });
            const img = canvas.toDataURL('image/png');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth - 48;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            if (i > 0) pdf.addPage();
            pdf.addImage(img, 'PNG', 24, 24, imgWidth, Math.min(imgHeight, pageHeight - 48));
        }
        pdf.save('consultflow-report.pdf');
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)_280px] gap-4">
            {/* Left: palette */}
            <Card className="md:sticky md:top-4 h-max">
                <h2 className="text-lg font-semibold mb-3">Blocks</h2>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                    {(['kpis', 'chart', 'narrative', 'table', 'raw'] as BlockKind[]).map(kind => (
                        <div key={kind}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData('text/block-kind', kind)}
                            className="rounded-xl border border-medium/60 p-3 text-sm hover:bg-medium/40 cursor-grab active:cursor-grabbing select-none">
                            <div className="font-medium capitalize">{kind}</div>
                            {isSmall && current && (
                                <Button size="sm" className="mt-2" onClick={() => addBlockToSlide(current.id, kind)}>Add</Button>
                            )}
                        </div>
                    ))}
                </div>
                <h3 className="mt-4 text-sm font-semibold">Templates</h3>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-1 gap-2">
                    {demoSlides.map(t => (
                        <Button key={t.id} size="sm" variant="ghost" onClick={() => addSlide(t)}>{t.name}</Button>
                    ))}
                </div>
                <h3 className="mt-4 text-sm font-semibold">Deck</h3>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-1 gap-2">
                    <Button size="sm" variant="ghost" onClick={importAllFromDeck}>Import All</Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                        // initialize selection map
                        const map: Record<string, boolean> = {};
                        for (const d of deck.slides) map[d.id] = true;
                        setImportSelection(map);
                        setImportOpen(true);
                    }}>Choose from Deck</Button>
                    <Button size="sm" variant="ghost" onClick={exportCurrentToDeck} disabled={!current}>Export Current</Button>
                </div>
                <div className="mt-4 flex gap-2">
                    <Button size="sm" onClick={() => addSlide()}>New Slide</Button>
                    {current && (
                        <Button size="sm" variant="danger" onClick={() => removeSlide(current.id)}>Delete</Button>
                    )}
                </div>
                <div className="mt-4">
                    <Button size="sm" onClick={exportPDF}>Export PDF</Button>
                </div>
                {current && (
                    <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => moveSlide(-1)}>Move Left</Button>
                        <Button size="sm" variant="ghost" onClick={() => moveSlide(1)}>Move Right</Button>
                    </div>
                )}
            </Card>

            {/* Center: canvas with slides (horizontal swipe) */}
            <div className="overflow-x-auto snap-x snap-mandatory" ref={containerRef}>
                <div className="flex gap-4 min-w-max pr-4">
                    {state.slides.map((sl, idx) => (
                        <div key={sl.id}
                            ref={el => { slideRefs.current[sl.id] = el; }}
                            draggable
                            onDragStart={(e) => onSlideDragStart(e, sl.id)}
                            onDragOver={(e) => onSlideDragOver(e, sl.id)}
                            onDrop={(e) => onSlideDrop(e, sl.id)}
                            id={`slide-panel-${sl.id}`}
                            role="tabpanel"
                            aria-labelledby={`slide-tab-${sl.id}`}
                            className={["snap-center shrink-0 w-[860px] max-w-[92vw]", dragOverSlide === sl.id ? 'outline outline-2 outline-cobalt/60 rounded-2xl' : ''].join(' ')}>
                            <Card className={['p-5', state.current === sl.id ? 'ring-2 ring-cobalt' : ''].join(' ')}>
                                <div className="flex items-center justify-between mb-3">
                                    <input
                                        value={sl.name}
                                        onChange={(e) => updateSlideName(sl.id, e.target.value)}
                                        className="text-lg font-semibold bg-transparent outline-none border-b border-transparent focus:border-medium/60"
                                        aria-label="Slide name"
                                    />
                                    <div className="text-xs text-deep-navy/70">Slide {idx + 1} / {state.slides.length}</div>
                                </div>
                                <div
                                    className="min-h-[300px] md:min-h-[420px] rounded-2xl border border-dashed border-medium/60 p-3 md:p-6"
                                    onClick={() => selectSlide(sl.id)}
                                    onDrop={(e) => onDropPalette(e, sl.id)}
                                    onDragOver={onDragOver}
                                >
                                    {sl.blocks.length === 0 ? (
                                        <div className="h-full grid place-items-center text-deep-navy/60 text-sm">
                                            Drop blocks here (or tap Add on mobile)
                                        </div>
                                    ) : (
                                        sl.blocks.map((b) => {
                                            const rb = applyBinding(b);
                                            return (
                                                <BlockRenderer
                                                    key={b.id}
                                                    block={rb}
                                                    selected={state.selectedBlock === b.id}
                                                    onSelect={() => selectBlock(b.id)}
                                                    onMove={(dir) => moveBlock(b.id, dir)}
                                                    onRemove={() => removeBlock(b.id)}
                                                />
                                            );
                                        })
                                    )}
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
                {/* Navigation for desktop */}
                <div className="hidden md:flex justify-center gap-2 mt-2">
                    <Button size="sm" variant="ghost" onClick={() => {
                        const idx = Math.max(0, currentIdx - 1);
                        const id = state.slides[idx]?.id; if (!id) return; selectSlide(id); slideRefs.current[id]?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
                    }}>Prev</Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                        const idx = Math.min(state.slides.length - 1, currentIdx + 1);
                        const id = state.slides[idx]?.id; if (!id) return; selectSlide(id); slideRefs.current[id]?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
                    }}>Next</Button>
                </div>

                {/* Bottom slide strip with thumbnails */}
                <div className="mt-3">
                    <div ref={stripRef} role="tablist" aria-label="Slides" className="flex gap-2 overflow-x-auto py-2 px-1 rounded-xl border border-medium/60">
                        {state.slides.map((sl) => (
                            <div key={sl.id}
                                draggable
                                onDragStart={(e) => onSlideDragStart(e, sl.id)}
                                onDragOver={(e) => onSlideDragOver(e, sl.id)}
                                onDrop={(e) => onSlideDrop(e, sl.id)}
                                className={[
                                    'shrink-0 w-40 rounded-xl border cursor-pointer select-none',
                                    state.current === sl.id ? 'border-cobalt ring-1 ring-cobalt' : 'border-medium/60 hover:border-cobalt/60'
                                ].join(' ')}
                                role="tab"
                                id={`slide-tab-${sl.id}`}
                                aria-controls={`slide-panel-${sl.id}`}
                                aria-selected={state.current === sl.id}
                                tabIndex={state.current === sl.id ? 0 : -1}
                                onKeyDown={(e) => {
                                    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                                        e.preventDefault();
                                        const idx = state.slides.findIndex(s => s.id === state.current);
                                        const nextIdx = e.key === 'ArrowRight' ? Math.min(state.slides.length - 1, idx + 1) : Math.max(0, idx - 1);
                                        const nextId = state.slides[nextIdx]?.id;
                                        if (nextId) {
                                            selectSlide(nextId);
                                            slideRefs.current[nextId]?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
                                            const el = document.getElementById(`slide-tab-${nextId}`);
                                            el?.focus();
                                        }
                                    } else if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        selectSlide(sl.id);
                                        slideRefs.current[sl.id]?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
                                    }
                                }}
                                onClick={() => { selectSlide(sl.id); slideRefs.current[sl.id]?.scrollIntoView({ behavior: 'smooth', inline: 'center' }); }}
                            >
                                <div className="p-2 border-b border-medium/60 text-xs font-medium truncate">{sl.name}</div>
                                <div className="p-2 bg-white">
                                    {/* lightweight thumbnail: render first block or a placeholder */}
                                    {sl.blocks.length === 0 ? (
                                        <div className="h-20 grid place-items-center text-[10px] text-deep-navy/60">Empty</div>
                                    ) : (
                                        <div className="scale-90 origin-top-left translate-x-[-4px] translate-y-[-4px]">
                                            {(() => {
                                                const b = sl.blocks[0];
                                                if (b.kind === 'narrative') return <div className="text-[10px] line-clamp-3">{b.data.text}</div>;
                                                if (b.kind === 'kpis') return (
                                                    <div className="grid grid-cols-2 gap-1">
                                                        {b.data.items.slice(0, 4).map((it: any, i: number) => (
                                                            <div key={i} className="rounded-md border border-medium/60 p-1">
                                                                <div className="text-[9px] text-deep-navy/70 truncate">{it.label}</div>
                                                                <div className="text-[10px] font-semibold truncate">{Intl.NumberFormat('en-NG').format(it.value)}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                                if (b.kind === 'chart') return <div className="h-20 bg-medium/20 rounded" />;
                                                if (b.kind === 'table') return (
                                                    <div className="text-[10px]">
                                                        <div className="font-medium">{b.data.columns?.[0]} / {b.data.columns?.[1]}</div>
                                                        <div className="text-deep-navy/70">{b.data.rows?.length} rows</div>
                                                    </div>
                                                );
                                                return <div className="text-[10px]">Raw</div>;
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: settings */}
            <Card className="md:sticky md:top-4 h-max">
                <h2 className="text-lg font-semibold">Settings</h2>
                {!current ? (
                    <p className="text-sm text-deep-navy/70 mt-2">Select a slide</p>
                ) : (
                    <div className="space-y-4 mt-2">
                        <div>
                            <div className="text-xs font-medium text-deep-navy/70">Slide name</div>
                            <input value={current.name} onChange={(e) => updateSlideName(current.id, e.target.value)} className="w-full rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt" />
                        </div>
                        <div>
                            <div className="text-xs font-medium text-deep-navy/70">Selected block</div>
                            {!state.selectedBlock ? (
                                <div className="text-sm text-deep-navy/70">None</div>
                            ) : (
                                (() => {
                                    const b = current.blocks.find(x => x.id === state.selectedBlock);
                                    if (!b) return <div className="text-sm text-deep-navy/70">None</div>;
                                    return (
                                        <div className="space-y-3">
                                            <div className="text-xs uppercase tracking-wide text-deep-navy/60">{b.kind}</div>
                                            {['kpis', 'chart', 'table'].includes(b.kind) && (
                                                <div>
                                                    <div className="text-xs font-medium text-deep-navy/70">Data binding</div>
                                                    <select
                                                        value={b.binding ?? 'none'}
                                                        onChange={(e) => updateBlock(b.id, (blk) => ({ ...blk, binding: e.target.value as any }))}
                                                        className="mt-1 w-full rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                                                    >
                                                        <option value="none">None</option>
                                                        {b.kind === 'kpis' && <option value="reports_kpis">Demo KPIs (reports)</option>}
                                                        {b.kind === 'chart' && <option value="reports_chart">Demo Series (reports)</option>}
                                                        {b.kind === 'table' && <option value="tax_table">Demo Tax Summary</option>}
                                                    </select>
                                                </div>
                                            )}
                                            {b.kind === 'narrative' && (
                                                <textarea value={b.data.text}
                                                    onChange={(e) => updateBlock(b.id, (blk) => ({ ...blk, data: { ...blk.data, text: e.target.value } }))}
                                                    className="w-full rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt min-h-28" />
                                            )}
                                            {b.kind === 'kpis' && (
                                                <div className="space-y-2">
                                                    {b.data.items.map((it: any, i: number) => (
                                                        <div key={i} className="grid grid-cols-3 gap-2">
                                                            <input value={it.label} onChange={(e) => updateBlock(b.id, (blk) => { const items = [...blk.data.items]; items[i] = { ...items[i], label: e.target.value }; return { ...blk, data: { ...blk.data, items } }; })} className="rounded-xl border border-medium/60 px-2 py-1 text-xs" placeholder="Label" />
                                                            <input type="number" value={it.value} onChange={(e) => updateBlock(b.id, (blk) => { const items = [...blk.data.items]; items[i] = { ...items[i], value: Number(e.target.value) }; return { ...blk, data: { ...blk.data, items } }; })} className="rounded-xl border border-medium/60 px-2 py-1 text-xs" placeholder="Value" />
                                                            <input type="number" step="0.1" value={it.delta ?? 0} onChange={(e) => updateBlock(b.id, (blk) => { const items = [...blk.data.items]; items[i] = { ...items[i], delta: Number(e.target.value) }; return { ...blk, data: { ...blk.data, items } }; })} className="rounded-xl border border-medium/60 px-2 py-1 text-xs" placeholder="Δ%" />
                                                        </div>
                                                    ))}
                                                    <Button size="sm" variant="ghost" onClick={() => updateBlock(b.id, (blk) => ({ ...blk, data: { ...blk.data, items: [...blk.data.items, { label: 'New', value: 0, delta: 0 }] } }))}>Add KPI</Button>
                                                </div>
                                            )}
                                            {b.kind === 'table' && (
                                                <div className="space-y-2">
                                                    <div className="text-xs text-deep-navy/70">Rows</div>
                                                    {b.data.rows.map((row: any[], i: number) => (
                                                        <div key={i} className="grid grid-cols-2 gap-2">
                                                            <input value={row[0]} onChange={(e) => updateBlock(b.id, (blk) => { const rows = [...blk.data.rows]; rows[i] = [e.target.value, row[1]]; return { ...blk, data: { ...blk.data, rows } }; })} className="rounded-xl border border-medium/60 px-2 py-1 text-xs" />
                                                            <input value={row[1]} onChange={(e) => updateBlock(b.id, (blk) => { const rows = [...blk.data.rows]; rows[i] = [row[0], e.target.value]; return { ...blk, data: { ...blk.data, rows } }; })} className="rounded-xl border border-medium/60 px-2 py-1 text-xs" />
                                                        </div>
                                                    ))}
                                                    <Button size="sm" variant="ghost" onClick={() => updateBlock(b.id, (blk) => ({ ...blk, data: { ...blk.data, rows: [...blk.data.rows, ['Label', '₦0']] } }))}>Add Row</Button>
                                                </div>
                                            )}
                                            {b.kind === 'chart' && (
                                                <div className="space-y-2 text-xs text-deep-navy/70">
                                                    <div>Chart uses demo series (edit inline soon)</div>
                                                </div>
                                            )}
                                            {b.kind === 'raw' && (
                                                <textarea value={JSON.stringify(b.data, null, 2)} onChange={(e) => {
                                                    try { const v = JSON.parse(e.target.value); updateBlock(b.id, (blk) => ({ ...blk, data: v })); } catch { }
                                                }} className="w-full rounded-xl border border-medium/60 px-3 py-2 text-xs min-h-28 font-mono" />
                                            )}
                                        </div>
                                    );
                                })()
                            )}
                        </div>
                    </div>
                )}
            </Card>

            {/* Import from Deck modal */}
            <Modal open={importOpen} onOpenChange={setImportOpen} title="Import from Deck" description="Choose which AI-generated slides to import into the builder.">
                {deck.slides.length === 0 ? (
                    <p className="text-sm text-deep-navy/70">No slides in deck. Use the AI Assistant to create some first.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-2 max-h-80 overflow-auto pr-1">
                        {deck.slides.map(d => (
                            <label key={d.id} className="flex items-start gap-2 rounded-xl border border-medium/60 p-2 hover:bg-medium/40">
                                <input type="checkbox" className="mt-1"
                                    checked={!!importSelection[d.id]}
                                    onChange={(e) => setImportSelection(s => ({ ...s, [d.id]: e.target.checked }))} />
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-deep-navy">{d.title}</div>
                                    <div className="text-xs text-deep-navy/70 line-clamp-3 mb-2">{d.summary}</div>
                                    <div className="rounded-xl border border-dashed border-medium/60 p-2 bg-white">
                                        <div className="scale-90 origin-top-left">
                                            <ReportSlide title={d.title} summary={d.summary} bullets={d.bullets} notes={d.notes} mode={d.mode} companyId={d.companyId} timeframe={d.timeframe} />
                                        </div>
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                )}
                <div className="mt-3 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setImportOpen(false)} size="sm">Cancel</Button>
                    <Button size="sm" onClick={() => {
                        const chosen = deck.slides.filter(d => importSelection[d.id]);
                        if (chosen.length) setState(s => ({ ...s, slides: [...s.slides, ...chosen.map(deckToBuilderSlide)] }));
                        setImportOpen(false);
                    }}>Import Selected</Button>
                </div>
            </Modal>
        </div>
    );
}
