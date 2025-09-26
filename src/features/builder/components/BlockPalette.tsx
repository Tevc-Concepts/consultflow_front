'use client';

import React from 'react';
import { BlockKind } from '../types';

const blockTypes: { kind: BlockKind; label: string; icon: React.ReactNode; description: string }[] = [
    {
        kind: 'kpis',
        label: 'KPIs',
        description: 'Key performance indicators',
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        )
    },
    {
        kind: 'chart',
        label: 'Chart',
        description: 'Visual data representation',
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        )
    },
    {
        kind: 'narrative',
        label: 'Text',
        description: 'Narrative content',
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
        )
    },
    {
        kind: 'table',
        label: 'Table',
        description: 'Tabular data',
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0V8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
        )
    },
    {
        kind: 'raw',
        label: 'Raw Data',
        description: 'Custom content',
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
        )
    }
];

export default function BlockPalette() {
    const onDragStart = (e: React.DragEvent, kind: BlockKind) => {
        e.dataTransfer.setData('text/block-kind', kind);
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="w-64 shrink-0 border-l border-medium/60 bg-white overflow-y-auto">
            <div className="p-4 border-b border-medium/60">
                <h2 className="font-semibold mb-2">Block Palette</h2>
                <p className="text-xs text-deep-navy/70">
                    Drag blocks to add to your slides
                </p>
            </div>

            <div className="p-3 space-y-2">
                {blockTypes.map(({ kind, label, icon, description }) => (
                    <div
                        key={kind}
                        draggable
                        onDragStart={(e) => onDragStart(e, kind)}
                        className="p-3 border border-medium/60 rounded-xl cursor-move hover:border-cobalt/50 hover:bg-cobalt/5 transition-colors group"
                    >
                        <div className="flex items-start gap-3">
                            <div className="text-deep-navy/70 group-hover:text-cobalt transition-colors">
                                {icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-deep-navy mb-1">
                                    {label}
                                </div>
                                <div className="text-xs text-deep-navy/60">
                                    {description}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-medium/60 mt-auto">
                <div className="text-xs text-deep-navy/60">
                    💡 Tip: You can also bind blocks to live data from your reports
                </div>
            </div>
        </div>
    );
}