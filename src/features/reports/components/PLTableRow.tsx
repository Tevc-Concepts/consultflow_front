'use client';

import React from 'react';
import { PLRow } from '../types';

interface PLTableRowProps {
    row: PLRow;
    isExpanded: boolean;
    onToggleExpanded: (key: string) => void;
    formatCurrency: (amount: number) => string;
    onDrillDown?: (accountCode: string, accountName: string) => void;
}

export default function PLTableRow({ 
    row, 
    isExpanded, 
    onToggleExpanded, 
    formatCurrency,
    onDrillDown 
}: PLTableRowProps) {
    return (
        <tr
            className={[
                'border-b border-medium/40 hover:bg-medium/20',
                row.type === 'Revenue' ? 'text-emerald' : row.type === 'COGS' ? 'text-amber' : 'text-deep-navy'
            ].join(' ')}
        >
            <td className="py-2 pr-4">
                <div className="flex items-center gap-2">
                    {row.expandable && (
                        <button
                            onClick={() => onToggleExpanded(row.key)}
                            className="text-deep-navy/70 hover:text-deep-navy"
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        >
                            <svg
                                className={[
                                    'h-3 w-3 transition-transform',
                                    isExpanded ? 'rotate-90' : ''
                                ].join(' ')}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </button>
                    )}
                    <span className={row.type === 'Computed' ? 'font-semibold' : ''}>
                        {row.label}
                    </span>
                </div>
            </td>
            <td className="py-2 text-right">
                <div className="flex items-center justify-end gap-2">
                    <span className={row.type === 'Computed' ? 'font-semibold' : ''}>
                        {formatCurrency(row.amount)}
                    </span>
                    {onDrillDown && row.type !== 'Computed' && (
                        <button
                            onClick={() => onDrillDown(row.key, row.label)}
                            className="text-cobalt hover:text-cobalt/80 ml-2"
                            title="Drill down to transactions"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}